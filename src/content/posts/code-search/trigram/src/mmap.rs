//! A tiny read-only memory map, so the index is paged in on demand instead of
//! read and parsed up front. No external crates: on unix we call the mmap and
//! munmap syscalls directly. Mapping the file instead of reading it is the same
//! trick the production indexers use to answer a query without ever touching
//! most of their index.

use std::fs::File;
use std::io;

pub struct Mmap {
    ptr: *const u8,
    len: usize,
}

#[cfg(unix)]
mod sys {
    use std::os::raw::{c_int, c_void};
    pub const PROT_READ: c_int = 0x1;
    pub const MAP_PRIVATE: c_int = 0x2;
    extern "C" {
        pub fn mmap(
            addr: *mut c_void,
            len: usize,
            prot: c_int,
            flags: c_int,
            fd: c_int,
            offset: i64,
        ) -> *mut c_void;
        pub fn munmap(addr: *mut c_void, len: usize) -> c_int;
    }
}

impl Mmap {
    #[cfg(unix)]
    pub fn open(file: &File) -> io::Result<Mmap> {
        use std::os::unix::io::AsRawFd;
        let len = file.metadata()?.len() as usize;
        if len == 0 {
            return Ok(Mmap { ptr: std::ptr::NonNull::<u8>::dangling().as_ptr(), len: 0 });
        }
        // PROT_READ + MAP_PRIVATE: a copy-on-write read-only view of the file.
        let ptr = unsafe {
            sys::mmap(std::ptr::null_mut(), len, sys::PROT_READ, sys::MAP_PRIVATE, file.as_raw_fd(), 0)
        };
        if ptr as isize == -1 {
            return Err(io::Error::last_os_error());
        }
        Ok(Mmap { ptr: ptr as *const u8, len })
    }

    // Platforms without mmap just read the file once. The benchmark is Linux.
    #[cfg(not(unix))]
    pub fn open(file: &File) -> io::Result<Mmap> {
        use std::io::Read;
        let mut bytes = Vec::new();
        file.try_clone()?.read_to_end(&mut bytes)?;
        let boxed = bytes.into_boxed_slice();
        let len = boxed.len();
        Ok(Mmap { ptr: Box::leak(boxed).as_ptr(), len })
    }

    pub fn as_slice(&self) -> &[u8] {
        // Safe: the mapping stays valid for the lifetime of `self`, and the
        // bytes are never written through this pointer.
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }
}

impl Drop for Mmap {
    fn drop(&mut self) {
        #[cfg(unix)]
        if self.len != 0 {
            unsafe {
                sys::munmap(self.ptr as *mut std::os::raw::c_void, self.len);
            }
        }
    }
}
