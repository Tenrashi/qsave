use std::fs::File;
use std::io::{Cursor, Read, Write};
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::CompressionMethod;

/// Compresses a list of files into an in-memory zip archive.
/// Returns the zip bytes. Each file is stored with its filename only (no directory structure).
pub fn create_zip(files: Vec<String>) -> Result<Vec<u8>, String> {
    let buffer = Cursor::new(Vec::new());
    let mut zip = zip::ZipWriter::new(buffer);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);

    for file_path in &files {
        let path = Path::new(file_path);

        let name = path
            .file_name()
            .ok_or_else(|| format!("Invalid file path: {}", file_path))?
            .to_string_lossy();

        let mut file =
            File::open(path).map_err(|e| format!("Failed to open {}: {}", file_path, e))?;

        let mut contents = Vec::new();
        file.read_to_end(&mut contents)
            .map_err(|e| format!("Failed to read {}: {}", file_path, e))?;

        zip.start_file(name.as_ref(), options)
            .map_err(|e| format!("Failed to add {} to zip: {}", name, e))?;
        zip.write_all(&contents)
            .map_err(|e| format!("Failed to write {} to zip: {}", name, e))?;
    }

    let cursor = zip
        .finish()
        .map_err(|e| format!("Failed to finalize zip: {}", e))?;
    Ok(cursor.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn creates_zip_with_files() {
        let dir = TempDir::new().unwrap();
        let file_a = dir.path().join("save1.dat");
        let file_b = dir.path().join("save2.dat");

        File::create(&file_a)
            .unwrap()
            .write_all(b"hello")
            .unwrap();
        File::create(&file_b)
            .unwrap()
            .write_all(b"world")
            .unwrap();

        let zip_bytes = create_zip(vec![
            file_a.to_string_lossy().to_string(),
            file_b.to_string_lossy().to_string(),
        ])
        .unwrap();

        let cursor = Cursor::new(zip_bytes);
        let mut archive = zip::ZipArchive::new(cursor).unwrap();
        assert_eq!(archive.len(), 2);

        let mut names: Vec<String> = (0..archive.len())
            .map(|i| archive.by_index(i).unwrap().name().to_string())
            .collect();
        names.sort();
        assert_eq!(names, vec!["save1.dat", "save2.dat"]);

        let mut content = String::new();
        archive
            .by_name("save1.dat")
            .unwrap()
            .read_to_string(&mut content)
            .unwrap();
        assert_eq!(content, "hello");
    }

    #[test]
    fn returns_error_for_missing_file() {
        let result = create_zip(vec!["/nonexistent/file.dat".to_string()]);
        assert!(result.is_err());
    }

    #[test]
    fn creates_empty_zip() {
        let zip_bytes = create_zip(vec![]).unwrap();
        let cursor = Cursor::new(zip_bytes);
        let archive = zip::ZipArchive::new(cursor).unwrap();
        assert_eq!(archive.len(), 0);
    }

    #[test]
    fn compresses_data() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("big.dat");

        // Repetitive data compresses well
        let data = "abcdefgh".repeat(10_000);
        File::create(&file)
            .unwrap()
            .write_all(data.as_bytes())
            .unwrap();

        let zip_bytes =
            create_zip(vec![file.to_string_lossy().to_string()]).unwrap();
        assert!(zip_bytes.len() < data.len());
    }
}
