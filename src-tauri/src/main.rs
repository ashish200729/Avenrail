#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(all(debug_assertions, target_os = "macos"))]
    avenrail_lib::ensure_macos_dev_bundle();
    avenrail_lib::run()
}
