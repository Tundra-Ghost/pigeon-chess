import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/medieval.css';
import { io, Socket } from 'socket.io-client';
import { getServerUrl, me } from '../api';
import { showToast } from '../ui/Toaster';

type Player = { color: 'w'|'b'|'spec'; user?: { displayName?: string } };

export default function OnlineLobby({ onBack, onStartMatch }: { onBack?: () => void; onStartMatch: (roomId: string, userName: string) => void }) {
  const [roomId, setRoomId] = useState('');
  const [connected, setConnected] = useState(false);
  const [/* myColor */, setMyColor] = useState<'w'|'b'|'spec'|'?'>('?');
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [readyMap, setReadyMap] = useState<Record<'w'|'b', boolean>>({ w: false, b: false } as any);
  const [allowSpecs, setAllowSpecs] = useState(true);
  const [userName, setUserName] = useState('Guest');
  const [messages, setMessages] = useState<Array<{ type: 'info'|'success'|'error', text: string }>>([]);
  const sockRef = useRef<Socket | null>(null);
  const [hostMode, setHostMode] = useState(false);
  const location = useLocation();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => { me().then(u => setUserName(u?.displayName || 'Guest')); }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const name = params.get('name');
    if (code) setRoomId(code);
    if (name) setUserName(name);
  }, [location.search]);

  function connect() {
    if (sockRef.current?.connected || connecting) return;
    setConnecting(true);
    const socket = io(getServerUrl(), { withCredentials: true, reconnection: false, reconnectionAttempts: 1, timeout: 6000, transports: ['websocket'] });
    sockRef.current = socket;
    socket.on('connect', () => { setConnected(true); setConnecting(false); push('success','Connected to server'); });
    socket.on('connect_error', (err) => { setConnected(false); setConnecting(false); push('error', 'Failed to connect: ' + (err?.message || 'unknown')); try{ socket.close(); }catch{}; sockRef.current=null; });
    socket.on('disconnect', () => { setConnected(false); setMyColor('?'); push('error','Disconnected from server'); });
    socket.on('you', ({ color }) => setMyColor(color));
    socket.on('host_ok', ({ roomId }) => { push('success', `Hosting ${roomId}`); setConnected(true); setHostMode(true); });
    socket.on('join_ok', ({ roomId, color }) => { push('success', `Joined ${roomId} as ${color==='w'?'White':'Black'}`); setConnected(true); });
    socket.on('join_error', ({ reason }) => push('error', reason==='code_not_found'?'Invite code not found': reason==='room_full'?'Room is full': reason==='game_already_started'?'Game already started':'Join failed'));
    socket.on('player_joined', ({ user, color }) => push('info', `${user?.displayName || 'Player'} joined as ${color==='w'?'White':'Black'}`));
    socket.on('room_update', ({ players, hostId, ready, opts }) => { setPlayers(players); setHostId(hostId || null); setReadyMap(ready || {} as any); setAllowSpecs(!!(opts?.allowSpectators ?? true)); });
    socket.on('error_msg', ({ reason }) => push('error', reason==='need_two_players'?'Need two players': reason==='players_not_ready'?'Both players must be ready':'Action not allowed'));
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
  function setReady(state: boolean){ const s=sockRef.current; if(!s) return; const color = players.find(p=>!['spec'].includes(p.color) && (p.user?.displayName===userName))?.color || ('?' as any); if(color==='?' ) return; s.emit('set_ready', { roomId, color, ready: state }); }
  function updateOpts(field: string, value: any){ const s=sockRef.current; if(!s) return; s.emit('set_room_opts', { roomId, opts: { [field]: value } }); }
  function genCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random()*alphabet.length)];
    setRoomId(code.slice(0,4)+'-'+code.slice(4));
  }
  async function copyCode() { try { await navigator.clipboard.writeText(roomId); push('success','Copied code'); } catch {} }
  async function copyInviteLink() {
    const url = `${window.location.origin}${window.location.pathname}#/online/lobby?code=${encodeURIComponent(roomId)}&name=${encodeURIComponent(userName)}`;
    try { await navigator.clipboard.writeText(url); push('success','Copied invite link'); } catch {}
  }
  function push(type:'info'|'success'|'error', text:string){ setMessages(m=>[...m, {type, text}]); showToast(type, text); }

  const white = players.find(p=>p.color==='w')?.user?.displayName || 'White';
  const black = players.find(p=>p.color==='b')?.user?.displayName || 'Black';
  const spectators = players.filter(p=>p.color==='spec').map(p=>p.user?.displayName || 'Spectator');
  const ready = players.some(p=>p.color==='w') && players.some(p=>p.color==='b');

  return (
    <div className="medieval-bg medieval-panel" style={{width:'clamp(900px, 85vw, 1280px)', margin:'0 auto', padding:'clamp(16px,2.2vw,28px)', minHeight:'calc(100vh - 24px)'}}>
      <h2 className="text-2xl font-extrabold mb-2 medieval-title">Online Lobby</h2>
      <div className="flex flex-wrap items-center gap-2">
        <input className="medieval-input" placeholder="Your name" value={userName} onChange={e=>setUserName(e.target.value)} />
        <input className="medieval-input" placeholder="Invite code" value={roomId} onChange={e=>setRoomId(e.target.value)} />
        <button className="btn-medieval" onClick={genCode}>Generate</button>
        <button className="btn-medieval" onClick={copyCode}>Copy Code</button>
        <button className="btn-medieval" onClick={copyInviteLink}>Copy Invite Link</button>
        <button className="btn-medieval" onClick={host}>Host</button>
        <button className="btn-medieval" onClick={join}>Join</button>
        {onBack && <button className="btn-medieval" onClick={onBack}>Back</button>}
      </div>
      <div className="mt-3 grid gap-3">
        <div className="flex justify-between items-center">
          <div><b>Lobby Code:</b> {roomId || '—'}</div>
          <div><b>Host:</b> {hostId? (players.find((p:any)=>p.socketId===hostId)?.user?.displayName || white) : '—'}</div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">♔</span>
            <div className="flex-1 bg-stone-900 border border-stone-700 rounded-md px-3 py-2">{white}</div>
            <div className="min-w-[90px] text-center {readyMap['w'] ? 'text-lime-300' : ''}">{readyMap['w']?'Ready':'In Lobby'}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">♚</span>
            <div className="flex-1 bg-stone-900 border border-stone-700 rounded-md px-3 py-2">{black}</div>
            <div className="min-w-[90px] text-center {readyMap['b'] ? 'text-lime-300' : ''}">{readyMap['b']?'Ready':'In Lobby'}</div>
          </div>
        </div>
        {allowSpecs && (
          <div className="bg-stone-900 border border-stone-700 rounded-md px-3 py-2">
            <div className="opacity-80 mb-1">Spectators ({spectators.length})</div>
            <div className="flex flex-wrap gap-2 text-sm">{spectators.length? spectators.map((n,i)=>(<span key={i} className="px-2 py-1 bg-stone-800 rounded">{n}</span>)) : <span className="opacity-60">None</span>}</div>
          </div>
        )}
      </div>
      <div style={{marginTop:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{padding:'6px 8px', margin:'4px 0', borderRadius:6, background:m.type==='error'?'#7f1d1d': m.type==='success'?'#14532d':'#1f2937', color:'#fff'}}>{m.text}</div>
        ))}
      </div>
      <div className="mt-3">
        <button className="px-3 py-2 font-bold rounded-lg bg-lime-400 text-stone-900 border-4 border-stone-700" onClick={()=>setReady(true)}>Ready</button>
        <button className="px-3 py-2 font-bold rounded-lg bg-orange-400 text-stone-900 border-4 border-stone-700 ml-2" onClick={()=>setReady(false)}>Unready</button>
        <button className="px-3 py-2 font-bold rounded-lg bg-emerald-500 text-white border-4 border-stone-700 ml-2 disabled:opacity-50" onClick={startGame} disabled={!connected || !ready || !hostMode || !(readyMap['w']&&readyMap['b'])}>Start Game</button>
        {!hostMode && connected && <span className="ml-2 opacity-80">Waiting for host to start…</span>}
      </div>
      {hostMode && (
        <div className="mt-3 flex items-center gap-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={allowSpecs} onChange={e=>{ setAllowSpecs(e.target.checked); updateOpts('allowSpectators', e.target.checked); }} /> Allow spectators</label>
        </div>
      )}
    </div>
  );
}
