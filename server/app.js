import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize, resolve, sep } from "node:path";
import { RULES } from "./db.js";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:",
};

const send = (res, code, body, type = "application/json") => {
  res.writeHead(code, { ...HEADERS, "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
};

/** Validates and normalises a score submission. Returns {error} or clean fields. */
export function validate(body) {
  const rule = RULES[body?.game];
  if (!rule) return { error: "Unknown game" };
  const { score } = body;
  if (!Number.isInteger(score) || score < rule.min || score > rule.max) {
    return { error: "Score out of range" };
  }
  const player = String(body.player ?? "").replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 16);
  if (!player) return { error: "Player name required" };
  return { game: body.game, score, player };
}

export function createApp({ db, publicDir, rateLimit = 30, trustProxy = 0 }) {
  const root = resolve(publicDir);
  const hits = new Map();
  // Behind N trusted proxies the client IP is the Nth entry from the end of X-Forwarded-For.
  const clientIp = (req) => {
    const parts = String(req.headers["x-forwarded-for"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return (trustProxy > 0 && parts[parts.length - trustProxy]) || req.socket.remoteAddress;
  };
  const limited = (ip) => {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > rateLimit;
  };

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname === "/api/scores" && req.method === "GET") {
        const game = url.searchParams.get("game");
        return RULES[game] ? send(res, 200, { game, scores: db.top(game) }) : send(res, 400, { error: "Unknown game" });
      }
      if (url.pathname === "/api/scores" && req.method === "POST") {
        if (limited(clientIp(req))) return send(res, 429, { error: "Too many requests" });
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 2048) return send(res, 413, { error: "Payload too large" });
        }
        let body;
        try { body = JSON.parse(raw); } catch { return send(res, 400, { error: "Invalid JSON" }); }
        const clean = validate(body);
        if (clean.error) return send(res, 422, clean);
        return send(res, 201, { id: db.add(clean.game, clean.player, clean.score), ...clean });
      }
      if (url.pathname === "/healthz") return send(res, 200, { ok: true });
      if (url.pathname.startsWith("/api/")) return send(res, 404, { error: "Not found" });

      const rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).slice(1);
      const file = resolve(root, normalize(rel));
      if (!file.startsWith(root + sep)) return send(res, 403, { error: "Forbidden" });
      send(res, 200, await readFile(file), TYPES[extname(file)] ?? "application/octet-stream");
    } catch (err) {
      if (err.code === "ENOENT" || err.code === "EISDIR") return send(res, 404, { error: "Not found" });
      console.error(err);
      send(res, 500, { error: "Server error" });
    }
  });
}
