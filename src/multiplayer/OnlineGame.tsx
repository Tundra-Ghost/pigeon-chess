import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import ChessBoard from '../components/ChessBoard';
import type { Move } from '../chess/types';
import { getServerUrl, me } from '../api';

export default function OnlineGame({ onExit }: { onExit?: () => void }) {
  const [roomId, setRoomId] = useState('room-1');
  const [connected, setConnected] = useState(false);
  const [myColor, setMyColor] = useState<'w'|'b'|'spec'|'?'>('?');
  const [players, setPlayers] = useState<{ w: string; b: string }>({ w: 'White', b: 'Black' });
  const [externalMove, setExternalMove] = useState<Move | null>(null);
  const sockRef = useRef<Socket | null>(null);
  const [userName, setUserName] = useState('Guest');

  useEffect(() => { me().then(u => setUserName(u?.displayName || 'Guest')); }, []);

  function connect() {
    const url = getServerUrl();
    const socket = io(url, { withCredentials: true });
    sockRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => { setConnected(false); setMyColor('?'); });
    socket.on('you', ({ color }) => setMyColor(color));
    socket.on('room_update', ({ players: plist }) => {
      const w = plist.find((p:any)=>p.color==='w')?.user?.displayName || 'White';
      const b = plist.find((p:any)=>p.color==='b')?.user?.displayName || 'Black';
      setPlayers({ w, b });
    });
    socket.on('move', (m: Move) => setExternalMove(m));
  }

  function join() {
    const s = sockRef.current; if (!s) return;
    s.emit('join_room', { roomId, user: { displayName: userName } });
  }

  function genCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random()*alphabet.length)];
    code = code.slice(0,4) + '-' + code.slice(4);
    setRoomId(code);
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(roomId); } catch {}
  }

  function onLocalMove(m: Move) {
    const s = sockRef.current; if (!s) return;
    s.emit('move', { roomId, move: m });
  }

  return (
    <div>
      <h2>Online Game</h2>
      <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
        <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room code" />
        <button onClick={genCode}>Generate Code</button>
        <button onClick={copyCode}>Copy</button>
        {!connected ? <button onClick={connect}>Connect</button> : <button onClick={join}>Join</button>}
        {onExit && <button onClick={onExit}>Back</button>}
      </div>
      <div style={{marginTop:8}}>You are: <b>{userName}</b> ({myColor})</div>
      <div style={{marginTop:16, display:'grid', placeItems:'center'}}>
        <ChessBoard players={players} selectedModifiers={[]} onExit={onExit} onMove={onLocalMove} externalMove={externalMove} disabled={myColor==='?' || myColor==='spec'} />
      </div>
    </div>
  );
}
