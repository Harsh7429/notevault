const TOKEN_KEY = "notevault_token";
const DEVICE_KEY = "notevault_device_id";
const LEGACY_TOKEN_KEY = "notevault_token_legacy";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const activeToken = window.sessionStorage.getItem(TOKEN_KEY);

  if (activeToken) {
    return activeToken;
  }

  const legacyToken = window.localStorage.getItem(TOKEN_KEY) || window.localStorage.getItem(LEGACY_TOKEN_KEY);

  if (legacyToken) {
    window.sessionStorage.setItem(TOKEN_KEY, legacyToken);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacyToken;
  }

  return "";
}

export function setStoredToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getDeviceId() {
  if (typeof window === "undefined") {
    return "";
  }

  let deviceId = window.localStorage.getItem(DEVICE_KEY);

  if (!deviceId) {
    const randomPart = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    deviceId = `web-${randomPart}`;
    window.localStorage.setItem(DEVICE_KEY, deviceId);
  }

  return deviceId;
}
