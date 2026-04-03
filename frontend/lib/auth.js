const TOKEN_KEY = "notevault_token";
const DEVICE_KEY = "notevault_device_id";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
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
