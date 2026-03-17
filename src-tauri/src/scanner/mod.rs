mod files;
mod localized_names;
mod localized_paths;
mod manifest;
mod resolve;
mod types;

pub use types::DetectedGame;

use std::collections::HashMap;
use std::path::Path;

use files::{collect_save_files, scan_candidates};
use manifest::{fetch_manifest, resolve_candidates};
use resolve::{get_home, get_username};
use types::ManifestEntry;

pub fn scan_manual_game_blocking(name: String, paths: Vec<String>) -> DetectedGame {
    let save_files: Vec<_> = paths
        .iter()
        .flat_map(|p| collect_save_files(Path::new(p), &name))
        .collect();

    let existing_paths = paths
        .into_iter()
        .filter(|p| Path::new(p).exists())
        .collect();

    DetectedGame {
        name,
        steam_id: None,
        save_paths: existing_paths,
        save_files,
    }
}

pub fn scan_games_blocking() -> Result<Vec<DetectedGame>, String> {
    let body = fetch_manifest()?;

    let manifest: HashMap<String, ManifestEntry> =
        serde_yaml::from_str(&body).map_err(|e| format!("Failed to parse manifest: {}", e))?;

    let home = get_home()
        .map(|h| h.to_string_lossy().to_string())
        .ok_or("Cannot determine home directory")?;
    let username = get_username();

    let candidates = resolve_candidates(manifest, &home, &username);
    Ok(scan_candidates(candidates))
}
