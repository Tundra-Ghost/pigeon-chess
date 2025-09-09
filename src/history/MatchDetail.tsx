import { useEffect, useState } from 'react';
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
    <div style={{maxWidth:900, margin:'0 auto', padding:'16px'}}>
      <h2>Match {code}</h2>
      <ol>
        {moves.map((m,i)=> (
          <li key={i}>{m.color==='w'?'White':'Black'}: {m.san} <span style={{opacity:0.7}}>{new Date(m.created_at).toLocaleTimeString()}</span></li>
        ))}
      </ol>
      <a href="#/history">Back to History</a>
    </div>
  );
}

