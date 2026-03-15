"use strict";

const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { CookieJar } = require("./cookies");
const { Response, HTTPStatusError, RequestError } = require("./response");
const { extractDomain, parseSetCookie, domainMatches } = require("./utils");

class AsyncSession {
  constructor({ client, sessionId, verify = true }) {
    this._client = client;
    this._sessionId = sessionId;
    this._closed = false;
    this._verify = verify;
    this._cookies = new CookieJar();
    this._defaultHeaders = {};
  }

  get cookies() {
    return this._cookies;
  }

  _adjustChromeHeaders(headers, method, { hasBody = false, isJson = false } = {}) {
    const adjusted = { ...headers };
    const lowerMap = Object.keys(adjusted).reduce((acc, key) => {
      acc[key.toLowerCase()] = key;
      return acc;
    }, {});

    const methodUpper = method.toUpperCase();

    if (["GET", "HEAD"].includes(methodUpper)) {
      if (lowerMap["accept"]) {
        adjusted[lowerMap["accept"]] =
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
      }
      if (lowerMap["sec-fetch-dest"]) {
        adjusted[lowerMap["sec-fetch-dest"]] = "document";
      }
      if (lowerMap["sec-fetch-mode"]) {
        adjusted[lowerMap["sec-fetch-mode"]] = "navigate";
      }
      if (lowerMap["sec-fetch-site"]) {
        adjusted[lowerMap["sec-fetch-site"]] = "none";
      }
      if (lowerMap["sec-fetch-user"]) {
        adjusted[lowerMap["sec-fetch-user"]] = "?1";
      }
    } else if (["POST", "PUT", "PATCH", "DELETE"].includes(methodUpper)) {
      if (isJson) {
        if (lowerMap["accept"]) {
          adjusted[lowerMap["accept"]] = "application/json, text/plain, */*";
        }
      } else if (hasBody) {
        if (lowerMap["accept"]) {
          adjusted[lowerMap["accept"]] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
        }
      } else if (lowerMap["accept"]) {
        adjusted[lowerMap["accept"]] = "*/*";
      }

      if (lowerMap["sec-fetch-dest"]) {
        adjusted[lowerMap["sec-fetch-dest"]] = "empty";
      }
      if (lowerMap["sec-fetch-mode"]) {
        adjusted[lowerMap["sec-fetch-mode"]] = "cors";
      }
      if (lowerMap["sec-fetch-site"]) {
        adjusted[lowerMap["sec-fetch-site"]] = "same-origin";
      }
      if (lowerMap["sec-fetch-user"]) {
        delete adjusted[lowerMap["sec-fetch-user"]];
      }
    }

    return adjusted;
  }

  _prepareHeaders({
    headers = null,
    cookies = null,
    domain = "",
    method = "GET",
    hasBody = false,
    isJson = false,
    needContentType = null,
  } = {}) {
    const userProvided = headers !== null && headers !== undefined;
    let headersDict;

    if (userProvided) {
      headersDict = Array.isArray(headers) ? Object.fromEntries(headers) : { ...headers };
      this._defaultHeaders = { ...headersDict };
    } else if (Object.keys(this._defaultHeaders).length) {
      headersDict = this._adjustChromeHeaders({ ...this._defaultHeaders }, method, { hasBody, isJson });
    } else {
      headersDict = {};
    }

    if (needContentType) {
      const lowerMap = Object.keys(headersDict).reduce((acc, key) => {
        acc[key.toLowerCase()] = key;
        return acc;
      }, {});
      if (!lowerMap["content-type"]) {
        headersDict["content-type"] = needContentType;
      }
    }

    const headersList = Object.entries(headersDict);

    const normalHeaders = [];
    const priorityHeaders = [];
    const cookieHeaders = [];

    for (const [key, value] of headersList) {
      const lower = key.toLowerCase();
      if (lower === "cookie") {
        cookieHeaders.push([key, value]);
      } else if (lower === "priority") {
        priorityHeaders.push([key, value]);
      } else {
        normalHeaders.push([key, value]);
      }
    }

    const mergedCookies = {};
    for (const cookie of this._cookies) {
      if (!cookie.domain || cookie.domain === domain || domainMatches(cookie.domain, domain)) {
        mergedCookies[cookie.name] = cookie.value;
      }
    }

    if (cookies) {
      Object.assign(mergedCookies, cookies);
    }

    const result = [...normalHeaders];

    if (!cookieHeaders.length && Object.keys(mergedCookies).length) {
      const cookieStr = Object.entries(mergedCookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
      result.push(["cookie", cookieStr]);
    } else if (cookieHeaders.length) {
      result.push(...cookieHeaders);
    }

    result.push(...priorityHeaders);
    return result;
  }

  _updateCookiesFromResponse(headers, requestDomain) {
    for (const [name, values] of Object.entries(headers)) {
      if (name.toLowerCase() === "set-cookie") {
        const parsed = parseSetCookie(values);
        for (const [cookieName, cookieValue, cookieDomain] of parsed) {
          const storeDomain = cookieDomain || requestDomain;
          this._cookies.set(cookieName, cookieValue, storeDomain);
        }
      }
    }
  }

  async request(
    method,
    url,
    { params = null, headers = null, cookies = null, data = null, json = null, timeout = null, verify = null, allowRedirects = true } = {}
  ) {
    if (this._closed) {
      throw new RequestError("Session is closed");
    }

    if (!url || typeof url !== "string") {
      throw new RequestError("URL must be a non-empty string");
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      throw new RequestError(`Invalid URL '${url}': ${error.message}`);
    }

    if (!parsed.protocol) {
      throw new RequestError(`Invalid URL '${url}': No schema supplied. Perhaps you meant http://${url}?`);
    }

    const scheme = parsed.protocol.replace(":", "");
    if (!["http", "https"].includes(scheme)) {
      throw new RequestError(`Invalid URL '${url}': Unsupported schema '${scheme}'. Only http and https are supported.`);
    }

    if (!parsed.hostname) {
      throw new RequestError(`Invalid URL '${url}': No host supplied`);
    }

    let finalUrl = url;
    if (params) {
      const query = new URLSearchParams(params).toString();
      finalUrl = `${url}${url.includes("?") ? "&" : "?"}${query}`;
    }

    const domain = extractDomain(finalUrl);

    if (cookies) {
      this._cookies.update(cookies, domain);
    }

    const headersToPrepare = headers
      ? Array.isArray(headers)
        ? [...headers]
        : { ...headers }
      : null;

    const isJsonRequest = json !== null && json !== undefined;
    const hasBody = data !== null && data !== undefined || isJsonRequest;
    let needContentType = null;

    if (isJsonRequest) {
      data = json;
      needContentType = "application/json";
    } else if (data && typeof data === "object" && !Buffer.isBuffer(data)) {
      data = new URLSearchParams(data).toString();
      needContentType = "application/x-www-form-urlencoded";
    }

    let body;
    if (data === null || data === undefined) {
      body = Buffer.alloc(0);
    } else if (Buffer.isBuffer(data)) {
      body = data;
    } else if (typeof data === "string") {
      body = Buffer.from(data, "utf8");
    } else {
      body = Buffer.from(JSON.stringify(data), "utf8");
    }

    const preparedHeaders = this._prepareHeaders({
      headers: headersToPrepare,
      cookies,
      domain,
      method,
      hasBody,
      isJson: isJsonRequest,
      needContentType,
    });

    const responseDict = await Promise.resolve(
      this._client.request({
        sessionId: this._sessionId,
        url: finalUrl,
        method: method.toUpperCase(),
        headers: preparedHeaders,
        body,
        allowRedirects: false,
      })
    );

    const { statusCode, headers: respHeadersList, body: bodyBytes } = responseDict;
    const respHeaders = {};
    for (const [name, value] of respHeadersList) {
      if (!respHeaders[name]) {
        respHeaders[name] = [];
      }
      respHeaders[name].push(value);
    }

    const responseCookies = new CookieJar();
    for (const [headerName, values] of Object.entries(respHeaders)) {
      if (headerName.toLowerCase() === "set-cookie") {
        for (const [cookieName, cookieValue, cookieDomain] of parseSetCookie(values)) {
          const storeDomain = cookieDomain || domain;
          responseCookies.set(cookieName, cookieValue, storeDomain);
        }
      }
    }

    this._updateCookiesFromResponse(respHeaders, domain);

    if (allowRedirects && [301, 302, 303, 307, 308].includes(statusCode)) {
      let location = null;
      for (const [headerName, values] of Object.entries(respHeaders)) {
        if (headerName.toLowerCase() === "location") {
          location = values[0] || null;
          break;
        }
      }

      if (location) {
        if (!location.startsWith("http://") && !location.startsWith("https://")) {
          const resolved = new URL(location, finalUrl);
          location = resolved.toString();
        }

        const redirectMethod = statusCode === 303 ? "GET" : method;

        return this.request(redirectMethod, location, {
          params: null,
          headers: headersToPrepare,
          cookies: null,
          data: statusCode === 303 ? null : data,
          json: null,
          timeout,
          verify,
          allowRedirects: true,
        });
      }
    }

    return new Response({
      statusCode,
      headers: respHeaders,
      content: Buffer.from(bodyBytes || []),
      url: finalUrl,
      cookies: responseCookies,
    });
  }

  async get(url, options = {}) {
    return this.request("GET", url, options);
  }

  async post(url, options = {}) {
    return this.request("POST", url, options);
  }

  async put(url, options = {}) {
    return this.request("PUT", url, options);
  }

  async delete(url, options = {}) {
    return this.request("DELETE", url, options);
  }

  async patch(url, options = {}) {
    return this.request("PATCH", url, options);
  }

  async head(url, options = {}) {
    return this.request("HEAD", url, options);
  }

  async options(url, options = {}) {
    return this.request("OPTIONS", url, options);
  }

  async uploadFile(
    url,
    filePath,
    { fieldName = "file", additionalFields = null, headers = null, cookies = null, timeout = null, verify = null } = {}
  ) {
    if (!fs.existsSync(filePath)) {
      throw new RequestError(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const mimeType = require("mime-types").lookup(filename) || "application/octet-stream";
    const boundary = `----CycronetFormBoundary${require("crypto").randomBytes(16).toString("hex")}`;

    const bodyParts = [];

    if (additionalFields) {
      for (const [key, value] of Object.entries(additionalFields)) {
        bodyParts.push(Buffer.from(`--${boundary}\r\n`));
        bodyParts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
        bodyParts.push(Buffer.from(`${value}\r\n`));
      }
    }

    bodyParts.push(Buffer.from(`--${boundary}\r\n`));
    bodyParts.push(Buffer.from(`Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n`));
    bodyParts.push(Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`));
    bodyParts.push(fileContent);
    bodyParts.push(Buffer.from("\r\n"));
    bodyParts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(bodyParts);

    let headersObj = headers ? (Array.isArray(headers) ? Object.fromEntries(headers) : { ...headers }) : {};
    headersObj["Content-Type"] = `multipart/form-data; boundary=${boundary}`;

    return this.request("POST", url, { headers: headersObj, cookies, data: body, timeout, verify });
  }

  async downloadFile(url, savePath, { headers = null, cookies = null, timeout = null, verify = null, chunkSize = 8192 } = {}) {
    const response = await this.get(url, { headers, cookies, timeout, verify });
    if (response.statusCode >= 400) {
      throw new HTTPStatusError(`Download failed with status ${response.statusCode}`, response);
    }

    const saveDir = path.dirname(savePath);
    if (saveDir && !fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    fs.writeFileSync(savePath, response.content);

    return {
      filePath: savePath,
      size: response.content.length,
      statusCode: response.statusCode,
      headers: response.headers,
    };
  }

  async close() {
    if (!this._closed) {
      this._client.closeSession(this._sessionId);
      this._closed = true;
    }
  }

  async [Symbol.asyncDispose]() {
    await this.close();
  }
}

module.exports = AsyncSession;