use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;

const LISTEN_PORT: u16 = 19842;

pub fn get_redirect_uri() -> String {
    format!("http://localhost:{}/callback", LISTEN_PORT)
}

fn url_decode(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.bytes();
    while let Some(b) = chars.next() {
        if b == b'%' {
            let hi = chars.next().unwrap_or(0);
            let lo = chars.next().unwrap_or(0);
            let hex = [hi, lo];
            if let Ok(decoded) = u8::from_str_radix(std::str::from_utf8(&hex).unwrap_or(""), 16) {
                result.push(decoded as char);
                continue;
            }
            result.push('%');
            result.push(hi as char);
            result.push(lo as char);
            continue;
        }
        result.push(b as char);
    }
    result
}

fn extract_code(request_line: &str) -> Result<String, String> {
    // Request line looks like: GET /callback?code=XXXX&scope=... HTTP/1.1
    let path = request_line
        .split_whitespace()
        .nth(1)
        .ok_or("Malformed request")?;

    let query = path.split('?').nth(1).ok_or("No query parameters")?;

    query
        .split('&')
        .find_map(|param| {
            let (key, value) = param.split_once('=')?;
            match key {
                "code" => Some(Ok(url_decode(value))),
                "error" => Some(Err(format!("OAuth error: {}", value))),
                _ => None,
            }
        })
        .unwrap_or(Err("No authorization code in callback".to_string()))
}

/// Starts a one-shot HTTP server, opens the OAuth URL in the browser,
/// waits for Google to redirect back with a `code`, and returns it.
pub fn wait_for_oauth_code(auth_url: &str) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", LISTEN_PORT))
        .map_err(|e| format!("Failed to bind OAuth listener: {}", e))?;

    open::that(auth_url).map_err(|e| format!("Failed to open browser: {}", e))?;

    let (mut stream, _) = listener
        .accept()
        .map_err(|e| format!("Failed to accept connection: {}", e))?;

    let reader = BufReader::new(&stream);
    let request_line = reader
        .lines()
        .next()
        .ok_or("No request received")?
        .map_err(|e| format!("Failed to read request: {}", e))?;

    let code = extract_code(&request_line)?;

    let html = r#"<html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
        <p>Signed in! You can close this tab and return to QSave.</p>
    </body></html>"#;
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();

    Ok(code)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_code_from_request_line() {
        let line = "GET /callback?code=4/0abc123&scope=email HTTP/1.1";
        assert_eq!(extract_code(line), Ok("4/0abc123".to_string()));
    }

    #[test]
    fn decodes_url_encoded_code() {
        let line = "GET /callback?code=4%2F0abc123&scope=email HTTP/1.1";
        assert_eq!(extract_code(line), Ok("4/0abc123".to_string()));
    }

    #[test]
    fn returns_error_for_oauth_error() {
        let line = "GET /callback?error=access_denied HTTP/1.1";
        assert!(extract_code(line).unwrap_err().contains("access_denied"));
    }

    #[test]
    fn returns_error_for_missing_code() {
        let line = "GET /callback?state=xyz HTTP/1.1";
        assert!(extract_code(line).is_err());
    }

    #[test]
    fn returns_error_for_malformed_request() {
        assert!(extract_code("").is_err());
    }

    #[test]
    fn redirect_uri_includes_port() {
        let uri = get_redirect_uri();
        assert_eq!(uri, format!("http://localhost:{}/callback", LISTEN_PORT));
    }
}
