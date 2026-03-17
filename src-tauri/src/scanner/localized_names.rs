use std::collections::HashMap;
use std::sync::LazyLock;

/// Localized folder names loaded from localized_names.json at compile time.
/// Contributors can add new games or translations by editing the JSON file.
pub static ENTRIES: LazyLock<HashMap<String, Vec<String>>> = LazyLock::new(|| {
    serde_json::from_str(include_str!("localized_names.json"))
        .expect("localized_names.json is invalid")
});
