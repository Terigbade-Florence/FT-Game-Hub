import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const db = openDb(process.env.DB_FILE ?? join(root, "data.sqlite"));
const port = Number(process.env.PORT ?? 3000);

createApp({ db, publicDir: join(root, "public") }).listen(port, () =>
  console.log(`Game Shelf running at http://localhost:${port}`),
);
