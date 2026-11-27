import { $, store, state, xp } from "../core.js";
import { sfx } from "../sfx.js";
import { confetti } from "../fx.js";
import { submitScore } from "../api.js";
import { SIZE, newGame, step } from "../logic.js";

const cv = $("#s-canvas"), ctx = cv.getContext("2d"), CS = cv.width / SIZE;
const TOKENS = ["--cell", "--ink", "--pink", "--orange", "--mint", "--blue"];
const palette = () => {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()]));
};
const KEYS = { ArrowUp: "U", w: "U", ArrowDown: "D", s: "D", ArrowLeft: "L", a: "L", ArrowRight: "R", d: "R" };
const OPPOSITE = { U: "D", D: "U", L: "R", R: "L" };

export const snake = {
  game: newGame(), dir: "R", next: "R", phase: "idle", timer: 0, raf: 0, bits: [],

  start() {
    this.stop();
    Object.assign(this, { game: newGame(), dir: "R", next: "R", phase: "ready", bits: [] });
    this.say("Press an arrow key, swipe, or tap a button to start.");
    this.hud();
    this.frame();
  },
  /** Leaving the view: stop timers and the render loop. */
  stop() { clearTimeout(this.timer); cancelAnimationFrame(this.raf); if (this.phase === "run") this.phase = "paused"; },
  pause() {
    if (this.phase !== "run") return;
    clearTimeout(this.timer); this.phase = "paused";
    this.say("Paused. Press an arrow key to resume.");
  },
  say(text) { $("#s-status").textContent = text; },

  hud() {
    const g = this.game;
    $("#s-score").textContent = g.score;
    $("#s-best").textContent = store.get("snakeBest", 0);
    $("#s-fx").textContent = g.slow > 0 ? `🐢 Slow-mo ${g.slow}` : g.double > 0 ? `✨ ×2 ${g.double}` : "None";
  },

  turn(d) {
    if (this.phase === "over" || d === OPPOSITE[this.dir]) return;
    this.next = d;
    if (this.phase === "ready" || this.phase === "paused") { this.phase = "run"; this.say("Go!"); this.schedule(); }
  },

  schedule() {
    const g = this.game, base = Math.max(65, 140 - g.eaten * 3);
    this.timer = setTimeout(() => this.tick(), g.slow > 0 ? base * 1.7 : base);
  },

  tick() {
    this.dir = this.next;
    const { state: g, events } = step(this.game, this.dir);
    this.game = g;
    for (const e of events) {
      if (e === "eat") { sfx.play("eat"); this.burst(g.body[0], "--pink"); }
      if (e === "rock") this.say("A rock appeared. Steer clear!");
      if (e === "slow" || e === "double") {
        sfx.play("win"); this.burst(g.body[0], "--orange");
        this.say(e === "slow" ? "Slow-mo! Time bends." : "Double points!");
      }
    }
    if (events.includes("dead")) return this.over();
    this.hud(); this.schedule();
  },

  over() {
    this.phase = "over";
    const score = this.game.score, best = store.get("snakeBest", 0);
    let msg = `Game over. You scored ${score}.`;
    sfx.play("lose");
    if (score > best) { store.set("snakeBest", score); msg += " New best!"; confetti(); }
    if (score > 0) { submitScore("snake", score); xp.add(score * 3); }
    this.say(`${msg} Press Restart to play again.`);
    this.hud();
  },

  burst(cell, token) {
    const color = palette()[token];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * 6.28, v = 1 + Math.random() * 3;
      this.bits.push({ x: (cell.x + 0.5) * CS, y: (cell.y + 0.5) * CS, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
    }
  },

  frame() { this.draw(performance.now()); this.raf = requestAnimationFrame(() => this.frame()); },

  draw(now = 0) {
    const g = this.game, c = palette(), pulse = 1 + Math.sin(now / 160) * 0.12;
    ctx.fillStyle = c["--cell"]; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = c["--ink"]; ctx.globalAlpha = 0.9;
    for (const r of g.rocks) { ctx.beginPath(); ctx.roundRect(r.x * CS + 2, r.y * CS + 2, CS - 4, CS - 4, 4); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (g.food) {
      ctx.fillStyle = c["--pink"]; ctx.beginPath();
      ctx.arc((g.food.x + 0.5) * CS, (g.food.y + 0.5) * CS, (CS / 2 - 3) * pulse, 0, 7); ctx.fill();
    }
    if (g.special && (g.special.ttl > 12 || Math.floor(now / 150) % 2)) {
      ctx.font = `${CS * 0.85}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(g.special.type === "slow" ? "🐢" : "✨", (g.special.x + 0.5) * CS, (g.special.y + 0.55) * CS);
    }
    g.body.forEach((s, i) => {
      ctx.fillStyle = i ? c[g.double > 0 ? "--mint" : "--blue"] : c["--orange"];
      ctx.beginPath(); ctx.roundRect(s.x * CS + 1, s.y * CS + 1, CS - 2, CS - 2, 6); ctx.fill();
    });
    const h = g.body[0];
    ctx.fillStyle = "#16142b";
    for (const dx of [-0.2, 0.2]) { ctx.beginPath(); ctx.arc((h.x + 0.5 + dx) * CS, (h.y + 0.4) * CS, 2.2, 0, 7); ctx.fill(); }
    this.bits = this.bits.filter((b) => b.life > 0);
    for (const b of this.bits) {
      b.x += b.vx; b.y += b.vy; b.life -= 0.04;
      ctx.globalAlpha = Math.max(b.life, 0); ctx.fillStyle = b.color; ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  },
};

$("#s-new").onclick = () => snake.start();
document.querySelector(".pad").onclick = (e) => { const b = e.target.closest("button"); if (b) snake.turn(b.dataset.d); };
addEventListener("keydown", (e) => {
  if (state.current !== "snake") return;
  if (e.key === " ") { e.preventDefault(); snake.pause(); return; }
  const d = KEYS[e.key];
  if (d) { e.preventDefault(); snake.turn(d); }
});
let sx, sy;
cv.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
cv.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  snake.turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U"));
});
