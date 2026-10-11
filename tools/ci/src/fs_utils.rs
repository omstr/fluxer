use std::fs;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;

/// conditional replacement for fs::copy(_,_)
/// which returns an unhandled permission syscall for windows docker regardless of filesystem bridge
pub fn copy_file(from: &Path, to: &Path) -> io::Result<u64> {
    match fs::copy(from, to) {
        Ok(n) => Ok(n),
        Err(e) if e.kind() == io::ErrorKind::PermissionDenied => copy_loop(from, to),
        Err(e) => Err(e),
    }
}

fn copy_loop(from: &Path, to: &Path) -> io::Result<u64> {
    let mut src = File::open(from)?;
    let mut dst = File::create(to)?;
    let mut buf = [0u8; 128 * 1024];
    let mut total = 0u64;
    loop {
        let n = src.read(&mut buf)?;
        if n == 0 {
            break;
        }
        dst.write_all(&buf[..n])?;
        total += n as u64;
    }
    dst.flush()?;
    Ok(total)
}
