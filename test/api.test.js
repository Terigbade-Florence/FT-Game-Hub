import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { openDb } from "../server/db.js";
import { createApp, validate } from "../server/app.js";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

async function start(options = {}) {
  const server = createApp({ db: openDb(), publicDir, ...options });
  await new Promise((resolve) => server.listen(0, resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => { server.close(); server.closeAllConnections(); },
  };
}
const post = (base, body) => fetch(`${base}/api/scores`, { method: "POST", body: JSON.stringify(body) });
const get = async (base, game) => (await fetch(`${base}/api/scores?game=${game}`)).json();

test("validate cleans player names", () => {
  assert.deepEqual(validate({ game: "snake", score: 12, player: "  Flo<script> " }), {
    game: "snake", score: 12, player: "Floscript",
  });
});

test("validate rejects bad input", () => {
  for (const bad of [
    { game: "pong", score: 1, player: "a" },
    { game: "snake", score: -1, player: "a" },
    { game: "snake", score: 1.5, player: "a" },
    { game: "memory", score: 3, player: "a" },
    { game: "snake", score: 1, player: "!!!" },
  ]) assert.ok(validate(bad).error, JSON.stringify(bad));
});

test("leaderboards rank snake high-to-low and memory low-to-high", async () => {
  const { base, close } = await start();
  for (const [player, score] of [["A", 5], ["B", 9]]) {
    assert.equal((await post(base, { game: "snake", player, score })).status, 201);
  }
  for (const [player, score] of [["A", 20], ["B", 12]]) await post(base, { game: "memory", player, score });
  assert.deepEqual((await get(base, "snake")).scores.map((s) => s.player), ["B", "A"]);
  assert.deepEqual((await get(base, "memory")).scores.map((s) => s.player), ["B", "A"]);
  for (const [player, score] of [["A", 300], ["B", 900]]) await post(base, { game: "blitz", player, score });
  assert.deepEqual((await get(base, "blitz")).scores.map((s) => s.player), ["B", "A"]);
  close();
});

test("API returns proper errors", async () => {
  const { base, close } = await start();
  assert.equal((await post(base, { game: "snake", player: "A", score: 99999 })).status, 422);
  assert.equal((await fetch(`${base}/api/scores`, { method: "POST", body: "{nope" })).status, 400);
  assert.equal((await fetch(`${base}/api/scores?game=pong`)).status, 400);
  assert.equal((await fetch(`${base}/api/nothing`)).status, 404);
  close();
});

test("rate limiting returns 429", async () => {
  const { base, close } = await start({ rateLimit: 2 });
  const statuses = [];
  for (let i = 0; i < 3; i++) statuses.push((await post(base, { game: "snake", player: "A", score: 1 })).status);
  assert.deepEqual(statuses, [201, 201, 429]);
  close();
});

test("static files are served and path traversal is blocked", async () => {
  const { base, close } = await start();
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(`${base}/..%2Fserver%2Fdb.js`)).status, 403);
  assert.equal((await fetch(`${base}/missing.js`)).status, 404);
  close();
});
