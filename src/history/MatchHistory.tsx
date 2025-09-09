import { useEffect, useState } from 'react';

type Match = { code: string; status: string; result?: string; created_at: string };

export default function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = localStorage.getItem('serverUrl') || 'http://localhost:8787';
    fetch(`${base}/api/matches?mine=1`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setMatches(d.matches || []); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, []);

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{color:'salmon'}}>{error}</div>;

  return (
    <div style={{maxWidth:900, margin:'0 auto', padding:'16px'}}>
      <h2>Match History</h2>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', padding:'6px'}}>Code</th>
            <th style={{textAlign:'left', padding:'6px'}}>Status</th>
            <th style={{textAlign:'left', padding:'6px'}}>Result</th>
            <th style={{textAlign:'left', padding:'6px'}}>Time</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => (
            <tr key={m.code}>
              <td style={{padding:'6px'}}><a href={`#/history/${encodeURIComponent(m.code)}`}>{m.code}</a></td>
              <td style={{padding:'6px'}}>{m.status}</td>
              <td style={{padding:'6px'}}>{m.result || '—'}</td>
              <td style={{padding:'6px'}}>{new Date(m.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

