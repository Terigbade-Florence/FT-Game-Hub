import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const db = openDb(process.env.DB_FILE ?? join(root, "data.sqlite"));
const port = Number(process.env.PORT ?? 3000);
const trustProxy = Number(process.env.TRUST_PROXY ?? 0);

const server = createApp({ db, publicDir: join(root, "public"), trustProxy });
server.listen(port, () => console.log(`Game Shelf running at http://localhost:${port}`));

// Finish in-flight requests and close the database when the platform stops the service.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => { db.close(); process.exit(0); });
    server.closeIdleConnections();
  });
}
