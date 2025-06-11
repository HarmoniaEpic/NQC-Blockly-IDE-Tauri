#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Command;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
struct CompileResult {
    success: bool,
    stdout: String,
    stderr: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SerialPort {
    name: String,
    path: String,
}

#[tauri::command]
async fn get_serial_ports() -> Result<Vec<SerialPort>, String> {
    let ports = serialport::available_ports()
        .map_err(|e| e.to_string())?;
    
    Ok(ports.into_iter().map(|p| SerialPort {
        name: p.port_name.clone(),
        path: p.port_name,
    }).collect())
}

#[tauri::command]
async fn compile_nqc(
    nqc_path: String,
    code: String,
    serial_port: String,
    target_type: String,
) -> Result<CompileResult, String> {
    // Create temporary file for NQC code
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join("temp_program.nqc");
    fs::write(&temp_file, code)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    // Build NQC command
    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg(format!("-T{}", target_type))
        .arg(temp_file.to_str().unwrap())
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    // Clean up temp file
    let _ = fs::remove_file(temp_file);

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn download_to_rcx(
    nqc_path: String,
    code: String,
    serial_port: String,
    target_type: String,
    program_slot: u8,
) -> Result<CompileResult, String> {
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join("temp_program.nqc");
    fs::write(&temp_file, code)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg(format!("-T{}", target_type))
        .arg("-d")
        .arg("-pgm")
        .arg(program_slot.to_string())
        .arg(temp_file.to_str().unwrap())
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    let _ = fs::remove_file(temp_file);

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn control_rcx(
    nqc_path: String,
    serial_port: String,
    action: String,
) -> Result<CompileResult, String> {
    let mut args = vec![format!("-S{}", serial_port)];
    
    match action.as_str() {
        "run" => args.push("-run".to_string()),
        "stop" => {
            args.push("-remote".to_string());
            args.push("0x0040".to_string());
            args.push("3".to_string());
        }
        "clear" => args.push("-clear".to_string()),
        _ => return Err(format!("Unknown action: {}", action)),
    }

    let output = Command::new(&nqc_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn download_firmware(
    nqc_path: String,
    firmware_path: String,
    serial_port: String,
) -> Result<CompileResult, String> {
    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg("-firmware")
        .arg(&firmware_path)
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn get_battery_level(
    nqc_path: String,
    serial_port: String,
) -> Result<CompileResult, String> {
    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg("-batterylevel")
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn set_rcx_time(
    nqc_path: String,
    serial_port: String,
    time: String,
) -> Result<CompileResult, String> {
    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg("-time")
        .arg(&time)
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn upload_datalog(
    nqc_path: String,
    serial_port: String,
) -> Result<CompileResult, String> {
    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg("-datalog")
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn get_program_slots(
    nqc_path: String,
    serial_port: String,
) -> Result<CompileResult, String> {
    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg("-pgm")
        .arg("-")
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
async fn get_memory_map(
    nqc_path: String,
    serial_port: String,
) -> Result<CompileResult, String> {
    let output = Command::new(&nqc_path)
        .arg(format!("-S{}", serial_port))
        .arg("-map")
        .output()
        .map_err(|e| format!("Failed to execute NQC: {}", e))?;

    Ok(CompileResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_serial_ports,
            compile_nqc,
            download_to_rcx,
            control_rcx,
            download_firmware,
            get_battery_level,
            set_rcx_time,
            upload_datalog,
            get_program_slots,
            get_memory_map
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
