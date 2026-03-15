"use strict";

const { loadNativeLibraries, loadCronetAddon } = require("./lib/native_loader");
loadNativeLibraries();

const native = loadCronetAddon();

const { CronetClient, AsyncCronetClient, setTlsProfiles, addTlsProfile, getTlsProfiles, clearTlsProfilesCache } =
  require("./lib/client")(native);

const { Response, HTTPStatusError, RequestError } = require("./lib/response");
const { Cookie, CookieJar } = require("./lib/cookies");
const apiSync = require("./lib/api_sync")(CronetClient);
const apiAsync = require("./lib/api_async")(AsyncCronetClient);

module.exports = {
  CronetClient,
  AsyncCronetClient,
  Response,
  HTTPStatusError,
  RequestError,
  Cookie,
  CookieJar,
  setTlsProfiles,
  addTlsProfile,
  getTlsProfiles,
  clearTlsProfilesCache,
  ...apiSync,
  ...apiAsync,
};