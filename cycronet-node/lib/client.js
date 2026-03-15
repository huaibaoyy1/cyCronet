"use strict";

const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { RequestError } = require("./response");
const Session = require("./session");
const AsyncSession = require("./async_session");

let TLS_PROFILES_CACHE = null;

function loadTlsProfiles() {
  if (TLS_PROFILES_CACHE) {
    return TLS_PROFILES_CACHE;
  }
  const configPath = path.join(__dirname, "tls_profiles.json");
  if (!fs.existsSync(configPath)) {
    TLS_PROFILES_CACHE = {};
    return TLS_PROFILES_CACHE;
  }
  try {
    const content = fs.readFileSync(configPath, "utf8");
    TLS_PROFILES_CACHE = JSON.parse(content);
    return TLS_PROFILES_CACHE;
  } catch (error) {
    TLS_PROFILES_CACHE = {};
    return TLS_PROFILES_CACHE;
  }
}

function setTlsProfiles(profiles) {
  TLS_PROFILES_CACHE = profiles;
}

function addTlsProfile(name, profile) {
  const profiles = loadTlsProfiles();
  profiles[name] = profile;
}

function getTlsProfiles() {
  return { ...loadTlsProfiles() };
}

function clearTlsProfilesCache() {
  TLS_PROFILES_CACHE = null;
}

function loadTlsProfile(chrometls) {
  if (!chrometls) {
    return null;
  }
  const profiles = loadTlsProfiles();
  if (!profiles[chrometls]) {
    return null;
  }
  const profile = profiles[chrometls];
  return {
    cipher_suites: profile.cipher_suites || [],
    tls_curves: profile.tls_curves || [],
    tls_extensions: profile.tls_extensions || [],
  };
}

function validateProxyUrl(proxyUrl) {
  if (!proxyUrl || typeof proxyUrl !== "string") {
    throw new RequestError("Proxy URL must be a non-empty string");
  }
  let parsed;
  try {
    parsed = new URL(proxyUrl);
  } catch (error) {
    throw new RequestError(`Invalid proxy URL '${proxyUrl}': ${error.message}`);
  }
  if (!parsed.protocol) {
    throw new RequestError(`Invalid proxy URL '${proxyUrl}': No schema supplied`);
  }
  const scheme = parsed.protocol.replace(":", "");
  const supportedSchemes = ["http", "https", "socks5"];
  if (!supportedSchemes.includes(scheme)) {
    throw new RequestError(
      `Invalid proxy URL '${proxyUrl}': Unsupported schema '${scheme}'. Supported schemas: ${supportedSchemes.join(", ")}`
    );
  }
  if (!parsed.hostname) {
    throw new RequestError(`Invalid proxy URL '${proxyUrl}': No host supplied`);
  }
  if (parsed.port) {
    const port = Number(parsed.port);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      throw new RequestError(`Invalid proxy URL '${proxyUrl}': Port must be between 1 and 65535`);
    }
  }
}

function createClient(native) {
  function CronetClient({ verify = true, proxies = null, timeoutMs = 30000, chrometls = "chrome_144" } = {}) {
    let proxyRules = null;
    if (proxies) {
      if (typeof proxies === "object") {
        proxyRules = proxies.https || proxies.http || proxies.all || null;
      } else {
        proxyRules = proxies;
      }
      if (proxyRules) {
        validateProxyUrl(proxyRules);
      }
    }

    const tlsProfile = loadTlsProfile(chrometls);
    const cipherSuites = tlsProfile ? tlsProfile.cipher_suites : null;
    const tlsCurves = tlsProfile ? tlsProfile.tls_curves : null;
    const tlsExtensions = tlsProfile ? tlsProfile.tls_extensions : null;

    const client = new native.CronetClient();
    const sessionId = client.createSession({
      proxyRules,
      skipCertVerify: !verify,
      timeoutMs,
      cipherSuites,
      tlsCurves,
      tlsExtensions,
    });

    return new Session({ client, sessionId, verify });
  }

  function AsyncCronetClient({ verify = true, proxies = null, timeoutMs = 30000, chrometls = "chrome_144" } = {}) {
    let proxyRules = null;
    if (proxies) {
      if (typeof proxies === "object") {
        proxyRules = proxies.https || proxies.http || proxies.all || null;
      } else {
        proxyRules = proxies;
      }
      if (proxyRules) {
        validateProxyUrl(proxyRules);
      }
    }

    const tlsProfile = loadTlsProfile(chrometls);
    const cipherSuites = tlsProfile ? tlsProfile.cipher_suites : null;
    const tlsCurves = tlsProfile ? tlsProfile.tls_curves : null;
    const tlsExtensions = tlsProfile ? tlsProfile.tls_extensions : null;

    const client = new native.CronetClient();
    const sessionId = client.createSession({
      proxyRules,
      skipCertVerify: !verify,
      timeoutMs,
      cipherSuites,
      tlsCurves,
      tlsExtensions,
    });

    return new AsyncSession({ client, sessionId, verify });
  }

  return {
    CronetClient,
    AsyncCronetClient,
    setTlsProfiles,
    addTlsProfile,
    getTlsProfiles,
    clearTlsProfilesCache,
  };
}

module.exports = createClient;