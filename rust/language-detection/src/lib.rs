#![deny(clippy::all)]

use napi_derive::napi;
use std::path::Path;
use file_identify::file_is_text;
use napi::Result;
use napi::Error;

mod languages;

#[napi]
fn read_text_file(path: String) -> Result<String> {
    let file_path = Path::new(&path);

    match file_is_text(file_path) {
        Ok(true) => (),
        Ok(false) => return Err(Error::from_reason("The specified file is not a text file.".to_string())),
        Err(e) => return Err(Error::from_reason(format!("Failed to determine file type: {}", e))),
    }

    return match std::fs::read_to_string(file_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(Error::from_reason(format!("Failed to read file: {}", e))),
    }
}

#[napi]
fn detect_language(path: String) -> Result<Option<String>> {
    let file_path = Path::new(&path);

    match file_is_text(file_path) {
        Ok(true) => (),
        Ok(false) => return Err(Error::from_reason("The specified file is not a text file.".to_string())),
        Err(e) => return Err(Error::from_reason(format!("Failed to determine file type: {}", e))),
    }

    match languages::detect_language(file_path) {
        Ok(language_id) => Ok(language_id),
        Err(e) => Err(Error::from_reason(format!("Failed to detect language: {}", e))),
    }
}