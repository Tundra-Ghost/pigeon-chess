import { useEffect, useState } from 'react';
import '../styles/medieval.css';
import { useParams } from 'react-router-dom';

type MoveRow = { ply: number; color: 'w'|'b'; san: string; created_at: string };

export default function MatchDetail() {
  const { code } = useParams();
  const [moves, setMoves] = useState<MoveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = localStorage.getItem('serverUrl') || 'http://localhost:8787';
    fetch(`${base}/api/matches/${code}/moves`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setMoves(d.moves || []); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [code]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{color:'salmon'}}>{error}</div>;

  return (
    <div className="medieval-bg medieval-panel" style={{width:'clamp(900px, 90vw, 1280px)', margin:'0 auto', padding:'clamp(16px,2.2vw,28px)', minHeight:'calc(100vh - 24px)'}}>
      <h2 className="text-2xl font-extrabold medieval-title">Match {code}</h2>
      <ol>
        {moves.map((m,i)=> (
          <li key={i}>{m.color==='w'?'White':'Black'}: {m.san} <span style={{opacity:0.7}}>{new Date(m.created_at).toLocaleTimeString()}</span></li>
        ))}
      </ol>
      <a className="btn-medieval" href="#/history">Back to History</a>
    </div>
  );
}
