"use strict";

const fs = require("fs");
const path = require("path");

function loadNativeLibraries() {
  const dllDir = path.resolve(__dirname, "..", "native");
  const dllName = findCronetDll(dllDir);
  if (!dllName) {
    return;
  }

  const dllPath = path.join(dllDir, dllName);

  process.env.PATH = `${dllDir};${process.env.PATH || ""}`;

  try {
    const ffi = require("ffi-napi");
    ffi.Library(dllPath, {});
  } catch (error) {
    // ignore if ffi-napi not installed; addon may still load it
  }
}

function findCronetDll(dllDir) {
  if (!fs.existsSync(dllDir)) {
    return null;
  }
  const files = fs.readdirSync(dllDir);
  const match = files.find((name) => /^cronet\..*\.dll$/i.test(name));
  return match || null;
}

function loadAddonFromPath(addonPath) {
  const module = { exports: {} };
  process.dlopen(module, addonPath);
  return module.exports;
}

function loadCronetAddon() {
  const nativeFromBuild = path.resolve(__dirname, "..", "..", "cycronet-node-native", "cronet_cloak.node");
  if (fs.existsSync(nativeFromBuild)) {
    return loadAddonFromPath(nativeFromBuild);
  }
  const nodeAddonPath = path.resolve(__dirname, "..", "native", "cronet_cloak.node");
  if (fs.existsSync(nodeAddonPath)) {
    return loadAddonFromPath(nodeAddonPath);
  }
  return require("cronet-cloak-addon");
}

module.exports = {
  loadNativeLibraries,
  loadCronetAddon,
};