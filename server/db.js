import { DatabaseSync } from "node:sqlite";

// Per-game rules: allowed score range and ranking direction.
export const RULES = {
  snake: { min: 0, max: 2000, order: "DESC" },
  memory: { min: 8, max: 300, order: "ASC" },
  blitz: { min: 0, max: 20000, order: "DESC" },
};

export function openDb(file = ":memory:") {
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY,
      game TEXT NOT NULL,
      player TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores (game, score);
  `);
  const insert = db.prepare("INSERT INTO scores (game, player, score) VALUES (?, ?, ?)");
  return {
    add: (game, player, score) => Number(insert.run(game, player, score).lastInsertRowid),
    top(game, limit = 10) {
      // `order` comes from the RULES whitelist, never from user input.
      const sql = `SELECT player, score, created_at AS at FROM scores
                   WHERE game = ? ORDER BY score ${RULES[game].order}, id ASC LIMIT ?`;
      return db.prepare(sql).all(game, limit).map((row) => ({ ...row }));
    },
    close: () => db.close(),
  };
}
