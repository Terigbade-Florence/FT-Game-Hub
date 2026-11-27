import { store } from "./core.js";

/** `online` flips to false when the API is unreachable (for example a static host). */
export const mode = { online: true };

export const player = {
  get name() { return store.get("player", "Player"); },
  set name(value) { store.set("player", String(value).trim().slice(0, 16) || "Player"); },
};

const lowerIsBetter = { snake: false, memory: true };
const rank = (rows, game) =>
  [...rows].sort((a, b) => (lowerIsBetter[game] ? a.score - b.score : b.score - a.score)).slice(0, 10);

export async function submitScore(game, score) {
  const entry = { game, score, player: player.name };
  try {
    const res = await fetch("/api/scores", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mode.online = true;
  } catch {
    mode.online = false; // fall back to a device-local leaderboard
    store.set("lb:" + game, rank([...store.get("lb:" + game, []), entry], game));
  }
}

export async function getLeaderboard(game) {
  try {
    const res = await fetch(`/api/scores?game=${game}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mode.online = true;
    return (await res.json()).scores;
  } catch {
    mode.online = false;
    return store.get("lb:" + game, []);
  }
}
