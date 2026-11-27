import { $, store, state, xp } from "./core.js";
import { confetti, toast } from "./fx.js";
import "./sfx.js";
import { ttt, ttt0 } from "./games/tictactoe.js";
import { mem } from "./games/memory.js";
import { snake } from "./games/snake.js";
import { getLeaderboard, mode, player } from "./api.js";

// --- Theme ---
const root = document.documentElement;
const savedTheme = store.get("theme", null);
if (savedTheme) root.dataset.theme = savedTheme;
$("#theme").onclick = () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  store.set("theme", root.dataset.theme);
  if (state.current === "snake") snake.draw();
};

// --- Home: personal bests + leaderboard ---
function refreshHome() {
  const t = store.get("ttt", ttt0), best = store.get("memBest", null);
  $("#b-ttt").textContent = `${t.w}W · ${t.d}D · ${t.l}L`;
  $("#b-mem").textContent = best ? `Best: ${best} moves` : "No score yet";
  $("#b-snk").textContent = `Best: ${store.get("snakeBest", 0)}`;
}
$("#reset").onclick = () => {
  if (!confirm("Reset all saved scores on this device?")) return;
  store.set("ttt", ttt0); store.set("memBest", null); store.set("snakeBest", 0);
  refreshHome();
};

const esc = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
let boardGame = "snake";
async function renderBoard() {
  const rows = await getLeaderboard(boardGame);
  const unit = boardGame === "memory" ? "moves" : "pts";
  $("#lb-list").innerHTML = rows.length
    ? rows.map((r, i) => `<li><b>${i + 1}</b><span>${esc(r.player)}</span><em>${r.score} ${unit}</em></li>`).join("")
    : "<li><span></span><span>No scores yet. Be the first!</span></li>";
  $("#lb-note").textContent = mode.online ? "Global leaderboard" : "Offline mode: showing scores saved on this device";
  for (const g of ["snake", "memory", "blitz"]) {
    $("#lb-" + g).classList.toggle("on", g === boardGame);
    $("#lb-" + g).setAttribute("aria-pressed", String(g === boardGame));
  }
}
for (const g of ["snake", "memory", "blitz"]) $("#lb-" + g).onclick = () => { boardGame = g; renderBoard(); };
$("#player").value = player.name;
$("#player").oninput = (e) => { player.name = e.target.value; };

// --- Router (hash based: #tictactoe, #memory, #snake) ---
const views = { tictactoe: () => ttt.start(), memory: () => mem.start(), snake: () => snake.start() };
const titles = { tictactoe: "Tic-Tac-Toe", memory: "Memory Match", snake: "Snake" };
function swap() {
  const key = location.hash.slice(1), next = views[key] ? key : "home";
  if (state.current === "snake" && next !== "snake") snake.stop();
  if (state.current === "memory" && next !== "memory") mem.stop();
  state.current = next;
  for (const v of ["home", ...Object.keys(views)]) $("#v-" + v).hidden = v !== next;
  document.title = next === "home" ? "Game Shelf – Gaming Hub" : `${titles[next]} – Game Shelf`;
  if (next === "home") { refreshHome(); renderBoard(); } else views[next]();
  const heading = $(`#v-${next} :is(h1,h2)`);
  heading.tabIndex = -1; heading.focus({ preventScroll: true });
  scrollTo(0, 0);
}
let firstRoute = true;
function route() {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (firstRoute || calm || !document.startViewTransition) { firstRoute = false; return swap(); }
  document.startViewTransition(swap);
}
addEventListener("hashchange", route);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.current === "snake" && snake.phase === "run") {
    snake.pause();
  }
});
function showXp() {
  const t = xp.total;
  $("#xp-l").textContent = `Lv ${xp.level}`;
  $("#xp-n").textContent = `${t % 100}/100 XP`;
  $("#xp-bar").style.setProperty("--p", String(t % 100));
}
document.addEventListener("xp", (e) => {
  showXp();
  toast(e.detail.levelUp ? `+${e.detail.gain} XP · Level ${e.detail.level}!` : `+${e.detail.gain} XP`);
  if (e.detail.levelUp) confetti();
});
showXp();
route();
