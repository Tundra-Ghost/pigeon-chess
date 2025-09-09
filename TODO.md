## Pigeon Chess — Planning TODO

- Accounts/Auth
  - Email/password registration (bcrypt hashing)
  - Login/logout with httpOnly JWT cookie
  - Get current user endpoint (`/api/auth/me`)
  - Client UI to register/login or continue as guest

- Persistence
  - SQLite for dev (file-based), abstract to Postgres later
  - Migrations for `users`, `matches`

- Multiplayer
  - Socket.IO server with rooms
  - Join room (assign white/black), broadcast moves
  - Basic turn enforcement server-side
  - Client lobby/join by code

- Settings
  - In-app settings modal (theme, show legal moves, sounds)
  - Persist in `localStorage`

- Deployment
  - Frontend on GitHub Pages (docs/)
  - Server on a host (Render/Fly/Heroku) – env vars for CORS/JWT/DB

- Security
  - Rate-limit auth endpoints
  - Helmet headers
  - CORS with allowlist
  - Password policy + email validation

- Next (stretch)
  - Guest→account upgrade flow
  - Profile: avatar, rating (later)
  - Match persistence and reconnect
