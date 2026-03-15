"use strict";

class Response {
  constructor({ statusCode, headers, content, url = "", cookies = null, encoding = null }) {
    this.statusCode = statusCode;
    this._headers = headers || {};
    this.content = content || Buffer.alloc(0);
    this.url = url;
    this._cookies = cookies;
    this.encoding = encoding;
  }

  get headers() {
    const result = {};
    for (const [key, values] of Object.entries(this._headers)) {
      result[key] = values && values.length ? values[0] : "";
    }
    return result;
  }

  get cookies() {
    return this._cookies;
  }

  _getEncoding() {
    if (this.encoding) {
      return this.encoding;
    }
    const contentType = (this.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("charset=")) {
      const parts = contentType.split("charset=");
      if (parts[1]) {
        return parts[1].split(";")[0].trim();
      }
    }
    return "utf-8";
  }

  get text() {
    return this.content.toString(this._getEncoding());
  }

  json() {
    return JSON.parse(this.text);
  }

  get ok() {
    return this.statusCode >= 200 && this.statusCode < 400;
  }

  raiseForStatus() {
    if (this.statusCode >= 400) {
      throw new HTTPStatusError(`${this.statusCode} Error`, this);
    }
  }
}

class HTTPStatusError extends Error {
  constructor(message, response) {
    super(message);
    this.response = response;
  }
}

class RequestError extends Error {}

module.exports = {
  Response,
  HTTPStatusError,
  RequestError,
};