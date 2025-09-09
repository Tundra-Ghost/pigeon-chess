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

const PORT = process.env.PORT || 8787;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

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

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

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
  if (!email || !password || !displayName) return res.status(400).json({ error: 'missing_fields' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'invalid_email' });
  if (password.length < 8) return res.status(400).json({ error: 'weak_password' });
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
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'email_taken' });
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' });
  const row = db.prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
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

const httpServer = createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

const rooms = new Map(); // roomId -> { players: Map<socketId,{color,user}>, moves: [], turn: 'w'|'b' }

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, user }) => {
    socket.join(roomId);
    let room = rooms.get(roomId);
    if (!room) { room = { players: new Map(), moves: [], turn: 'w' }; rooms.set(roomId, room); }
    // assign color
    const assigned = [...room.players.values()].map(p => p.color);
    const color = assigned.includes('w') ? (assigned.includes('b') ? 'spec' : 'b') : 'w';
    room.players.set(socket.id, { color, user });
    socket.emit('you', { color });
    io.to(roomId).emit('room_update', { players: [...room.players.values()].map((p) => ({ color: p.color, user: p.user })), moves: room.moves });
  });

  socket.on('move', ({ roomId, move }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || (player.color !== 'w' && player.color !== 'b')) return; // spectators can't move
    if (player.color !== room.turn) return; // not your turn
    room.moves.push(move);
    room.turn = room.turn === 'w' ? 'b' : 'w';
    io.to(roomId).emit('move', move);
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
