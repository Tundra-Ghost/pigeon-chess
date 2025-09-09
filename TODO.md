## Pigeon Chess — Planning TODO

Accounts/Auth
- [x] Email/password registration (bcrypt hashing)
- [x] Login/logout with httpOnly JWT cookie
- [x] `/api/auth/me` endpoint
- [x] Client auth modal (guest, login, register)
- [x] Confirm password + show/hide toggle
- [x] Error explanations on failure
- [x] Server health endpoint and client “Test” button

Persistence
- [x] SQLite dev DB
- [x] Tables: `users`, `matches`, `moves`
- [x] Persist SAN moves with metadata
- [x] Rehydrate match state from DB when lobby loads
- [x] Persist final results (matches.result)
- [ ] Expose full match history UI (basic done)

Multiplayer
- [x] Socket.IO lobby with Host/Join
- [x] Invite code flow + Copy Code/Invite Link
- [x] Turn enforcement + server-side legal validation
- [x] Server SAN + broadcast
- [x] Game over detection (checkmate/draw: stalemate, insufficient material, 50-move, repetition)
- [x] Distinct Online Lobby page and Online Match page
- [x] Ready/Unready flow; host-only Start
- [ ] Spectator policy and UI

Routing/Navigation
- [x] HashRouter with distinct URLs
- [x] Menu → Setup → Play (offline)
- [x] Menu → Online Lobby → Online Match

Settings & Sound
- [x] Settings modal (move hints, SFX/BGM enable + volume, theme)
- [x] In-game Settings button

UI/UX
- [x] Poster-inspired main menu
- [x] Clear lobby messages on success/failure
- [x] Only “Play” on offline setup
- [x] About modal
- [x] Result modal (game over)
- [x] Add PLAY_GUIDE.md with how-to-play instructions
- [x] Styled Toast notifications (replace message list)
- [x] Tailwind polish for Setup/Lobby pages
- [x] Spectator list and host toggle in Lobby

Deployment
- [x] Frontend Pages build to `docs/` with base `/pigeon-chess/`
- [x] Server deploy guide + Dockerfile

Networking
- [x] Limit socket connect attempts (single attempt)
- [x] Prefer WebSocket transport
- [x] Multi-origin CORS configuration
