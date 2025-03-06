// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::process::Command;
use std::sync::Mutex;
use tokio::net::TcpListener;
use std::path::Path;
use std::fs;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};

#[tauri::command]
async fn get_available_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    Ok(port)
}

#[tauri::command]
async fn start_tiddlywiki(port: u16) -> Result<(), String> {
    let tiddlywiki_cmd = Command::new("npx")
        .args(["tiddlywiki", ".", "--listen", &format!("port={}", port)])
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn init_wiki(wiki_folder: String) -> Result<(), String> {
    let boot_path = Path::new(&wiki_folder).join("tiddlywiki.info");

    if !boot_path.exists() {
        let output = Command::new("npx")
            .args(["tiddlywiki", &wiki_folder, "--init", "server"])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
    }

    Ok(())
}

#[tauri::command]
async fn build_wiki(wiki_path: String) -> Result<String, String> {
    let output = Command::new("npx")
        .args(["tiddlywiki", &wiki_path, "--build", "index"])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let output_path = Path::new(&wiki_path)
        .join("output")
        .join("index.html");

    Ok(output_path.to_string_lossy().to_string())
}

fn create_menu() -> Menu {
    let file_menu = Submenu::new(
        "文件",
        Menu::new()
            .add_item(CustomMenuItem::new("open_wiki", "打开 Wiki"))
            .add_item(CustomMenuItem::new("import_wiki", "导入单文件 Wiki"))
            .add_item(CustomMenuItem::new("build_wiki", "构建 Wiki"))
            .add_item(CustomMenuItem::new("open_browser", "在浏览器中打开 TiddlyWiki"))
            .add_item(CustomMenuItem::new("open_folder", "打开当前 Wiki 文件夹"))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit),
    );

    let help_menu = Submenu::new(
        "帮助",
        Menu::new()
            .add_item(CustomMenuItem::new("dev_tools", "打开开发者工具"))
            .add_item(CustomMenuItem::new("about", "关于")),
    );

    Menu::new().add_submenu(file_menu).add_submenu(help_menu)
}

fn create_system_tray() -> SystemTray {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show_hide", "显示/隐藏窗口"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "退出"));

    SystemTray::new().with_menu(tray_menu)
}

fn main() {
    tauri::Builder::default()
        .manage(TiddlyWikiState {
            port: Mutex::new(0),
        })
        .menu(create_menu())
        .system_tray(create_system_tray())
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "show_hide" => {
                        let window = app.get_window("main").unwrap();
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                        } else {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "dev_tools" => {
                    let window = event.window();
                    window.open_devtools();
                }
                "quit" => {
                    event.window().app_handle().exit(0);
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_available_port,
            start_tiddlywiki,
            init_wiki,
            build_wiki
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}