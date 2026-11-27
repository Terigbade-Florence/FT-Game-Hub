import test from "node:test";
import assert from "node:assert/strict";
import { emptyMoves, winner, place, bestMove, freeCells, makeDeck, ICONS, comboPoints, newGame, step } from "../public/js/logic.js";

const lcg = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

test("winner finds a completed line", () => {
  assert.deepEqual(winner({ X: [0, 1, 2], O: [3, 4] }).line, [0, 1, 2]);
  assert.equal(winner({ X: [0, 1], O: [3, 4] }), null);
});

test("Vanishing mode drops the oldest mark", () => {
  let moves = emptyMoves();
  for (const cell of [0, 1, 2, 3]) moves = place(moves, "X", cell, 3);
  assert.deepEqual(moves.X, [1, 2, 3]);
});

test("bestMove takes a win and blocks a loss", () => {
  assert.equal(bestMove({ X: [0, 1], O: [3, 4] }, "X"), 2);
  assert.equal(bestMove({ X: [0, 1], O: [4] }, "O"), 2);
});

test("the unbeatable CPU never loses a classic game", () => {
  const rng = lcg(7);
  for (let game = 0; game < 25; game++) {
    let moves = emptyMoves();
    for (let turn = 0; turn < 9 && !winner(moves); turn++) {
      const player = turn % 2 ? "O" : "X", free = freeCells(moves);
      const cell = player === "O" ? bestMove(moves, "O", 9, 9, rng) : free[Math.floor(rng() * free.length)];
      moves = place(moves, player, cell, 9);
    }
    assert.notEqual(winner(moves)?.player, "X");
  }
});

test("makeDeck has every icon exactly twice", () => {
  const deck = makeDeck(lcg(3));
  assert.equal(deck.length, ICONS.length * 2);
  for (const icon of ICONS) assert.equal(deck.filter((d) => d === icon).length, 2);
});

test("combo points grow with the streak", () => {
  assert.deepEqual([1, 2, 3].map(comboPoints), [100, 200, 300]);
});

const base = () => ({ ...newGame(lcg(5)), body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], food: { x: 6, y: 5 }, rocks: [], special: null });

test("snake eats, grows and scores", () => {
  const { state, events } = step(base(), "R", lcg(2));
  assert.equal(state.body.length, 4);
  assert.equal(state.score, 1);
  assert.ok(events.includes("eat"));
});

test("double points effect doubles an apple", () => {
  assert.equal(step({ ...base(), double: 5 }, "R", lcg(2)).state.score, 2);
});

test("walls and rocks are deadly", () => {
  assert.deepEqual(step({ ...base(), body: [{ x: 17, y: 5 }, { x: 16, y: 5 }] }, "R").events, ["dead"]);
  assert.deepEqual(step({ ...base(), rocks: [{ x: 6, y: 5 }], food: { x: 0, y: 0 } }, "R").events, ["dead"]);
});

test("every third apple adds a rock and every fifth a power-up", () => {
  assert.ok(step({ ...base(), eaten: 2 }, "R", lcg(9)).events.includes("rock"));
  const fifth = step({ ...base(), eaten: 4 }, "R", lcg(9)).state;
  assert.ok(fifth.special && ["slow", "double"].includes(fifth.special.type));
});

test("collecting a power-up starts its effect", () => {
  const s = { ...base(), food: { x: 0, y: 0 }, special: { x: 6, y: 5, type: "slow", ttl: 30 } };
  const { state, events } = step(s, "R");
  assert.ok(events.includes("slow"));
  assert.equal(state.special, null);
  assert.ok(state.slow > 0);
});
