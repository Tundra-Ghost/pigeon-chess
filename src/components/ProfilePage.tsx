import { useEffect, useState } from 'react';
import { me, logout, type User } from '../api';
import '../styles/medieval.css';

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
    <div className="medieval-bg medieval-panel" style={{width:'clamp(900px, 85vw, 1280px)', margin:'0 auto', padding:'clamp(16px,2.2vw,28px)', minHeight:'calc(100vh - 24px)'}}>
      <h2 className="text-2xl font-extrabold medieval-title">Profile</h2>
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
            <button className="btn-medieval" onClick={onBack}>Back</button>
            <button className="btn-medieval" onClick={doLogout}>Logout</button>
          </div>
        </div>
      ) : (
        <div>
          <div>Not signed in.</div>
          <button className="btn-medieval" onClick={onBack}>Back</button>
        </div>
      )}
    </div>
  );
}
