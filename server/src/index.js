import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { initialBoard, at, legalMoves, makeMove, isCheck, isCheckmate, moveToSAN, opposite, positionKey, insufficientMaterial } from './chess.js';

const PORT = process.env.PORT || 8787;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5175').split(',').map(s=>s.trim()).filter(Boolean);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../db/data.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);`);
db.exec(`CREATE TABLE IF NOT EXISTS matches (
  code TEXT PRIMARY KEY,
  host_user_id INTEGER,
  guest_user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TEXT NOT NULL,
  result TEXT
);`);
try { db.exec(`ALTER TABLE matches ADD COLUMN result TEXT`); } catch {}
db.exec(`CREATE TABLE IF NOT EXISTS moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_code TEXT NOT NULL,
  ply INTEGER NOT NULL,
  color TEXT NOT NULL,
  san TEXT NOT NULL,
  from_r INTEGER, from_c INTEGER, to_r INTEGER, to_c INTEGER,
  promotion TEXT,
  player_name TEXT,
  created_at TEXT NOT NULL
);`);

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin === CORS_ORIGIN && CORS_ORIGIN) return cb(null, true);
    if (CORS_ORIGINS.includes(origin)) return cb(null, true);
    if (/\.github\.io$/.test(new URL(origin).hostname)) return cb(null, true);
    cb(new Error('CORS_NOT_ALLOWED'));
  },
  credentials: true,
  optionsSuccessStatus: 204,
}));

const authLimiter = rateLimit({ windowMs: 60_000, max: 20 });

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true behind HTTPS in prod
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token || null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password || !displayName) return res.status(400).json({ error: 'missing_fields', detail: 'Email, password, and display name are required.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'invalid_email', detail: 'Please provide a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'weak_password', detail: 'Password must be at least 8 characters.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)');
    const now = new Date().toISOString();
    const info = stmt.run(email.toLowerCase(), hash, displayName, now);
    const user = { id: info.lastInsertRowid, email: email.toLowerCase(), displayName };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);
    res.json({ user });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'email_taken', detail: 'This email is already registered.' });
    console.error(e);
    res.status(500).json({ error: 'server_error', detail: 'Unexpected server error.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing_fields', detail: 'Email and password required.' });
  const row = db.prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row) return res.status(401).json({ error: 'invalid_credentials', detail: 'Invalid email or password.' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials', detail: 'Invalid email or password.' });
  const user = { id: row.id, email: row.email, displayName: row.display_name };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  setAuthCookie(res, token);
  res.json({ user });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Matches REST endpoints
app.get('/api/matches', (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const mine = String(req.query.mine || '') === '1';
  let rows;
  if (mine && req.cookies?.token) {
    try {
      const u = jwt.verify(req.cookies.token, JWT_SECRET);
      rows = db.prepare('SELECT code, status, result, created_at, host_user_id, guest_user_id FROM matches WHERE host_user_id = ? OR guest_user_id = ? ORDER BY created_at DESC LIMIT ?').all(u.id, u.id, limit);
    } catch {
      rows = db.prepare('SELECT code, status, result, created_at, host_user_id, guest_user_id FROM matches ORDER BY created_at DESC LIMIT ?').all(limit);
    }
  } else {
    rows = db.prepare('SELECT code, status, result, created_at, host_user_id, guest_user_id FROM matches ORDER BY created_at DESC LIMIT ?').all(limit);
  }
  res.json({ matches: rows });
});

app.get('/api/matches/:code/moves', (req, res) => {
  const code = req.params.code;
  const rows = db.prepare('SELECT ply, color, san, from_r, from_c, to_r, to_c, promotion, player_name, created_at FROM moves WHERE match_code = ? ORDER BY ply ASC').all(code);
  res.json({ code, moves: rows });
});

const httpServer = createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

const rooms = new Map(); // roomId -> { players: Map<socketId,{color,user}>, moves: [], turn, board, enPassantTarget, ply, hostId, started, halfmoveClock, repetition, opts }

io.on('connection', (socket) => {
  // Attempt to extract auth user from cookie JWT
  const cookie = socket.handshake.headers?.cookie || '';
  let authUser = null;
  try {
    const token = cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('token='))?.slice(6);
    if (token) authUser = jwt.verify(token, JWT_SECRET);
  } catch {}
  socket.data.user = authUser || null;

  socket.on('host', ({ roomId, user }) => {
    const now = new Date().toISOString();
    try {
      db.prepare('INSERT OR IGNORE INTO matches (code, status, created_at, host_user_id) VALUES (?, ?, ?, ?)')
        .run(roomId, 'waiting', now, socket.data.user?.id || null);
    } catch {}
    let room = rooms.get(roomId);
    if (!room) {
      room = { players: new Map(), moves: [], turn: 'w', board: initialBoard(), enPassantTarget: null, ply: 0, hostId: socket.id, started: false, opts: { allowSpectators: true } };
      rooms.set(roomId, room);
    }
    if (room.started) { socket.emit('join_error', { reason: 'game_already_started' }); return; }
    socket.join(roomId);
    const assigned = [...room.players.values()].map(p => p.color);
    const color = assigned.includes('w') ? (assigned.includes('b') ? 'spec' : 'b') : 'w';
    room.players.set(socket.id, { color, user: user || authUser || { displayName: authUser?.displayName } });
    socket.emit('you', { color });
    socket.emit('host_ok', { roomId });
    io.to(roomId).emit('room_update', { players: [...room.players.entries()].map(([id,p]) => ({ socketId: id, color: p.color, user: p.user })), hostId: room.hostId, ready: room.ready || {}, opts: room.opts, moves: room.moves });
  });

  socket.on('join_room', ({ roomId, user }) => {
    const match = db.prepare('SELECT code FROM matches WHERE code = ?').get(roomId);
    if (!match) { socket.emit('join_error', { reason: 'code_not_found' }); return; }
    let room = rooms.get(roomId);
    if (!room) { room = { players: new Map(), moves: [], turn: 'w', board: initialBoard(), enPassantTarget: null, ply: 0, hostId: null, started: false, halfmoveClock: 0, repetition: {}, opts: { allowSpectators: true } }; rooms.set(roomId, room); }
    // rehydrate from DB
    const pastMoves = db.prepare('SELECT * FROM moves WHERE match_code = ? ORDER BY ply ASC').all(roomId);
    for (const m of pastMoves) {
      const move = { from: { r: m.from_r, c: m.from_c }, to: { r: m.to_r, c: m.to_c }, promotion: m.promotion || undefined };
      room.board = makeMove(room.board, move, room.enPassantTarget);
      const piece = at(room.board, move.to);
      if (piece && piece.type==='P' && Math.abs(m.to_r - m.from_r)===2) {
        room.enPassantTarget = { r: (m.to_r + m.from_r)/2, c: m.from_c };
      } else {
        room.enPassantTarget = null;
      }
      room.ply = m.ply;
      room.turn = room.turn==='w'?'b':'w';
    }
    if (room.started) { socket.emit('join_error', { reason: 'game_already_started' }); return; }
    const assigned = [...room.players.values()].map(p => p.color).filter(c => c === 'w' || c === 'b');
    let color;
    if (assigned.includes('w') && assigned.includes('b')) {
      if (room.opts?.allowSpectators) color = 'spec';
      else { socket.emit('join_error', { reason: 'room_full' }); return; }
    } else {
      color = assigned.includes('w') ? 'b' : 'w';
    }
    socket.join(roomId);
    room.players.set(socket.id, { color, user: user || authUser || { displayName: authUser?.displayName } });
    socket.emit('you', { color });
    socket.emit('join_ok', { roomId, color });
    try { db.prepare('UPDATE matches SET guest_user_id = COALESCE(guest_user_id, ?) WHERE code = ?')
      .run(socket.data.user?.id || null, roomId); } catch {}
    io.to(roomId).emit('player_joined', { user, color });
    io.to(roomId).emit('room_update', { players: [...room.players.entries()].map(([id,p]) => ({ socketId: id, color: p.color, user: p.user })), hostId: room.hostId, ready: room.ready || {}, opts: room.opts, moves: room.moves });
  });

  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) { socket.emit('error_msg', { reason: 'room_missing' }); return; }
    if (room.hostId && socket.id !== room.hostId) { socket.emit('error_msg', { reason: 'not_host' }); return; }
    const assigned = [...room.players.values()].map(p => p.color).filter(c => c==='w' || c==='b');
    if (!(assigned.includes('w') && assigned.includes('b'))) { socket.emit('error_msg', { reason: 'need_two_players' }); return; }
    const rmap = room.ready || {};
    if (!(rmap['w'] && rmap['b'])) { socket.emit('error_msg', { reason: 'players_not_ready' }); return; }
    room.started = true;
    io.to(roomId).emit('game_started', { roomId });
  });

  socket.on('set_ready', ({ roomId, color, ready }) => {
    const room = rooms.get(roomId); if (!room) return;
    room.ready = room.ready || {};
    room.ready[color] = !!ready;
    io.to(roomId).emit('room_update', { players: [...room.players.entries()].map(([id,p]) => ({ socketId: id, color: p.color, user: p.user })), hostId: room.hostId, ready: room.ready, opts: room.opts, moves: room.moves });
  });

  socket.on('set_room_opts', ({ roomId, opts }) => {
    const room = rooms.get(roomId); if (!room) return;
    if (room.hostId && socket.id !== room.hostId) { socket.emit('error_msg', { reason: 'not_host' }); return; }
    room.opts = { ...room.opts, ...opts };
    io.to(roomId).emit('room_update', { players: [...room.players.entries()].map(([id,p]) => ({ socketId: id, color: p.color, user: p.user })), hostId: room.hostId, ready: room.ready || {}, opts: room.opts, moves: room.moves });
  });

  socket.on('move', ({ roomId, move }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || (player.color !== 'w' && player.color !== 'b')) return; // spectators can't move
    if (player.color !== room.turn) return; // not your turn
    // validate move
    const piece = at(room.board, move.from);
    if (!piece || piece.color !== player.color) return;
    const legal = legalMoves(room.board, move.from, player.color, room.enPassantTarget);
    if (!legal.some(d => d.r === move.to.r && d.c === move.to.c)) return; // illegal
    // promotion default to Q if necessary
    if (piece.type === 'P') {
      if (player.color === 'w' && move.to.r === 0 && !move.promotion) move.promotion = 'Q';
      if (player.color === 'b' && move.to.r === 7 && !move.promotion) move.promotion = 'Q';
    }
    const san = moveToSAN(room.board, move, player.color, room.enPassantTarget);
    // update EP target
    let nextEP = null;
    if (piece.type === 'P' && Math.abs(move.to.r - move.from.r) === 2) {
      nextEP = { r: (move.to.r + move.from.r) / 2, c: move.from.c };
    }
    room.board = makeMove(room.board, move, room.enPassantTarget);
    room.enPassantTarget = nextEP;
    room.moves.push({ ...move, san, color: player.color, byName: player.user?.displayName });
    room.turn = room.turn === 'w' ? 'b' : 'w';
    room.ply += 1;
    // draw detection bookkeeping
    room.halfmoveClock = (piece.type==='P' || at(room.board, move.to) /*capture after move*/)? 0 : ((room.halfmoveClock||0)+1);
    const key = positionKey(room.board, room.turn, room.enPassantTarget);
    room.repetition = room.repetition || {}; room.repetition[key] = (room.repetition[key]||0)+1;
    // persist move
    try {
      db.prepare('INSERT INTO moves (match_code, ply, color, san, from_r, from_c, to_r, to_c, promotion, player_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(roomId, room.ply, player.color, san, move.from.r, move.from.c, move.to.r, move.to.c, move.promotion || null, player.user?.displayName || null, new Date().toISOString());
    } catch {}
    // game over detection
    let winner = null; let drawReason = null;
    const opponent = room.turn; // after switch
    if (isCheckmate(room.board, opponent, room.enPassantTarget)) {
      winner = player.color;
    } else {
      const anyMove = hasAnyLegalMove(room.board, opponent, room.enPassantTarget);
      if (!anyMove && !isCheck(room.board, opponent, room.enPassantTarget)) { drawReason = 'stalemate'; }
      else if (insufficientMaterial(room.board)) { drawReason = 'insufficient_material'; }
      else if ((room.halfmoveClock||0) >= 100) { drawReason = 'fifty_move_rule'; }
      else if ((room.repetition[key]||0) >= 3) { drawReason = 'threefold_repetition'; }
    }
    io.to(roomId).emit('move', { ...move, san, color: player.color, byName: player.user?.displayName });
    if (winner || drawReason) {
      room.started = false;
      const result = winner ? `win:${winner}` : `draw:${drawReason}`;
      try { db.prepare('UPDATE matches SET status = ?, result = ? WHERE code = ?').run('finished', result, roomId); } catch {}
      io.to(roomId).emit('game_over', { result, winner, drawReason });
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.delete(socket.id)) {
        io.to(roomId).emit('room_update', { players: [...room.players.values()].map((p) => ({ color: p.color, user: p.user })), moves: room.moves });
        if (room.players.size === 0) rooms.delete(roomId);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
