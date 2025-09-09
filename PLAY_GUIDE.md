# Pigeon Chess — Player Guide

This guide explains how to play locally and online, how to set up the server, and how to troubleshoot common issues.

## Offline (Local)

1) From the main menu choose “Play Offline”.
2) In the setup screen, set White/Black names and (optional) modifiers.
3) Click “Play” to start the game.
4) Click a piece to select; click again to deselect. Legal targets appear as dots. Click a target to move.
5) Sounds: standard moves, captures, and castling. Adjust volumes from “Settings”.
6) End conditions: checkmate wins; draw reasons include stalemate, insufficient material, 50‑move rule, and threefold repetition. The sidebar and result modal explain what happened.

Tips
- Toggle “Show move hints” and sound volumes in Settings (menu or in‑game sidebar).
- Move list uses SAN (standard algebraic notation).

## Online (Beta)

Server
- Start the server:

```bash
cd server
npm install
npm run dev
```

- Health: GET `http://localhost:8787/api/health` → `{ ok: true }`.
- CORS: By default allows `http://localhost:5173` and `http://localhost:5175` and any `*.github.io` origin. You can set `CORS_ORIGINS` (comma‑separated) in the environment.

Client setup
1) In the app, open “Account”. Set the server to `http://localhost:8787` and click “Test” (should display “Server reachable”).
2) Optionally register or log in. Registration requires a valid email and a password of 8+ characters.

Lobby flow
1) Choose “Play Online (beta)” from the menu.
2) Enter your name and an invite code.
   - Click “Generate” for a new code, then “Host”.
   - Share the code or click “Copy Invite Link” to share a URL that pre‑fills the lobby.
3) Friend enters the code and clicks “Join”.
4) Both players click “Ready”. Host clicks “Start Game”.
5) During the match, moves are validated server‑side and SAN is shown in the move list. A result modal appears at game end.

Troubleshooting
- “Failed to connect: xhr poll error”
  - Verify the server is running and reachable (Account → Test).
  - Confirm the server URL matches protocol/port (e.g., `http://localhost:8787`).
  - Connection attempts only once; fix the issue and click “Connect” again.

- “Invite code not found”
  - Host must create the lobby first. Make sure you are using the correct code.

- “Room is full”
  - Lobby already has White and Black. Ask host to create a new code.

## Controls & UI

- Click to select/deselect; legal targets shown as dots.
- Sidebar shows whose turn it is, and whether a side is in check.
- Settings from menu and in‑game sidebar: move hints, SFX/BGM enable + volume, theme.

## Deployment (GitHub Pages)

- Frontend: `vite.config.ts` uses `base: "/pigeon-chess/"` and outputs to `docs/` (`npm run build`).
- Use HashRouter (already configured) to make routes work on Pages.
- Server: Deploy where desired (Render/Fly/Heroku). Set `JWT_SECRET`, `CORS_ORIGINS`, and point the client to your server URL in Account.

