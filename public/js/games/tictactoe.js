import { $, store, xp } from "../core.js";
import { sfx } from "../sfx.js";
import { confetti } from "../fx.js";
import { emptyMoves, winner, place, occupied, freeCells, bestMove } from "../logic.js";

export const ttt0 = { w: 0, d: 0, l: 0 };
const RULE_TEXT = {
  classic: "Get three in a row.",
  vanish: "Only your last 3 marks stay. The faded one disappears on your next move, so plan ahead.",
};

export const ttt = {
  moves: emptyMoves(), over: false, busy: false, last: -1, timer: 0,
  hard: store.get("hard", true), vanish: store.get("vanish", false),
  get cap() { return this.vanish ? 3 : 9; },

  start() {
    clearTimeout(this.timer);
    Object.assign(this, { moves: emptyMoves(), over: false, busy: false, last: -1 });
    this.say("Your move. You are X.");
    this.render();
  },
  say(text) { $("#t-status").textContent = text; },

  render() {
    const w = winner(this.moves), marks = [];
    for (const p of ["X", "O"]) {
      this.moves[p].forEach((cell, k, all) => { marks[cell] = { p, fading: this.vanish && all.length === 3 && k === 0 }; });
    }
    $("#t-board").innerHTML = Array.from({ length: 9 }, (_, i) => {
      const m = marks[i], cls = [m?.p, m?.fading && "old", w?.line.includes(i) && "win", i === this.last && "last"].filter(Boolean).join(" ");
      const label = m ? `${m.p}${m.fading ? ", fades next" : ""}` : "empty";
      return `<button class="${cls}" data-i="${i}" aria-label="Square ${i + 1}, ${label}">${m ? m.p : ""}</button>`;
    }).join("");
    const t = store.get("ttt", ttt0);
    $("#t-w").textContent = t.w; $("#t-d").textContent = t.d; $("#t-l").textContent = t.l;
    for (const [id, on] of [["d-easy", !this.hard], ["d-hard", this.hard], ["t-classic", !this.vanish], ["t-vanish", this.vanish]]) {
      $("#" + id).classList.toggle("on", on);
      $("#" + id).setAttribute("aria-pressed", String(on));
    }
    $("#t-rule").textContent = RULE_TEXT[this.vanish ? "vanish" : "classic"];
  },

  play(cell) {
    if (this.over || this.busy || occupied(this.moves).has(cell)) return;
    this.mark("X", cell); sfx.play("tap");
    if (this.finish()) return;
    this.busy = true; this.say("Thinking…");
    this.timer = setTimeout(() => {
      const free = freeCells(this.moves);
      this.mark("O", this.hard ? bestMove(this.moves, "O", this.cap) : free[Math.floor(Math.random() * free.length)]);
      sfx.play("o"); this.busy = false;
      if (!this.finish()) this.say("Your move.");
    }, 350);
  },
  mark(player, cell) { this.moves = place(this.moves, player, cell, this.cap); this.last = cell; this.render(); },

  finish() {
    const w = winner(this.moves), full = !this.vanish && occupied(this.moves).size === 9;
    if (!w && !full) return false;
    this.over = true;
    const t = store.get("ttt", ttt0);
    if (!w) { t.d++; sfx.play("draw"); this.say("It’s a draw."); xp.add(10); }
    else if (w.player === "X") { t.w++; sfx.play("win"); confetti(); this.say("You win!"); xp.add(this.hard ? 40 : 20); }
    else { t.l++; sfx.play("lose"); this.say("Computer wins. Try again."); xp.add(5); }
    store.set("ttt", t);
    this.render();
    return true;
  },
};

const setMode = (patch) => {
  Object.assign(ttt, patch);
  store.set("hard", ttt.hard); store.set("vanish", ttt.vanish);
  ttt.start();
};
$("#t-board").onclick = (e) => { const b = e.target.closest("button"); if (b) ttt.play(+b.dataset.i); };
$("#t-new").onclick = () => ttt.start();
$("#d-easy").onclick = () => setMode({ hard: false });
$("#d-hard").onclick = () => setMode({ hard: true });
$("#t-classic").onclick = () => setMode({ vanish: false });
$("#t-vanish").onclick = () => setMode({ vanish: true });
