use std::path::Path;
use file_identify::file_is_text;

mod languages;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_text_file(path: &str) -> Result<String, String> {
    let file_path = Path::new(path);

    match file_is_text(file_path) {
        Ok(true) => (),
        Ok(false) => return Err("The specified file is not a text file.".to_string()),
        Err(e) => return Err(format!("Failed to determine file type: {}", e)),
    }

    return match std::fs::read_to_string(file_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
fn detect_language(path: &str) -> Result<Option<String>, String> {
    let file_path = Path::new(path);

    match file_is_text(file_path) {
        Ok(true) => (),
        Ok(false) => return Err("The specified file is not a text file.".to_string()),
        Err(e) => return Err(format!("Failed to determine file type: {}", e)),
    }

    match languages::detect_language(file_path) {
        Ok(language_id) => Ok(language_id),
        Err(e) => Err(format!("Failed to detect language: {}", e)),
    }
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_text_file, detect_language])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
