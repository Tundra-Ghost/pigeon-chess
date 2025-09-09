# Deploying the Pigeon Chess Server

This server is a simple Express + Socket.IO app with SQLite. It uses cookie-based JWT auth and supports multi-origin CORS.

## Env Vars

- `PORT`: HTTP port (default 8787)
- `JWT_SECRET`: Required secret for signing JWTs
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g., `https://youruser.github.io,https://yourdomain`)

## Files

- Entry: `server/src/index.js`
- SQLite file: `server/db/data.sqlite` (will be created automatically)

## Health Check

`GET /api/health` → `{ ok: true }`

## Deployment (Render example)

1) Create a new “Web Service”, connect your repo and point build to the `server` folder.
2) Build command: `npm install`
3) Start command: `node ./src/index.js`
4) Environment:
   - `NODE_ENV=production`
   - `PORT=10000` (Render sets `$PORT`, so you can omit setting it manually)
   - `JWT_SECRET=your-secret`
   - `CORS_ORIGINS=https://youruser.github.io`

If using Fly.io/Heroku, set the same envs and the start command accordingly.

## Pointing the Client

In the app, open the Account modal. Set the server URL to your deployed URL and click “Test”. When it says “Server reachable”, you’re good to register/login and play online.

