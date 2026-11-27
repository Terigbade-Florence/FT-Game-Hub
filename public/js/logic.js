// Pure game rules: no DOM access, so they can be unit-tested in Node.

// ---------- Tic-Tac-Toe (classic and Vanishing) ----------
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

/** moves lists each player's cells in the order they were played. */
export const emptyMoves = () => ({ X: [], O: [] });
export const occupied = (moves) => new Set([...moves.X, ...moves.O]);
export const freeCells = (moves) => Array.from({ length: 9 }, (_, i) => i).filter((i) => !occupied(moves).has(i));
const other = (player) => (player === "X" ? "O" : "X");

export function winner(moves) {
  for (const player of ["X", "O"]) {
    const line = LINES.find((l) => l.every((i) => moves[player].includes(i)));
    if (line) return { player, line };
  }
  return null;
}

/** cap = marks a player may keep. 9 is classic, 3 is Vanishing (the oldest mark disappears). */
export function place(moves, player, cell, cap = 9) {
  const mine = [...moves[player], cell];
  if (mine.length > cap) mine.shift();
  return { ...moves, [player]: mine };
}

// Negamax: positive is good for the player to move. Faster wins score higher.
function search(moves, player, cap, depth) {
  if (winner(moves)) return -(depth + 1);
  const free = freeCells(moves);
  if (!free.length || depth === 0) return 0;
  let best = -Infinity;
  for (const cell of free) best = Math.max(best, -search(place(moves, player, cell, cap), other(player), cap, depth - 1));
  return best;
}

export function bestMove(moves, player, cap = 9, depth = cap >= 9 ? 9 : 6, rng = Math.random) {
  let best = -Infinity, picks = [];
  for (const cell of freeCells(moves)) {
    const score = -search(place(moves, player, cell, cap), other(player), cap, depth - 1);
    if (score > best) { best = score; picks = [cell]; } else if (score === best) picks.push(cell);
  }
  return picks[Math.floor(rng() * picks.length)];
}

// ---------- Memory ----------
export const ICONS = ["🚀", "🎲", "👾", "🍕", "🎧", "🔥", "🐙", "🌵"];
export const PAIRS = ICONS.length;
export const comboPoints = (combo) => 100 * combo;

export function makeDeck(rng = Math.random) {
  const deck = [...ICONS, ...ICONS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ---------- Snake: rocks, power-ups and effects ----------
export const SIZE = 18;
const DELTA = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const at = (list, x, y) => list.some((c) => c.x === x && c.y === y);
const taken = (s, x, y) =>
  at(s.body, x, y) || at(s.rocks, x, y) || (s.food && s.food.x === x && s.food.y === y) || (s.special && s.special.x === x && s.special.y === y);

export function freeCell(s, rng = Math.random, keepAway = 0) {
  const head = s.body[0];
  for (let tries = 0; tries < 200; tries++) {
    const x = Math.floor(rng() * SIZE), y = Math.floor(rng() * SIZE);
    if (!taken(s, x, y) && Math.abs(x - head.x) + Math.abs(y - head.y) > keepAway) return { x, y };
  }
  return null;
}

export function newGame(rng = Math.random) {
  const s = { body: [{ x: 5, y: 9 }, { x: 4, y: 9 }, { x: 3, y: 9 }], food: null, special: null, rocks: [], score: 0, eaten: 0, slow: 0, double: 0 };
  s.food = freeCell(s, rng);
  return s;
}

/**
 * Advances one tick. Every 3rd apple adds a rock, every 5th spawns a power-up (slow-mo or double points).
 * Returns the next state plus events: "eat", "rock", "slow", "double", "dead".
 */
export function step(prev, dir, rng = Math.random) {
  const s = { ...prev, body: [...prev.body], rocks: [...prev.rocks] };
  const [dx, dy] = DELTA[dir];
  const head = { x: s.body[0].x + dx, y: s.body[0].y + dy };
  const dead = head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE || at(s.body, head.x, head.y) || at(s.rocks, head.x, head.y);
  if (dead) return { state: s, events: ["dead"] };

  const events = [];
  s.body.unshift(head);
  let grew = false;
  if (s.food && head.x === s.food.x && head.y === s.food.y) {
    grew = true; s.eaten++; s.score += s.double > 0 ? 2 : 1; events.push("eat");
    s.food = freeCell(s, rng);
    if (s.eaten % 3 === 0 && s.rocks.length < 8) {
      const rock = freeCell(s, rng, 3);
      if (rock) { s.rocks.push(rock); events.push("rock"); }
    }
    if (s.eaten % 5 === 0 && !s.special) {
      const spot = freeCell(s, rng);
      if (spot) s.special = { ...spot, type: rng() < 0.5 ? "slow" : "double", ttl: 45 };
    }
  } else if (s.special && head.x === s.special.x && head.y === s.special.y) {
    s[s.special.type] = s.special.type === "slow" ? 25 : 40;
    s.score += 2; events.push(s.special.type); s.special = null;
  }
  if (!grew) s.body.pop();
  if (s.special) { const ttl = s.special.ttl - 1; s.special = ttl > 0 ? { ...s.special, ttl } : null; }
  s.slow = Math.max(0, s.slow - 1);
  s.double = Math.max(0, s.double - 1);
  return { state: s, events };
}
