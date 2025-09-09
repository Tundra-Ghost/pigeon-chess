import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getServerUrl, me } from '../api';

type Player = { color: 'w'|'b'|'spec'; user?: { displayName?: string } };

export default function OnlineLobby({ onBack, onStartMatch }: { onBack?: () => void; onStartMatch: (roomId: string, userName: string) => void }) {
  const [roomId, setRoomId] = useState('');
  const [connected, setConnected] = useState(false);
  const [/* myColor */, setMyColor] = useState<'w'|'b'|'spec'|'?'>('?');
  const [players, setPlayers] = useState<Player[]>([]);
  const [userName, setUserName] = useState('Guest');
  const [messages, setMessages] = useState<Array<{ type: 'info'|'success'|'error', text: string }>>([]);
  const sockRef = useRef<Socket | null>(null);
  const [hostMode, setHostMode] = useState(false);

  useEffect(() => { me().then(u => setUserName(u?.displayName || 'Guest')); }, []);

  function connect() {
    if (sockRef.current?.connected) return;
    const socket = io(getServerUrl(), { withCredentials: true });
    sockRef.current = socket;
    socket.on('connect', () => push('success','Connected to server'));
    socket.on('connect_error', (err) => push('error', 'Failed to connect: ' + (err?.message || 'unknown')));
    socket.on('disconnect', () => push('error','Disconnected from server'));
    socket.on('you', ({ color }) => setMyColor(color));
    socket.on('host_ok', ({ roomId }) => { push('success', `Hosting ${roomId}`); setConnected(true); setHostMode(true); });
    socket.on('join_ok', ({ roomId, color }) => { push('success', `Joined ${roomId} as ${color==='w'?'White':'Black'}`); setConnected(true); });
    socket.on('join_error', ({ reason }) => push('error', reason==='code_not_found'?'Invite code not found': reason==='room_full'?'Room is full': reason==='game_already_started'?'Game already started':'Join failed'));
    socket.on('player_joined', ({ user, color }) => push('info', `${user?.displayName || 'Player'} joined as ${color==='w'?'White':'Black'}`));
    socket.on('room_update', ({ players }) => setPlayers(players));
    socket.on('game_started', ({ roomId }) => {
      const s = sockRef.current; s?.disconnect(); sockRef.current = null;
      onStartMatch(roomId, userName);
    });
  }

  function host() {
    if (!roomId) { push('error','Enter a code to host'); return; }
    connect();
    const s = sockRef.current; if (!s) return;
    s.emit('host', { roomId, user: { displayName: userName } });
  }
  function join() {
    if (!roomId) { push('error','Enter an invite code to join'); return; }
    connect();
    const s = sockRef.current; if (!s) return;
    s.emit('join_room', { roomId, user: { displayName: userName } });
  }
  function startGame() {
    const s = sockRef.current; if (!s) return;
    s.emit('start_game', { roomId });
  }
  function genCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random()*alphabet.length)];
    setRoomId(code.slice(0,4)+'-'+code.slice(4));
  }
  async function copyCode() { try { await navigator.clipboard.writeText(roomId); push('success','Copied code'); } catch {} }
  function push(type:'info'|'success'|'error', text:string){ setMessages(m=>[...m, {type, text}]); }

  const white = players.find(p=>p.color==='w')?.user?.displayName || 'White';
  const black = players.find(p=>p.color==='b')?.user?.displayName || 'Black';
  const ready = players.some(p=>p.color==='w') && players.some(p=>p.color==='b');

  return (
    <div style={{maxWidth:900, margin:'0 auto', padding:'20px'}}>
      <h2>Online Lobby</h2>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
        <input placeholder="Your name" value={userName} onChange={e=>setUserName(e.target.value)} />
        <input placeholder="Invite code" value={roomId} onChange={e=>setRoomId(e.target.value)} />
        <button onClick={genCode}>Generate</button>
        <button onClick={copyCode}>Copy</button>
        <button onClick={host}>Host</button>
        <button onClick={join}>Join</button>
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
      <div style={{marginTop:10}}>
        <div>White: <b>{white}</b></div>
        <div>Black: <b>{black}</b></div>
      </div>
      <div style={{marginTop:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{padding:'6px 8px', margin:'4px 0', borderRadius:6, background:m.type==='error'?'#7f1d1d': m.type==='success'?'#14532d':'#1f2937', color:'#fff'}}>{m.text}</div>
        ))}
      </div>
      <div style={{marginTop:14}}>
        <button onClick={startGame} disabled={!connected || !ready || !hostMode}>Start Game</button>
        {!hostMode && connected && <span style={{marginLeft:8}}>Waiting for host to start…</span>}
      </div>
    </div>
  );
}
