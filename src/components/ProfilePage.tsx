import { useEffect, useState } from 'react';
import { me, logout, type User } from '../api';

export default function ProfilePage({ onBack }: { onBack: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(()=>{ me().then(setUser); }, []);
  async function doLogout() { await logout(); setUser(null); }
  return (
    <div>
      <h2>Profile</h2>
      {user ? (
        <div style={{display:'grid', gap:8}}>
          <div><b>Name:</b> {user.displayName}</div>
          <div><b>Email:</b> {user.email}</div>
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

