# Game Shelf

A small arcade hub (Tic-Tac-Toe, Memory Match, Snake) with a SQLite-backed leaderboard API.
Zero npm dependencies: it runs on Node's built-in `http`, `node:sqlite` and `node:test`.

## Run it

```bash
node --version   # needs 22.13 or newer
npm start        # http://localhost:3000
npm test
```

Set `PORT` or `DB_FILE` to change the port or database location.

## Architecture

```
server/db.js      SQLite access, schema, per-game score rules
server/app.js     HTTP routes, validation, rate limiting, static files, security headers
server/index.js   entry point
public/           the client: index.html, styles.css, ES modules in js/ (one per game)
test/             API tests (node:test)
```

The client talks to the API through `public/js/api.js`. If the API is unreachable (for example when
the files are hosted on a static site) it falls back to a leaderboard stored on the device.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/scores?game=snake\|memory` | Top 10. Snake ranks high to low, Memory low to high. |
| POST | `/api/scores` | JSON `{game, player, score}`. Returns 201, or 422 if invalid, 429 if rate limited. |

## Design decisions

- **Validation on the server:** score ranges per game, names stripped to letters, numbers, spaces, `_` and `-`.
- **Safety:** parameterised SQL, request size cap, per-IP rate limit, path-traversal guard, CSP header.
- **Accessibility:** skip link, live regions for game status, keyboard play, focus moved on navigation,
  `prefers-reduced-motion` and light or dark theme respected.
- **Trade-off:** scores are self-reported by the browser, so the leaderboard is for fun, not anti-cheat.

## Next steps

Accounts, replayable server-side score checks, more games, and a CI workflow that runs `npm test`.
