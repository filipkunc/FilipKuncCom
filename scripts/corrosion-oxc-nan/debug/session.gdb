# A scripted debugging session across all three layers.
# Run with: npm run debug   (gdb -q -x debug/session.gdb --args node demo.js)
#
# The addon is loaded with dlopen() long after gdb starts, so breakpoints on
# its symbols must be allowed to stay pending until then.
set breakpoint pending on
set pagination off
set print pretty on
set debuginfod enabled off

# V8 objects are tagged pointers into the JS heap; node compiles in debug
# helpers that render them. Usage: v8obj <a v8::Local variable>, v8bt.
define v8obj
  call (void)_v8_internal_Print_Object((void*)*(unsigned long*)($arg0.location_))
end
define v8bt
  call (void)_v8_internal_Print_StackTrace()
end

# Layer 2: the C++ NaN method (src/addon.cpp).
break AnalyzeJson

# Layer 3: the Rust function behind the C ABI (rust/src/lib.rs).
break oxc_bridge::analyze

run

echo \n=== stopped in C++ (NaN method), called from JS ===\n
# The frames below AnalyzeJson are V8 dispatching the JS call from demo.js:
# Builtins_CallApiCallback and friends. That anonymous machinery *is* the
# JS->C++ boundary; JS source frames only exist inside the inspector.
backtrace 8

echo \n=== v8bt: the JS stack behind those anonymous frames ===\n
v8bt

echo \n=== stepping until the Rust breakpoint ===\n
continue

echo \n=== stopped in Rust, C++ and V8 below it in one stack ===\n
backtrace 10

echo \n=== Rust locals via gdb's Rust support ===\n
info args

# Let the demo finish; each analyze() call would re-trigger the breakpoints.
delete breakpoints
continue
quit
