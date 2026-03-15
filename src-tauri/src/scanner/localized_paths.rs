use std::collections::HashMap;
use std::path::Path;
use std::sync::LazyLock;

/// Known localized folder names for games whose publishers translate directory names.
/// Key: English folder name used in the ludusavi manifest.
/// Value: list of known translations.
///
/// NOTE: EA uses non-breaking spaces (\u{00a0}) in some localized folder names (e.g. French).
/// Each variant is listed with regular spaces; the matching logic also tries non-breaking spaces.
static LOCALIZED_NAMES: LazyLock<HashMap<&str, Vec<&str>>> = LazyLock::new(|| {
    HashMap::from([
        (
            "The Sims 4",
            vec![
                "Les Sims 4",       // French
                "Die Sims 4",       // German
                "Los Sims 4",       // Spanish
                "De Sims 4",        // Dutch
                "Os Sims 4",        // Portuguese
                "I Sims 4",         // Italian
                "ザ・シムズ4",       // Japanese
                "심즈 4",            // Korean
                "模拟人生4",         // Chinese (Simplified)
            ],
        ),
        (
            "The Sims 3",
            vec![
                "Les Sims 3",
                "Die Sims 3",
                "Los Sims 3",
                "De Sims 3",
                "Os Sims 3",
                "I Sims 3",
            ],
        ),
        (
            "The Sims 2",
            vec![
                "Les Sims 2",
                "Die Sims 2",
                "Los Sims 2",
                "De Sims 2",
                "Os Sims 2",
                "I Sims 2",
            ],
        ),
    ])
});

/// Given a resolved path that doesn't exist, try replacing known English folder names
/// with their localized variants. Returns the first path that exists, or None.
///
/// For each variant, tries both regular spaces and non-breaking spaces (\u{00a0})
/// since some publishers (EA) use non-breaking spaces in folder names.
pub fn try_localized_path(path: &str) -> Option<String> {
    let original = Path::new(path);
    if original.exists() {
        return Some(path.to_string());
    }

    for (english_name, variants) in LOCALIZED_NAMES.iter() {
        if !path.contains(english_name) {
            continue;
        }

        for variant in variants {
            // Try with regular spaces
            let candidate = path.replace(english_name, variant);
            if Path::new(&candidate).exists() {
                return Some(candidate);
            }

            // Try with non-breaking spaces (U+00A0) — EA uses these in some locales
            let nbsp_variant = variant.replace(' ', "\u{00a0}");
            if nbsp_variant != *variant {
                let candidate = path.replace(english_name, &nbsp_variant);
                if Path::new(&candidate).exists() {
                    return Some(candidate);
                }
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use tempfile::TempDir;

    #[test]
    fn resolves_french_sims_4() {
        let dir = TempDir::new().unwrap();
        let ea = dir.path().join("Electronic Arts");
        let sims_fr = ea.join("Les Sims 4").join("saves");
        fs::create_dir_all(&sims_fr).unwrap();
        File::create(sims_fr.join("save.dat"))
            .unwrap()
            .write_all(b"data")
            .unwrap();

        let english_path = ea.join("The Sims 4").join("saves");
        let result = try_localized_path(&english_path.to_string_lossy());

        assert!(result.is_some());
        assert!(result.unwrap().contains("Les Sims 4"));
    }

    #[test]
    fn resolves_german_sims_4() {
        let dir = TempDir::new().unwrap();
        let ea = dir.path().join("Electronic Arts");
        let sims_de = ea.join("Die Sims 4").join("saves");
        fs::create_dir_all(&sims_de).unwrap();
        File::create(sims_de.join("save.dat"))
            .unwrap()
            .write_all(b"data")
            .unwrap();

        let english_path = ea.join("The Sims 4").join("saves");
        let result = try_localized_path(&english_path.to_string_lossy());

        assert!(result.is_some());
        assert!(result.unwrap().contains("Die Sims 4"));
    }

    #[test]
    fn returns_none_when_no_variant_exists() {
        let dir = TempDir::new().unwrap();
        let ea = dir.path().join("Electronic Arts");
        fs::create_dir_all(&ea).unwrap();

        let english_path = ea.join("The Sims 4").join("saves");
        let result = try_localized_path(&english_path.to_string_lossy());

        assert!(result.is_none());
    }

    #[test]
    fn returns_original_when_english_exists() {
        let dir = TempDir::new().unwrap();
        let ea = dir.path().join("Electronic Arts");
        let sims_en = ea.join("The Sims 4").join("saves");
        fs::create_dir_all(&sims_en).unwrap();

        let result = try_localized_path(&sims_en.to_string_lossy());

        assert!(result.is_some());
        assert!(result.unwrap().contains("The Sims 4"));
    }

    #[test]
    fn resolves_french_sims_4_with_nbsp() {
        let dir = TempDir::new().unwrap();
        let ea = dir.path().join("Electronic Arts");
        // EA uses non-breaking spaces (U+00A0) in French folder names
        let sims_fr = ea.join("Les\u{00a0}Sims\u{00a0}4").join("saves");
        fs::create_dir_all(&sims_fr).unwrap();
        File::create(sims_fr.join("save.dat"))
            .unwrap()
            .write_all(b"data")
            .unwrap();

        let english_path = ea.join("The Sims 4").join("saves");
        let result = try_localized_path(&english_path.to_string_lossy());

        assert!(result.is_some());
        let resolved = result.unwrap();
        assert!(resolved.contains("Les\u{00a0}Sims\u{00a0}4"));
    }

    #[test]
    fn ignores_unrelated_paths() {
        let dir = TempDir::new().unwrap();
        let game_dir = dir.path().join("Undertale");
        fs::create_dir_all(&game_dir).unwrap();

        let result = try_localized_path(&dir.path().join("Minecraft").to_string_lossy());

        assert!(result.is_none());
    }
}
