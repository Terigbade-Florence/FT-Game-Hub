export const $ = (selector) => document.querySelector(selector);

export const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem("shelf:" + key);
      return value == null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("shelf:" + key, JSON.stringify(value)); } catch {}
  },
};

/** Shared UI state: which view is currently on screen. */
export const state = { current: "home" };
