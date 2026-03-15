"use strict";

const { URL } = require("url");

const BROWSER_HEADER_ORDER = [
  "host",
  "connection",
  "cache-control",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "upgrade-insecure-requests",
  "user-agent",
  "accept",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-user",
  "sec-fetch-dest",
  "referer",
  "accept-encoding",
  "accept-language",
  "cookie",
  "priority",
];

function sortHeadersDict(headers) {
  const lowerMap = new Map();
  Object.entries(headers || {}).forEach(([key, value]) => {
    lowerMap.set(key.toLowerCase(), [key, value]);
  });

  const sorted = [];
  for (const key of BROWSER_HEADER_ORDER) {
    if (lowerMap.has(key)) {
      sorted.push(lowerMap.get(key));
      lowerMap.delete(key);
    }
  }

  for (const value of lowerMap.values()) {
    sorted.push(value);
  }

  return sorted;
}

function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch (error) {
    return "";
  }
}

function parseSetCookie(values) {
  const cookies = [];
  for (const value of values || []) {
    if (value.includes("=")) {
      const parts = value.split(";");
      const cookiePart = parts[0].trim();
      if (cookiePart.includes("=")) {
        const [name, val] = cookiePart.split("=", 2);
        let domain = "";
        for (const part of parts.slice(1)) {
          const trimmed = part.trim();
          if (trimmed.toLowerCase().startsWith("domain=")) {
            domain = trimmed.split("=", 2)[1].trim().toLowerCase();
            if (domain.startsWith(".")) {
              domain = domain.slice(1);
            }
            break;
          }
        }
        cookies.push([name.trim(), val.trim(), domain]);
      }
    }
  }
  return cookies;
}

function domainMatches(cookieDomain, requestDomain) {
  if (!cookieDomain) {
    return false;
  }
  const cookie = cookieDomain.toLowerCase();
  const request = requestDomain.toLowerCase();
  if (cookie === request) {
    return true;
  }
  return request.endsWith(`.${cookie}`);
}

module.exports = {
  BROWSER_HEADER_ORDER,
  sortHeadersDict,
  extractDomain,
  parseSetCookie,
  domainMatches,
};