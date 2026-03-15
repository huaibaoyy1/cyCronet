use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::sync::Arc;
use std::time::Duration;

use cronet_cloak::cronet::{SessionConfig, SessionManager};
use cronet_cloak::cronet_pb::{Header, TargetRequest};

#[napi(object)]
pub struct CreateSessionOptions {
  #[napi(rename = "proxyRules")]
  pub proxy_rules: Option<String>,
  #[napi(rename = "skipCertVerify")]
  pub skip_cert_verify: Option<bool>,
  #[napi(rename = "timeoutMs")]
  pub timeout_ms: Option<u64>,
  #[napi(rename = "cipherSuites")]
  pub cipher_suites: Option<Vec<String>>,
  #[napi(rename = "tlsCurves")]
  pub tls_curves: Option<Vec<String>>,
  #[napi(rename = "tlsExtensions")]
  pub tls_extensions: Option<Vec<String>>,
}

#[napi(object)]
pub struct RequestOptions {
  #[napi(rename = "sessionId")]
  pub session_id: String,
  pub url: String,
  pub method: String,
  pub headers: Option<Vec<(String, String)>>,
  pub body: Option<Buffer>,
  #[napi(rename = "allowRedirects")]
  pub allow_redirects: Option<bool>,
}

#[napi(object)]
pub struct ResponseObject {
  #[napi(rename = "statusCode")]
  pub status_code: i32,
  pub headers: Vec<(String, String)>,
  pub body: Buffer,
}

#[napi]
pub struct CronetClient {
  manager: Arc<SessionManager>,
}

#[napi]
impl CronetClient {
  #[napi(constructor)]
  pub fn new() -> Self {
    CronetClient {
      manager: Arc::new(SessionManager::new()),
    }
  }

  #[napi]
  pub fn create_session(&self, options: Option<CreateSessionOptions>) -> Result<String> {
    let config = if let Some(opts) = options {
      SessionConfig {
        proxy_rules: opts.proxy_rules,
        skip_cert_verify: opts.skip_cert_verify.unwrap_or(false),
        timeout_ms: opts.timeout_ms.unwrap_or(30000),
        cipher_suites: opts.cipher_suites,
        tls_curves: opts.tls_curves,
        tls_extensions: opts.tls_extensions,
        allow_redirects: true,
      }
    } else {
      SessionConfig {
        proxy_rules: None,
        skip_cert_verify: false,
        timeout_ms: 30000,
        cipher_suites: None,
        tls_curves: None,
        tls_extensions: None,
        allow_redirects: true,
      }
    };

    let session_id = self.manager.create_session(config);
    if session_id.is_empty() {
      return Err(Error::from_reason("Failed to create session".to_string()));
    }
    Ok(session_id)
  }

  #[napi]
  pub fn request(&self, options: RequestOptions) -> Result<ResponseObject> {
    let headers_vec = options.headers.unwrap_or_default();
    let body_vec = options.body.map(|b| b.to_vec()).unwrap_or_default();

    let target = TargetRequest {
      url: options.url,
      method: options.method,
      headers: headers_vec
        .into_iter()
        .map(|(name, value)| Header { name, value })
        .collect(),
      body: body_vec,
    };

    let allow_redirects = options.allow_redirects.unwrap_or(true);

    let Some((request_handle, rx, timeout_ms)) =
      self.manager.send_request(&options.session_id, &target, allow_redirects) else {
        return Err(Error::from_reason(
          "Failed to send request (session not found or concurrent limit reached)".to_string(),
        ));
      };

    let timeout_duration = Duration::from_millis(timeout_ms);

    let (timeout_tx, timeout_rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
      let result = rx.blocking_recv();
      let _ = timeout_tx.send(result);
      drop(request_handle);
    });

    match timeout_rx.recv_timeout(timeout_duration) {
      Ok(Some(Ok(response))) => Ok(ResponseObject {
        status_code: response.status_code,
        headers: response.headers,
        body: Buffer::from(response.body),
      }),
      Ok(Some(Err(err))) => Err(Error::from_reason(format!("Request failed: {}", err))),
      Ok(None) => Err(Error::from_reason("Channel closed unexpectedly".to_string())),
      Err(std::sync::mpsc::RecvTimeoutError::Timeout) => Err(Error::from_reason(format!(
        "Request timeout after {}ms",
        timeout_ms
      ))),
      Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
        Err(Error::from_reason("Timeout channel disconnected".to_string()))
      }
    }
  }

  #[napi]
  pub fn close_session(&self, session_id: String) -> Result<bool> {
    Ok(self.manager.close_session(&session_id))
  }

  #[napi]
  pub fn list_sessions(&self) -> Result<Vec<String>> {
    Ok(self.manager.list_sessions())
  }
}

#[napi]
pub fn init() -> Result<()> {
  Ok(())
}