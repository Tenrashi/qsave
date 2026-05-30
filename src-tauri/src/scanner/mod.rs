mod cache;
mod epic;
mod files;
mod gog;
mod localized_names;
mod localized_paths;
mod manifest;
mod resolve;
mod steam;
mod types;

pub use types::DetectedGame;

use std::path::Path;

use epic::find_epic_app_roots;
use files::{collect_save_files, scan_candidates};
use localized_paths::resolve_localized_paths;
use gog::find_gog_app_roots;
use manifest::{fetch_manifest, resolve_candidates};
use resolve::{get_home, get_username};
use types::ResolvedCandidate;
use steam::{find_steam_app_roots, find_steam_libraries};

pub fn scan_manual_game_blocking(name: String, paths: Vec<String>) -> DetectedGame {
    let mut seen = std::collections::HashSet::new();
    let save_files: Vec<_> = paths
        .iter()
        .flat_map(|path| collect_save_files(Path::new(path), &name))
        .filter(|file| seen.insert(file.path.clone()))
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
        platform: None,
        has_steam_cloud: false,
    }
}

pub fn get_cached_games_blocking() -> Vec<DetectedGame> {
    cache::load()
}

pub fn scan_games_blocking() -> Result<Vec<DetectedGame>, String> {
    let manifest = fetch_manifest()?;

    let home = get_home()
        .map(|h| h.to_string_lossy().to_string())
        .ok_or("Cannot determine home directory")?;
    let username = get_username();

    let steam_libraries = find_steam_libraries();
    let steam_roots = find_steam_app_roots(&steam_libraries);
    let gog_roots = find_gog_app_roots();
    let epic_roots = find_epic_app_roots();

    let candidates = resolve_candidates(manifest, &home, &username, &steam_roots, &gog_roots, &epic_roots);
    let games = scan_candidates(candidates);
    cache::save(&games);
    Ok(games)
}

/// Resolve the expected save paths for a single game by name from the manifest,
/// without requiring any save files to exist on disk. Used to pre-fill a default
/// restore target for cloud-only auto-detected games on a fresh device. Returns
/// an empty vec for names not present in the manifest (e.g. manual games).
pub fn resolve_game_paths_blocking(name: String) -> Result<Vec<String>, String> {
    let manifest = fetch_manifest()?;

    let home = get_home()
        .map(|h| h.to_string_lossy().to_string())
        .ok_or("Cannot determine home directory")?;
    let username = get_username();

    let steam_libraries = find_steam_libraries();
    let steam_roots = find_steam_app_roots(&steam_libraries);
    let gog_roots = find_gog_app_roots();
    let epic_roots = find_epic_app_roots();

    let candidates = resolve_candidates(manifest, &home, &username, &steam_roots, &gog_roots, &epic_roots);

    Ok(expected_restore_paths(candidates, &name))
}

/// Picks the expected save paths for `name` from resolved manifest candidates,
/// suitable as a default restore target. Unlike a scan, this includes concrete
/// paths that don't exist on disk yet — the case of a freshly installed game on
/// a new device that was never played, so its save folder hasn't been created.
fn expected_restore_paths(candidates: Vec<ResolvedCandidate>, name: &str) -> Vec<String> {
    let Some(candidate) = candidates.into_iter().find(|c| c.name == name) else {
        return Vec::new();
    };

    let mut seen = std::collections::HashSet::new();
    candidate
        .paths
        .into_iter()
        .flat_map(|path| resolve_expected_path(&path))
        .filter(|path| seen.insert(path.clone()))
        .collect()
}

/// Resolves a single candidate path to its expected on-disk location(s).
/// Wildcard paths (e.g. a `<storeUserId>` segment) can only be narrowed by
/// matching existing directories, so they fall back to existence-based
/// resolution. Concrete paths prefer a localized variant that exists on disk,
/// but otherwise return the path as-is so a never-created folder can still be
/// offered as a restore target.
fn resolve_expected_path(path: &str) -> Vec<String> {
    if path.contains('*') {
        return resolve_localized_paths(path);
    }

    let localized = resolve_localized_paths(path);
    if localized.is_empty() {
        return vec![path.to_string()];
    }
    localized
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use tempfile::TempDir;

    #[test]
    fn manual_scan_deduplicates_files_from_nested_paths() {
        let dir = TempDir::new().unwrap();
        let parent = dir.path().join("profiles").join("user1");
        let child = parent.join("Savegames");
        fs::create_dir_all(&child).unwrap();

        File::create(parent.join("config.ini"))
            .unwrap()
            .write_all(b"cfg")
            .unwrap();
        File::create(child.join("slot1.dat"))
            .unwrap()
            .write_all(b"save")
            .unwrap();

        let game = scan_manual_game_blocking(
            "TestGame".to_string(),
            vec![
                parent.to_string_lossy().to_string(),
                child.to_string_lossy().to_string(),
            ],
        );

        assert_eq!(game.save_files.len(), 2);
    }

    fn candidate(name: &str, paths: &[&str]) -> ResolvedCandidate {
        ResolvedCandidate {
            name: name.to_string(),
            steam_id: None,
            paths: paths.iter().map(|path| path.to_string()).collect(),
            platform: None,
            has_steam_cloud: false,
        }
    }

    #[test]
    fn expected_restore_paths_returns_concrete_path_even_when_missing() {
        let missing = "/nonexistent/qsave/GameX/saves";
        let candidates = vec![candidate("GameX", &[missing])];

        let paths = expected_restore_paths(candidates, "GameX");

        assert_eq!(paths, vec![missing.to_string()]);
    }

    #[test]
    fn expected_restore_paths_returns_empty_for_unknown_game() {
        let candidates = vec![candidate("GameX", &["/nonexistent/qsave/GameX"])];

        let paths = expected_restore_paths(candidates, "GameY");

        assert!(paths.is_empty());
    }

    #[test]
    fn expected_restore_paths_deduplicates() {
        let path = "/nonexistent/qsave/GameX/saves";
        let candidates = vec![candidate("GameX", &[path, path])];

        let paths = expected_restore_paths(candidates, "GameX");

        assert_eq!(paths, vec![path.to_string()]);
    }

    #[test]
    fn resolve_expected_path_returns_missing_concrete_path() {
        let result = resolve_expected_path("/nonexistent/qsave/GameX/saves");

        assert_eq!(result, vec!["/nonexistent/qsave/GameX/saves".to_string()]);
    }

    #[test]
    fn resolve_expected_path_prefers_existing_localized_variant() {
        let dir = TempDir::new().unwrap();
        let ea = dir.path().join("Electronic Arts");
        let sims_fr = ea.join("Les Sims 4").join("saves");
        fs::create_dir_all(&sims_fr).unwrap();

        let english_path = ea.join("The Sims 4").join("saves");
        let result = resolve_expected_path(&english_path.to_string_lossy());

        assert_eq!(result.len(), 1);
        assert!(result[0].contains("Les Sims 4"));
    }

    #[test]
    fn resolve_expected_path_wildcard_requires_existing_match() {
        let result = resolve_expected_path("/nonexistent/qsave/*/saves");

        assert!(result.is_empty());
    }

    #[test]
    fn resolve_expected_path_wildcard_expands_existing_directories() {
        let dir = TempDir::new().unwrap();
        fs::create_dir_all(dir.path().join("game").join("user_1")).unwrap();
        fs::create_dir_all(dir.path().join("game").join("user_2")).unwrap();

        let pattern = format!("{}/game/*", dir.path().to_string_lossy());
        let result = resolve_expected_path(&pattern);

        assert_eq!(result.len(), 2);
    }
}
