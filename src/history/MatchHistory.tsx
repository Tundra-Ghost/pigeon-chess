import { useEffect, useState } from 'react';
import '../styles/medieval.css';

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

  async function copyLink(code: string) {
    const url = `${window.location.origin}${window.location.pathname}#/history/${encodeURIComponent(code)}`;
    try { await navigator.clipboard.writeText(url); } catch {}
  }

  return (
    <div className="medieval-bg medieval-panel" style={{width:'clamp(900px, 90vw, 1280px)', margin:'0 auto', padding:'clamp(16px,2.2vw,28px)', minHeight:'calc(100vh - 24px)'}}>
      <h2 className="text-2xl font-extrabold medieval-title">Match History</h2>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', padding:'6px'}}>Code</th>
            <th style={{textAlign:'left', padding:'6px'}}>Status</th>
            <th style={{textAlign:'left', padding:'6px'}}>Result</th>
            <th style={{textAlign:'left', padding:'6px'}}>Time</th>
            <th style={{textAlign:'left', padding:'6px'}}>Link</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => (
            <tr key={m.code}>
              <td style={{padding:'6px'}}><a href={`#/history/${encodeURIComponent(m.code)}`}>{m.code}</a></td>
              <td style={{padding:'6px'}}>{m.status}</td>
              <td style={{padding:'6px'}}>{m.result || '—'}</td>
              <td style={{padding:'6px'}}>{new Date(m.created_at).toLocaleString()}</td>
              <td style={{padding:'6px'}}><button onClick={()=>copyLink(m.code)}>Copy</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
