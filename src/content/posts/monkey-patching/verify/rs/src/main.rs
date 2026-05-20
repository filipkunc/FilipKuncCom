use frida_gum::{Gum, Module, NativePointer, interceptor::Interceptor};
use libc::{c_int, c_long, c_ulong, c_void};
use std::mem::transmute;
use std::sync::{Mutex, OnceLock};

type ReadFn = unsafe extern "C" fn(c_int, *mut c_void, c_ulong) -> c_long;
static ORIGINAL: Mutex<Option<ReadFn>> = Mutex::new(None);

unsafe extern "C" fn detour(
    fd: c_int,
    buf: *mut c_void,
    count: c_ulong,
) -> c_long {
    let read = ORIGINAL.lock().unwrap().unwrap();
    let n = unsafe { read(fd, buf, count) };
    if n > 0 {
        let bytes = unsafe {
            std::slice::from_raw_parts_mut(buf as *mut u8, n as usize)
        };
        if let Some(p) = bytes.windows(13).position(|w| w == b"Hello, world!") {
            bytes[p..p + 13].copy_from_slice(b"Hello, Filip!");
        }
    }
    n
}

fn install_hook() {
    static GUM: OnceLock<Gum> = OnceLock::new();
    let gum = GUM.get_or_init(Gum::obtain);
    let libc = Module::load(gum, "libc.so.6");
    let read = libc.find_export_by_name("read").unwrap();
    let mut interceptor = Interceptor::obtain(gum);
    unsafe {
        let orig = interceptor.replace(
            read,
            NativePointer(detour as *mut c_void),
            NativePointer(std::ptr::null_mut()),
        ).unwrap();
        *ORIGINAL.lock().unwrap() = Some(transmute(orig.0));
    }
}

fn main() {
    install_hook();
    let path = std::env::args().nth(1).expect("path arg");
    print!("{}", std::fs::read_to_string(&path).unwrap());
}
