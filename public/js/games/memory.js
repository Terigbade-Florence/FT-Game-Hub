import { $, store, xp } from "../core.js";
import { sfx } from "../sfx.js";
import { confetti } from "../fx.js";
import { submitScore } from "../api.js";
import { makeDeck, comboPoints, PAIRS } from "../logic.js";

export const mem = {
  mode: store.get("memMode", "classic"),
  deck: [], cards: [], open: [], moves: 0, pairs: 0, combo: 0, score: 0, left: 60, lock: false, timer: null,

  start() {
    this.stop();
    Object.assign(this, { moves: 0, combo: 0, score: 0, open: [], lock: false, left: 60 });
    this.deal();
    if (this.mode === "blitz") this.timer = setInterval(() => this.tick(), 1000);
    this.say(this.mode === "blitz" ? "60 seconds. Chain matches to build a combo." : "Flip two cards to find a pair.");
    this.hud();
  },
  stop() { clearInterval(this.timer); this.timer = null; },
  say(text) { $("#m-status").textContent = text; },

  deal() {
    this.deck = makeDeck(); this.pairs = 0; this.open = [];
    $("#m-board").innerHTML = this.deck.map((icon, i) =>
      `<button class="tile" data-i="${i}" aria-label="Hidden card ${i + 1}"><span class="face back">?</span><span class="face front">${icon}</span></button>`).join("");
    this.cards = [...$("#m-board").children];
  },

  hud() {
    $("#m-moves").textContent = this.moves;
    $("#m-score").textContent = this.score;
    $("#m-combo").textContent = this.combo > 1 ? `×${this.combo}` : "–";
    $("#m-time").textContent = this.mode === "blitz" ? `${this.left}s` : "–";
    for (const m of ["classic", "blitz"]) {
      $("#m-" + m).classList.toggle("on", m === this.mode);
      $("#m-" + m).setAttribute("aria-pressed", String(m === this.mode));
    }
  },

  flip(i) {
    const card = this.cards[i];
    if (this.lock || !card || card.classList.contains("flipped")) return;
    card.classList.add("flipped"); card.setAttribute("aria-label", this.deck[i]); sfx.play("flip");
    this.open.push(i);
    if (this.open.length < 2) return;
    this.moves++;
    const [a, b] = this.open; this.open = [];
    if (this.deck[a] === this.deck[b]) return this.match(a, b);
    this.combo = 0; this.lock = true; sfx.play("miss"); this.hud();
    setTimeout(() => {
      for (const k of [a, b]) { this.cards[k].classList.remove("flipped"); this.cards[k].setAttribute("aria-label", `Hidden card ${k + 1}`); }
      this.lock = false;
    }, 750);
  },

  match(a, b) {
    for (const k of [a, b]) this.cards[k].classList.add("ok");
    this.pairs++; this.combo++; this.score += comboPoints(this.combo); sfx.play("match"); this.hud();
    if (this.pairs < PAIRS) return;
    if (this.mode === "classic") return this.finishClassic();
    this.score += 200; this.say("Board cleared! +200. Fresh cards…"); this.hud();
    setTimeout(() => { if (this.timer) { this.deal(); this.say("Keep the combo going."); } }, 700);
  },

  finishClassic() {
    const best = store.get("memBest", null), record = !best || this.moves < best;
    if (record) store.set("memBest", this.moves);
    sfx.play("win"); confetti(); submitScore("memory", this.moves);
    xp.add(Math.max(10, 60 - this.moves * 2));
    this.stop();
    this.say(record ? `Cleared in ${this.moves} moves. New best!` : `Cleared in ${this.moves} moves.`);
  },

  tick() {
    this.left--; this.hud();
    if (this.left > 0) return;
    this.stop(); this.lock = true;
    this.say(`Time! You scored ${this.score}.`);
    if (this.score > 0) { sfx.play("win"); confetti(); submitScore("blitz", this.score); xp.add(Math.round(this.score / 20)); }
    else sfx.play("lose");
  },
};

$("#m-board").onclick = (e) => { const b = e.target.closest(".tile"); if (b) mem.flip(+b.dataset.i); };
$("#m-new").onclick = () => mem.start();
for (const m of ["classic", "blitz"]) {
  $("#m-" + m).onclick = () => { mem.mode = m; store.set("memMode", m); mem.start(); };
}
