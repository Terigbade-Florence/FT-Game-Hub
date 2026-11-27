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

const LEVEL_XP = 100;
/** Shelf XP shared across games. Dispatches an "xp" event so the UI can react. */
export const xp = {
  get total() { return store.get("xp", 0); },
  get level() { return Math.floor(this.total / LEVEL_XP) + 1; },
  add(gain) {
    const before = this.level;
    store.set("xp", this.total + gain);
    document.dispatchEvent(new CustomEvent("xp", { detail: { gain, level: this.level, levelUp: this.level > before } }));
  },
};
