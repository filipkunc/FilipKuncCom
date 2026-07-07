# lldb summary providers that decode V8 heap objects, so hovering a
# v8::Local<v8::String> in VS Code shows the text instead of `location_`.
#
# How: node ships ~480 `v8dbg_*` postmortem constants (int32 globals in the
# binary) describing V8's object layout for the exact V8 version compiled in.
# We read those at debug time and walk the heap by hand: Local -> handle slot
# -> tagged pointer -> map -> instance_type -> string representation. This is
# a miniature of what llnode does. Assumes official node builds (64-bit, no
# pointer compression).
#
# Loaded via initCommands in .vscode/launch.json:
#   command script import ${workspaceFolder}/debug/v8_formatters.py
import lldb

MAX_CHARS = 200
MAX_DEPTH = 10

_const_cache = {}  # process id -> {name: value}


def _consts(valobj):
    process = valobj.GetProcess()
    key = process.GetUniqueID()
    if key not in _const_cache:
        _const_cache[key] = {}
    cache = _const_cache[key]

    def const(name):
        if name not in cache:
            target = valobj.GetTarget()
            value = None
            for context in target.FindSymbols('v8dbg_' + name):
                addr = context.symbol.GetStartAddress().GetLoadAddress(target)
                if addr != lldb.LLDB_INVALID_ADDRESS:
                    error = lldb.SBError()
                    read = process.ReadUnsignedFromMemory(addr, 4, error)
                    if error.Success():
                        value = read
                        break
            cache[name] = value
        if cache[name] is None:
            raise LookupError('v8dbg_' + name)
        return cache[name]

    return const


def _reader(valobj):
    process = valobj.GetProcess()

    def read(addr, size):
        error = lldb.SBError()
        if size == 8:
            value = process.ReadPointerFromMemory(addr, error)
        else:
            value = process.ReadUnsignedFromMemory(addr, size, error)
        if not error.Success():
            raise IOError('read @%#x' % addr)
        return value

    def read_bytes(addr, size):
        error = lldb.SBError()
        data = process.ReadMemory(addr, size, error)
        if not error.Success():
            raise IOError('read @%#x' % addr)
        return data

    return read, read_bytes


# #region walk
def _decode_string(tagged, const, read, read_bytes, budget, depth):
    if depth > MAX_DEPTH:
        return '<deep>', 0
    # #region decode
    base = tagged & ~const('HeapObjectTagMask')
    map_addr = read(base + const('class_HeapObject__map__Map'), 8) & ~const('HeapObjectTagMask')
    itype = read(map_addr + const('class_Map__instance_type__uint16_t'), 2)
    length = read(base + const('class_String__length__int32_t'), 4)
    representation = itype & const('StringRepresentationMask')
    one_byte = (itype & const('StringEncodingMask')) == const('OneByteStringTag')

    if representation == const('SeqStringTag'):
        take = min(length, budget)
        if one_byte:
            chars = read_bytes(base + const('class_SeqOneByteString__chars__char'), take)
            return chars.decode('latin-1'), length
        chars = read_bytes(base + const('class_SeqTwoByteString__chars__char'), take * 2)
        return chars.decode('utf-16-le', 'replace'), length
    # #endregion decode
    if representation == const('ConsStringTag'):
        first = read(base + const('class_ConsString__first__String'), 8)
        second = read(base + const('class_ConsString__second__String'), 8)
        text, _ = _decode_string(first, const, read, read_bytes, budget, depth + 1)
        if len(text) < budget and second & const('HeapObjectTagMask'):
            more, _ = _decode_string(second, const, read, read_bytes, budget - len(text), depth + 1)
            text += more
        return text, length
    if representation == const('ThinStringTag'):
        actual = read(base + const('class_ThinString__actual__String'), 8)
        return _decode_string(actual, const, read, read_bytes, budget, depth + 1)
    if representation == const('SlicedStringTag'):
        parent = read(base + const('class_SlicedString__parent__String'), 8)
        offset = read(base + const('class_SlicedString__offset__SMI'), 8) >> (const('SmiShiftSize') + 1)
        text, _ = _decode_string(parent, const, read, read_bytes, offset + budget, depth + 1)
        return text[offset:offset + budget], length
    return '<external string, len %d>' % length, length


def _describe_tagged(tagged, const, read, read_bytes):
    if tagged & const('SmiTagMask') == 0:  # small integer, value in the upper bits
        if tagged >= 1 << 63:
            tagged -= 1 << 64
        return str(tagged >> (const('SmiShiftSize') + 1))

    base = tagged & ~const('HeapObjectTagMask')
    map_addr = read(base + const('class_HeapObject__map__Map'), 8) & ~const('HeapObjectTagMask')
    itype = read(map_addr + const('class_Map__instance_type__uint16_t'), 2)

    if itype & const('IsNotStringMask') == 0:
        text, length = _decode_string(tagged, const, read, read_bytes, MAX_CHARS, 0)
        suffix = '… (len %d)' % length if length > len(text) else ''
        return '"%s"%s' % (text, suffix)
    if itype == const('type_HeapNumber__HEAP_NUMBER_TYPE'):
        error = lldb.SBError()
        raw = read_bytes(base + const('class_HeapNumber__value__double'), 8)
        import struct
        return str(struct.unpack('<d', raw)[0])
    if itype == const('type_Oddball__ODDBALL_TYPE'):
        kind = read(base + const('class_Oddball__kind__int'), 8) >> (const('SmiShiftSize') + 1)
        names = {
            const('OddballUndefined'): 'undefined',
            const('OddballNull'): 'null',
            const('OddballTrue'): 'true',
            const('OddballFalse'): 'false',
        }
        return names.get(kind, '<oddball %d>' % kind)
    for label in ('JSObject__JS_OBJECT_TYPE', 'JSArray__JS_ARRAY_TYPE', 'JSFunction__JS_FUNCTION_TYPE'):
        if itype == const('type_' + label):
            return '<%s>' % label.split('__')[1]
    return '<instance_type %d>' % itype
# #endregion walk


def local_summary(valobj, internal_dict):
    """Summary for v8::Local<T> / v8::MaybeLocal<T>: one pointer, the handle slot."""
    try:
        error = lldb.SBError()
        location = valobj.GetData().GetUnsignedInt64(error, 0)
        if not error.Success():
            return ''
        if location == 0:
            return '<empty handle>'
        const = _consts(valobj)
        read, read_bytes = _reader(valobj)
        return _describe_tagged(read(location, 8), const, read, read_bytes)
    except (LookupError, IOError) as problem:
        return '<v8: %s>' % problem


def __lldb_init_module(debugger, internal_dict):
    debugger.HandleCommand(
        r'type summary add -x "^v8::(Maybe)?Local<.+>$" '
        '-F v8_formatters.local_summary -w v8'
    )
    debugger.HandleCommand('type category enable v8')
    print('v8_formatters: v8::Local values now render their JS contents')
