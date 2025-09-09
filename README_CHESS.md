# Pigeon Chess — Basic Chess Prototype

This repo now includes a basic playable chess game built with React + TypeScript (no external chess libraries).

Features:
- Legal moves for all pieces
- Captures and turn-based play with player names
- Check, checkmate, and stalemate detection
- Castling and en passant supported
- Pawn auto-promotion to a Queen
- Click-to-select, highlighted legal targets, move history
- Setup screen to enter player names and choose modifiers (scaffold)
- Tailwind CSS integrated via PostCSS plugin

Additional Draw Conditions:
- Stalemate when no legal moves and not in check
- Insufficient material (e.g., K vs K, K+B vs K, K+N vs K, K+B vs K+B with same bishop colors)
- 50-move rule (100 half-moves without a capture or pawn move)
- Threefold repetition (tracked by a position hash)

Run locally:

```bash
npm run dev
```

Open http://localhost:5173/ and play.

Deploying to GitHub Pages:
- `vite.config.ts` sets `base: "/pigeon-chess/"` and `build.outDir = "docs"` so `npm run build` produces a Pages-ready site in `docs/`.
- All assets are referenced with the correct base path to avoid 404s on GitHub Pages.

Notes:
- Castling and en passant are intentionally omitted for the first pass to keep logic simple.
- If you want them added next, say the word and I’ll extend the engine.
