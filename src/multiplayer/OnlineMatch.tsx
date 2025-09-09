import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import ChessBoard from '../components/ChessBoard';
import type { Move } from '../chess/types';
import { getServerUrl } from '../api';
import ResultModal from '../components/ResultModal';

export default function OnlineMatch({ roomId, userName, onExit }: { roomId: string; userName: string; onExit?: () => void }) {
  const [myColor, setMyColor] = useState<'w'|'b'|'spec'|'?'>('?');
  const [players, setPlayers] = useState<{ w: string; b: string }>({ w: 'White', b: 'Black' });
  const [externalMove, setExternalMove] = useState<Move | null>(null);
  const [sanHistory, setSanHistory] = useState<Array<{ san: string; color: 'w'|'b'; by?: string }>>([]);
  const sockRef = useRef<Socket | null>(null);
  const [over, setOver] = useState<{winner: 'w'|'b'|null, drawReason: string|null}|null>(null);

  useEffect(() => {
    const socket = io(getServerUrl(), { withCredentials: true, reconnection: false, reconnectionAttempts: 1, timeout: 6000, transports: ['websocket'] });
    sockRef.current = socket;
    socket.on('connect', () => socket.emit('join_room', { roomId, user: { displayName: userName } }));
    socket.on('you', ({ color }) => setMyColor(color));
    socket.on('room_update', ({ players: plist }) => {
      const w = plist.find((p:any)=>p.color==='w')?.user?.displayName || 'White';
      const b = plist.find((p:any)=>p.color==='b')?.user?.displayName || 'Black';
      setPlayers({ w, b });
    });
    socket.on('move', (m: any) => { setExternalMove(m as Move); if ((m as any).san) setSanHistory(h=>[...h, { san: (m as any).san, color: (m as any).color, by: (m as any).byName }]); });
    socket.on('game_over', ({ winner, drawReason }) => {
      setOver({ winner: winner ?? null, drawReason: drawReason ?? null });
    });
    return () => { socket.disconnect(); };
  }, [roomId, userName]);

  function onLocalMove(m: Move) {
    const s = sockRef.current; if (!s) return;
    s.emit('move', { roomId, move: m });
  }

  return (
    <div>
      <h2>Online Match</h2>
      <div style={{marginTop:8}}>You are: <b>{userName}</b> ({myColor})</div>
      <div style={{marginTop:16, display:'grid', gridTemplateColumns:'1fr auto', gap:16}}>
        <div style={{display:'grid', placeItems:'center'}}>
          <ChessBoard players={players} selectedModifiers={[]} onExit={onExit} onMove={onLocalMove} externalMove={externalMove} disabled={myColor==='?' || myColor==='spec'} lockColor={myColor==='w'||myColor==='b'? myColor : undefined as any} />
        </div>
        <div style={{textAlign:'left'}}>
          <h3>Moves</h3>
          <ol>
            {sanHistory.map((m,i)=>(
              <li key={i}>{m.color==='w'?players.w:players.b}: {m.san}</li>
            ))}
          </ol>
        </div>
      </div>
      <ResultModal open={!!over} winner={over?.winner ?? null} drawReason={over?.drawReason ?? null} onClose={()=>setOver(null)} />
    </div>
  );
}
