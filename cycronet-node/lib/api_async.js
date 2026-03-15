"use strict";

function createApiAsync(AsyncCronetClient) {
  async function get(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return await session.get(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      await session.close();
    }
  }

  async function post(
    url,
    { params = null, headers = null, cookies = null, data = null, json = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return await session.post(url, { params, headers, cookies, data, json, verify, allowRedirects, ...rest });
    } finally {
      await session.close();
    }
  }

  async function put(
    url,
    { params = null, headers = null, cookies = null, data = null, json = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return await session.put(url, { params, headers, cookies, data, json, verify, allowRedirects, ...rest });
    } finally {
      await session.close();
    }
  }

  async function del(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return await session.delete(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      await session.close();
    }
  }

  async function patch(
    url,
    { params = null, headers = null, cookies = null, data = null, json = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return await session.patch(url, { params, headers, cookies, data, json, verify, allowRedirects, ...rest });
    } finally {
      await session.close();
    }
  }

  async function head(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return await session.head(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      await session.close();
    }
  }

  async function options(
    url,
    { params = null, headers = null, cookies = null, timeout = null, verify = true, allowRedirects = true, proxies = null, chrometls = "chrome_144", ...rest } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs, proxies, chrometls });
    try {
      return await session.options(url, { params, headers, cookies, verify, allowRedirects, ...rest });
    } finally {
      await session.close();
    }
  }

  async function uploadFile(
    url,
    filePath,
    { fieldName = "file", additionalFields = null, headers = null, cookies = null, timeout = null, verify = true } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs });
    try {
      return await session.uploadFile(url, filePath, { fieldName, additionalFields, headers, cookies, verify });
    } finally {
      await session.close();
    }
  }

  async function downloadFile(
    url,
    savePath,
    { headers = null, cookies = null, timeout = null, verify = true, chunkSize = 8192 } = {}
  ) {
    const timeoutMs = timeout ? Math.floor(timeout * 1000) : 30000;
    const session = AsyncCronetClient({ verify, timeoutMs });
    try {
      return await session.downloadFile(url, savePath, { headers, cookies, verify, chunkSize });
    } finally {
      await session.close();
    }
  }

  return {
    asyncGet: get,
    asyncPost: post,
    asyncPut: put,
    asyncDelete: del,
    asyncPatch: patch,
    asyncHead: head,
    asyncOptions: options,
    asyncUploadFile: uploadFile,
    asyncDownloadFile: downloadFile,
  };
}

module.exports = createApiAsync;