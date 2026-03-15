"use strict";

class Cookie {
  constructor(name, value, domain = "", path = "/") {
    this.name = name;
    this.value = value;
    this.domain = domain;
    this.path = path;
  }

  toString() {
    return `${this.name}=${this.value}`;
  }

  toJSON() {
    return {
      name: this.name,
      value: this.value,
      domain: this.domain,
      path: this.path,
    };
  }
}

class CookieJar {
  constructor() {
    this._cookies = new Map(); // domain -> Map(name -> Cookie)
  }

  _ensureDomain(domain) {
    if (!this._cookies.has(domain)) {
      this._cookies.set(domain, new Map());
    }
    return this._cookies.get(domain);
  }

  set(name, value, domain = "", path = "/") {
    const domainStore = this._ensureDomain(domain);
    domainStore.set(name, new Cookie(name, value, domain, path));
  }

  get(name, domain = "") {
    if (domain && this._cookies.has(domain)) {
      const value = this._cookies.get(domain).get(name);
      return value ? value.value : null;
    }
    if (!domain) {
      for (const domainStore of this._cookies.values()) {
        if (domainStore.has(name)) {
          return domainStore.get(name).value;
        }
      }
    }
    return null;
  }

  getDict(domain = "") {
    const result = {};
    if (domain) {
      if (!this._cookies.has(domain)) {
        return result;
      }
      for (const [name, cookie] of this._cookies.get(domain).entries()) {
        result[name] = cookie.value;
      }
      return result;
    }
    for (const domainStore of this._cookies.values()) {
      for (const [name, cookie] of domainStore.entries()) {
        result[name] = cookie.value;
      }
    }
    return result;
  }

  update(cookies, domain = "") {
    if (!cookies) {
      return;
    }
    if (cookies instanceof CookieJar) {
      for (const cookie of cookies) {
        this.set(cookie.name, cookie.value, cookie.domain, cookie.path);
      }
      return;
    }
    if (typeof cookies === "object") {
      for (const [name, value] of Object.entries(cookies)) {
        this.set(name, value, domain);
      }
    }
  }

  clear(domain = "") {
    if (domain) {
      this._cookies.delete(domain);
      return;
    }
    this._cookies.clear();
  }

  *items() {
    for (const domainStore of this._cookies.values()) {
      for (const [name, cookie] of domainStore.entries()) {
        yield [name, cookie.value];
      }
    }
  }

  *keys() {
    for (const [name] of this.items()) {
      yield name;
    }
  }

  *values() {
    for (const [, value] of this.items()) {
      yield value;
    }
  }

  *[Symbol.iterator]() {
    for (const domainStore of this._cookies.values()) {
      for (const cookie of domainStore.values()) {
        yield cookie;
      }
    }
  }

  get size() {
    let total = 0;
    for (const domainStore of this._cookies.values()) {
      total += domainStore.size;
    }
    return total;
  }

  toString() {
    const items = Array.from(this).map((cookie) => `<Cookie ${cookie.name}=${cookie.value} for ${cookie.domain}${cookie.path}>`);
    if (!items.length) {
      return "<CookieJar[]>";
    }
    return `<CookieJar[${items.join(", ")}]>`;
  }
}

module.exports = {
  Cookie,
  CookieJar,
};