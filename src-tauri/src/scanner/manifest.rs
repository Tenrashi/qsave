use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use super::resolve::resolve_path;
use super::types::ManifestEntry;

const APP_ID: &str = "com.qsave.app";

struct ManifestSource {
    url: &'static str,
    cache_filename: &'static str,
    bundled: &'static str,
}

const MANIFESTS: &[ManifestSource] = &[
    ManifestSource {
        url: "https://raw.githubusercontent.com/mtkennerly/ludusavi-manifest/master/data/manifest.yaml",
        cache_filename: "manifest.yaml",
        bundled: include_str!("../../resources/manifest.yaml"),
    },
    ManifestSource {
        url: "https://raw.githubusercontent.com/BloodShed-Oni/ludusavi-extra-manifests/main/BS_ex-manifest.yaml",
        cache_filename: "manifest-extra.yaml",
        bundled: include_str!("../../resources/manifest-extra.yaml"),
    },
    ManifestSource {
        url: "https://raw.githubusercontent.com/hvmzx/ludusavi-manifests/main/non-steam-manifest.yml",
        cache_filename: "manifest-hvmzx.yaml",
        bundled: include_str!("../../resources/manifest-hvmzx.yaml"),
    },
];

fn cache_path(filename: &str) -> Option<PathBuf> {
    dirs::cache_dir().map(|dir| dir.join(APP_ID).join(filename))
}

fn save_to_cache(filename: &str, body: &str) {
    let Some(path) = cache_path(filename) else { return };
    let Some(parent) = path.parent() else { return };
    let _ = fs::create_dir_all(parent);
    let _ = fs::write(&path, body);
}

fn load_from_cache(filename: &str) -> Option<String> {
    let path = cache_path(filename)?;
    fs::read_to_string(path).ok()
}

fn download(url: &str) -> Option<String> {
    for _ in 0..2 {
        let result = reqwest::blocking::get(url).and_then(|response| response.text());
        if let Ok(body) = result {
            return Some(body);
        }
    }
    None
}

fn fetch_source(source: &ManifestSource) -> String {
    if let Some(body) = download(source.url) {
        save_to_cache(source.cache_filename, &body);
        return body;
    }

    if let Some(cached) = load_from_cache(source.cache_filename) {
        return cached;
    }

    source.bundled.to_string()
}

fn merge_manifests(
    base: &mut HashMap<String, ManifestEntry>,
    extra: HashMap<String, ManifestEntry>,
) {
    for (name, entry) in extra {
        let extra_files = match entry.files {
            Some(files) => files,
            None => continue,
        };

        base.entry(name)
            .and_modify(|existing| {
                let existing_files = existing.files.get_or_insert_with(HashMap::new);
                for (path, value) in &extra_files {
                    existing_files.entry(path.clone()).or_insert_with(|| value.clone());
                }
            })
            .or_insert_with(|| ManifestEntry {
                files: Some(extra_files),
                steam: entry.steam,
                gog: entry.gog,
                _rest: entry._rest,
            });
    }
}

pub fn fetch_manifest() -> Result<HashMap<String, ManifestEntry>, String> {
    let mut combined: HashMap<String, ManifestEntry> = HashMap::new();

    for source in MANIFESTS {
        let body = fetch_source(source);
        let parsed: HashMap<String, ManifestEntry> = serde_yaml::from_str(&body)
            .map_err(|err| format!("Failed to parse {}: {}", source.cache_filename, err))?;
        merge_manifests(&mut combined, parsed);
    }

    Ok(combined)
}

pub fn resolve_candidates(
    manifest: HashMap<String, ManifestEntry>,
    home: &str,
    username: &str,
    steam_roots: &HashMap<u64, PathBuf>,
    gog_roots: &HashMap<u64, PathBuf>,
) -> Vec<(String, Option<u64>, Vec<String>)> {
    manifest
        .into_iter()
        .filter_map(|(name, entry)| {
            let files = entry.files?;
            let steam_id = entry.steam.and_then(|s| s.id);
            let gog_id = entry.gog.and_then(|g| g.id);
            let root = steam_id
                .and_then(|id| steam_roots.get(&id))
                .or_else(|| gog_id.and_then(|id| gog_roots.get(&id)))
                .map(|p| p.to_string_lossy().into_owned());
            let paths: Vec<String> = files
                .keys()
                .filter_map(|raw| resolve_path(raw, home, username, root.as_deref()))
                .collect::<Vec<_>>();

            let paths: Vec<String> = paths
                .into_iter()
                .collect::<std::collections::HashSet<_>>()
                .into_iter()
                .collect();

            if paths.is_empty() {
                return None;
            }

            Some((name, steam_id, paths))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_manifest_entry() {
        let yaml = r#"
TestGame:
  files:
    <home>/saves:
      tags: [save]
  steam:
    id: 12345
"#;
        let manifest: HashMap<String, ManifestEntry> = serde_yaml::from_str(yaml).unwrap();
        assert!(manifest.contains_key("TestGame"));
        let entry = &manifest["TestGame"];
        assert_eq!(entry.steam.as_ref().unwrap().id, Some(12345));
        assert!(entry.files.as_ref().unwrap().contains_key("<home>/saves"));
    }

    #[test]
    fn parse_manifest_entry_without_steam() {
        let yaml = r#"
IndieGame:
  files:
    <home>/.indie/saves: {}
"#;
        let manifest: HashMap<String, ManifestEntry> = serde_yaml::from_str(yaml).unwrap();
        let entry = &manifest["IndieGame"];
        assert!(entry.steam.is_none());
        assert!(entry.files.is_some());
    }

    #[test]
    fn filters_empty_paths() {
        let yaml = r#"
GameA:
  files:
    <home>/saves: {}
GameB:
  files:
    <storeUserId>/unknown: {}
"#;
        let manifest: HashMap<String, ManifestEntry> = serde_yaml::from_str(yaml).unwrap();
        let candidates = resolve_candidates(manifest, "/home/user", "user", &HashMap::new(), &HashMap::new());

        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].0, "GameA");
    }

    #[test]
    fn resolves_root_when_steam_id_matches() {
        let yaml = r#"
SteamGame:
  files:
    <root>/saves: {}
  steam:
    id: 42
"#;
        let manifest: HashMap<String, ManifestEntry> = serde_yaml::from_str(yaml).unwrap();
        let mut roots = HashMap::new();
        roots.insert(42u64, PathBuf::from("/games/SteamGame"));
        let candidates = resolve_candidates(manifest, "/home/user", "user", &roots, &HashMap::new());

        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].2, vec!["/games/SteamGame/saves"]);
    }

    #[test]
    fn resolves_root_when_gog_id_matches() {
        let yaml = r#"
GogGame:
  files:
    <root>/saves: {}
  gog:
    id: 1234567890
"#;
        let manifest: HashMap<String, ManifestEntry> = serde_yaml::from_str(yaml).unwrap();
        let mut gog_roots = HashMap::new();
        gog_roots.insert(1234567890u64, PathBuf::from("/games/GogGame"));
        let candidates = resolve_candidates(manifest, "/home/user", "user", &HashMap::new(), &gog_roots);

        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].2, vec!["/games/GogGame/saves"]);
    }

    #[test]
    fn steam_root_takes_priority_over_gog() {
        let yaml = r#"
MultiStoreGame:
  files:
    <root>/saves: {}
  steam:
    id: 10
  gog:
    id: 20
"#;
        let manifest: HashMap<String, ManifestEntry> = serde_yaml::from_str(yaml).unwrap();
        let mut steam_roots = HashMap::new();
        steam_roots.insert(10u64, PathBuf::from("/steam/MultiStoreGame"));
        let mut gog_roots = HashMap::new();
        gog_roots.insert(20u64, PathBuf::from("/gog/MultiStoreGame"));
        let candidates = resolve_candidates(manifest, "/home/user", "user", &steam_roots, &gog_roots);

        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].2, vec!["/steam/MultiStoreGame/saves"]);
    }

    #[test]
    fn filters_root_path_when_no_root_available() {
        let yaml = r#"
SteamGame:
  files:
    <root>/saves: {}
  steam:
    id: 99
"#;
        let manifest: HashMap<String, ManifestEntry> = serde_yaml::from_str(yaml).unwrap();
        let candidates = resolve_candidates(manifest, "/home/user", "user", &HashMap::new(), &HashMap::new());

        assert!(candidates.is_empty());
    }
}
