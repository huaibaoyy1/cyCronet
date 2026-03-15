"use strict";

function createApiSync(CronetClient) {
  function get(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return session.get(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      session.close();
    }
  }

  function post(
    url,
    { params = null, headers = null, cookies = null, data = null, json = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return session.post(url, { params, headers, cookies, data, json, verify, allowRedirects, ...rest });
    } finally {
      session.close();
    }
  }

  function put(
    url,
    { params = null, headers = null, cookies = null, data = null, json = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return session.put(url, { params, headers, cookies, data, json, verify, allowRedirects, ...rest });
    } finally {
      session.close();
    }
  }

  function del(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return session.delete(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      session.close();
    }
  }

  function patch(
    url,
    { params = null, headers = null, cookies = null, data = null, json = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return session.patch(url, { params, headers, cookies, data, json, verify, allowRedirects, ...rest });
    } finally {
      session.close();
    }
  }

  function head(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return session.head(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      session.close();
    }
  }

  function options(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return session.options(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      session.close();
    }
  }

  function uploadFile(url, filePath, { fieldName = "file", additionalFields = null, headers = null, cookies = null, timeout = null, verify = true } = {}) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs });
    try {
      return session.uploadFile(url, filePath, { fieldName, additionalFields, headers, cookies, verify });
    } finally {
      session.close();
    }
  }

  function downloadFile(url, savePath, { headers = null, cookies = null, timeout = null, verify = true, chunkSize = 8192 } = {}) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = CronetClient({ verify, timeoutMs });
    try {
      return session.downloadFile(url, savePath, { headers, cookies, verify, chunkSize });
    } finally {
      session.close();
    }
  }

  return {
    get,
    post,
    put,
    delete: del,
    patch,
    head,
    options,
    uploadFile,
    downloadFile,
  };
}

module.exports = createApiSync;