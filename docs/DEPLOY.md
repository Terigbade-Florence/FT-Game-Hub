# Deploying Game Shelf

The app has no npm dependencies. It needs Node 22.13 or newer and a place to write one SQLite file.

## 1. Get the code into GitHub (keeping the commit history)

The zip contains a full git history. Push it over the repository's old single-file version.

**On a computer**
```bash
unzip game-shelf.zip && cd game-shelf
git config user.name "Your Name"
git config user.email "ID+USERNAME@users.noreply.github.com"   # GitHub > Settings > Emails
git rebase -r --root --exec "git commit --amend --reset-author --no-edit"
git remote add origin https://github.com/USERNAME/REPO.git
git push --force -u origin main
```

**On a phone (GitHub Codespaces, free personal accounts include 120 core hours a month)**
1. In Chrome, open the repository and switch on "Desktop site".
2. Tap **Code**, then the **Codespaces** tab, then **Create codespace on main**.
3. In the Explorer panel, long-press an empty area, tap **Upload...** and choose `game-shelf.zip`.
4. Open a terminal and run the same commands as above. Use `unzip`, or
   `python3 -m zipfile -e game-shelf.zip .` if unzip is missing.
5. Delete the codespace afterwards (github.com/codespaces) to save your free allowance.

The push triggers the CI workflow. Check the **Actions** tab for a green tick.

## 2. Deploy on Render (free)

1. Sign in at render.com with GitHub.
2. Tap **New +**, then **Blueprint**, pick the repository, and apply. Render reads `render.yaml`.
   If it asks for payment details, use **New + > Web Service** instead and enter:
   Runtime Node, Build `npm install`, Start `npm start`, Instance type **Free**,
   Health Check Path `/healthz`, environment variable `TRUST_PROXY` = `1`.
3. Wait for the deploy to finish, then open the `.onrender.com` address.
4. Check that `/healthz` returns `{"ok":true}` and that the leaderboard note says
   "Global leaderboard" (not "Offline mode"). Play one round and confirm the score appears.
5. Put the live address in the README, the GitHub repository's website field, and your application.

## Free tier limits (from Render's documentation)

- A free service spins down after 15 minutes without traffic. The next visit takes about a minute.
- Free services have an ephemeral filesystem, so the SQLite file (and the leaderboard) is lost when the
  service restarts, redeploys or spins down. Persistent disks need a paid instance.
- For a durable leaderboard, use a paid Render instance with a disk and set `DB_FILE` to a path on it, or run
  the `Dockerfile` on a host that supports volumes and mount one at `/data`. The Dockerfile has not been tested.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | 3000 | HTTP port (Render sets this) |
| `DB_FILE` | `./data.sqlite` | SQLite file path |
| `TRUST_PROXY` | 0 | Number of reverse proxies in front; makes rate limiting use the real client IP |
