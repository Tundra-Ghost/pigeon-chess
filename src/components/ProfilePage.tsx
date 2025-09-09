import { useEffect, useState } from 'react';
import { me, logout, type User } from '../api';

export default function ProfilePage({ onBack }: { onBack: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Array<{ code: string; result?: string; created_at: string }>>([]);
  useEffect(()=>{ me().then(setUser); }, []);
  useEffect(()=>{
    fetch((localStorage.getItem('serverUrl')||'http://localhost:8787')+'/api/matches?mine=1', { credentials: 'include' })
      .then(r=>r.json()).then(d=>setMatches(d.matches||[])).catch(()=>{});
  }, []);
  async function doLogout() { await logout(); setUser(null); }
  return (
    <div>
      <h2>Profile</h2>
      {user ? (
        <div style={{display:'grid', gap:8}}>
          <div><b>Name:</b> {user.displayName}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Ranking:</b> Coming soon</div>
          <div>
            <div style={{fontWeight:700, marginTop:8}}>Recent Matches</div>
            <ul>
              {matches.map((m,i)=>(<li key={i}>{m.code} — {m.result || 'in-progress'} <span style={{opacity:0.7}}>{new Date(m.created_at).toLocaleString()}</span></li>))}
            </ul>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={onBack}>Back</button>
            <button onClick={doLogout}>Logout</button>
          </div>
        </div>
      ) : (
        <div>
          <div>Not signed in.</div>
          <button onClick={onBack}>Back</button>
        </div>
      )}
    </div>
  );
}
