use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Debug, Deserialize)]
struct SteamInfo {
    id: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct ManifestEntry {
    files: Option<HashMap<String, serde_yaml::Value>>,
    steam: Option<SteamInfo>,
    #[allow(dead_code)]
    #[serde(flatten)]
    _rest: HashMap<String, serde_yaml::Value>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DetectedGame {
    pub name: String,
    pub steam_id: Option<u64>,
    pub save_paths: Vec<String>,
    pub save_files: Vec<SaveFileInfo>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SaveFileInfo {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub last_modified: u64, // ms since epoch
    pub game_name: String,
}

const MANIFEST_URL: &str =
    "https://raw.githubusercontent.com/mtkennerly/ludusavi-manifest/master/data/manifest.yaml";

fn get_home() -> Option<PathBuf> {
    dirs::home_dir()
}

fn get_username() -> String {
    get_home()
        .and_then(|h| h.file_name().map(|n| n.to_string_lossy().to_string()))
        .unwrap_or_default()
}

fn resolve_path(raw: &str, home: &str, username: &str) -> Option<String> {
    let mut resolved = raw.to_string();

    resolved = resolved.replace("<home>", home);
    resolved = resolved.replace("<Home>", home);
    resolved = resolved.replace("<osUserName>", username);
    resolved = resolved.replace("<OsUserName>", username);

    #[cfg(target_os = "windows")]
    {
        let appdata = format!("{}\\AppData\\Roaming", home);
        let local_appdata = format!("{}\\AppData\\Local", home);
        let docs = format!("{}\\Documents", home);
        let public_dir = "C:\\Users\\Public";
        resolved = resolved.replace("<winAppData>", &appdata);
        resolved = resolved.replace("<WinAppData>", &appdata);
        resolved = resolved.replace("<winLocalAppData>", &local_appdata);
        resolved = resolved.replace("<WinLocalAppData>", &local_appdata);
        resolved = resolved.replace("<winDocuments>", &docs);
        resolved = resolved.replace("<WinDocuments>", &docs);
        resolved = resolved.replace("<winPublic>", public_dir);
        resolved = resolved.replace("<WinPublic>", public_dir);
    }

    #[cfg(target_os = "macos")]
    {
        let app_support = format!("{}/Library/Application Support", home);
        resolved = resolved.replace("<xdgData>", &app_support);
        resolved = resolved.replace("<XdgData>", &app_support);
        resolved = resolved.replace("<xdgConfig>", &app_support);
        resolved = resolved.replace("<XdgConfig>", &app_support);
    }

    #[cfg(target_os = "linux")]
    {
        let xdg_data = format!("{}/.local/share", home);
        let xdg_config = format!("{}/.config", home);
        resolved = resolved.replace("<xdgData>", &xdg_data);
        resolved = resolved.replace("<XdgData>", &xdg_data);
        resolved = resolved.replace("<xdgConfig>", &xdg_config);
        resolved = resolved.replace("<XdgConfig>", &xdg_config);
    }

    // If unresolved variables remain, skip
    if resolved.contains('<') && resolved.contains('>') {
        return None;
    }

    // Normalize separators
    #[cfg(not(target_os = "windows"))]
    {
        resolved = resolved.replace('\\', "/");
    }

    // Strip trailing globs
    resolved = resolved
        .trim_end_matches("/**")
        .trim_end_matches("/*")
        .to_string();

    Some(resolved)
}

fn collect_save_files(dir: &Path, game_name: &str) -> Vec<SaveFileInfo> {
    let mut files = Vec::new();

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return files,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            files.extend(collect_save_files(&path, game_name));
        } else if path.is_file() {
            if let Ok(meta) = fs::metadata(&path) {
                let modified = meta
                    .modified()
                    .unwrap_or(SystemTime::UNIX_EPOCH)
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .map(|d| d.as_millis() as u64)
                    .unwrap_or(0);

                files.push(SaveFileInfo {
                    name: file_name,
                    path: path.to_string_lossy().to_string(),
                    size_bytes: meta.len(),
                    last_modified: modified,
                    game_name: game_name.to_string(),
                });
            }
        }
    }

    files
}

pub fn scan_games_blocking() -> Result<Vec<DetectedGame>, String> {
    // 1. Fetch manifest
    let body = reqwest::blocking::get(MANIFEST_URL)
        .map_err(|e| format!("Failed to download manifest: {}", e))?
        .text()
        .map_err(|e| format!("Failed to read manifest: {}", e))?;

    // 2. Parse YAML
    let manifest: HashMap<String, ManifestEntry> =
        serde_yaml::from_str(&body).map_err(|e| format!("Failed to parse manifest: {}", e))?;

    let home = get_home()
        .map(|h| h.to_string_lossy().to_string())
        .ok_or("Cannot determine home directory")?;
    let username = get_username();

    // 3. Resolve paths (single-threaded, fast — just string ops)
    let candidates: Vec<(String, Option<u64>, Vec<String>)> = manifest
        .into_iter()
        .filter_map(|(name, entry)| {
            let files = entry.files?;
            let steam_id = entry.steam.and_then(|s| s.id);
            let mut paths: Vec<String> = Vec::new();

            for raw_path in files.keys() {
                if let Some(resolved) = resolve_path(raw_path, &home, &username) {
                    if !paths.contains(&resolved) {
                        paths.push(resolved);
                    }
                }
            }

            if paths.is_empty() {
                None
            } else {
                Some((name, steam_id, paths))
            }
        })
        .collect();

    // 4. Scan disk in parallel with Rayon
    let mut games: Vec<DetectedGame> = candidates
        .into_par_iter()
        .filter_map(|(name, steam_id, paths)| {
            let mut valid_paths = Vec::new();
            let mut save_files = Vec::new();

            for path_str in &paths {
                let path = Path::new(path_str);
                if path.exists() {
                    valid_paths.push(path_str.clone());
                    save_files.extend(collect_save_files(path, &name));
                }
            }

            if save_files.is_empty() {
                None
            } else {
                Some(DetectedGame {
                    name,
                    steam_id,
                    save_paths: valid_paths,
                    save_files,
                })
            }
        })
        .collect();

    games.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(games)
}
