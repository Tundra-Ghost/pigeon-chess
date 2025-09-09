import { useEffect, useState } from 'react';
import { getServerUrl, setServerUrl, login, register, logout, me, type User, ApiError } from '../api';

export default function AuthPanel({ onAuthed, onGoProfile }: { onAuthed?: (user: User | null) => void; onGoProfile?: () => void }) {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [serverUrl, setServer] = useState(getServerUrl());
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    me().then(u => { setUser(u); onAuthed?.(u); });
  }, []);

  function saveServer() {
    setServerUrl(serverUrl);
  }

  async function doLogin() {
    setError(null);
    try {
      const u = await login(email, password);
      setUser(u); onAuthed?.(u);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'invalid_credentials') setError('Invalid email or password');
        else setError(`Login failed (${e.code})`);
      } else setError('Login failed');
    }
  }
  async function doRegister() {
    setError(null);
    try {
      if (password !== confirm) { setError('Passwords do not match'); return; }
      const u = await register(email, password, displayName || email.split('@')[0]);
      setUser(u); onAuthed?.(u);
    } catch (e) {
      if (e instanceof ApiError) {
        const map: Record<string,string> = {
          invalid_email: 'Please enter a valid email address',
          weak_password: 'Password must be at least 8 characters',
          email_taken: 'This email is already registered',
          missing_fields: 'Please fill out all fields',
          server_error: 'Server error. Please try again later',
        };
        setError(map[e.code] || `Registration failed (${e.code})`);
      } else setError('Register failed');
    }
  }
  async function doLogout() {
    await logout();
    setUser(null); onAuthed?.(null);
  }

  return (
    <div style={{textAlign:'left', marginTop: 12}}>
      <h3>Account</h3>
      <div style={{fontSize:12, opacity:0.8}}>Server: <input value={serverUrl} onChange={e=>setServer(e.target.value)} onBlur={saveServer} style={{width:'60%'}} /> <button onClick={saveServer}>Save</button></div>
      {user ? (
        <div style={{marginTop:8}}>
          <div>Signed in as <b>{user.displayName}</b> ({user.email})</div>
          <div style={{display:'flex', gap:8, marginTop:6}}>
            <button onClick={doLogout}>Logout</button>
            {onGoProfile && <button onClick={onGoProfile}>Profile</button>}
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gap:6, marginTop:8}}>
          <div>
            <label>Email<br/>
              <input value={email} onChange={e=>setEmail(e.target.value)} />
            </label>
          </div>
          <div>
            <label>Password<br/>
              <div style={{display:'flex', gap:6}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} />
                <button type="button" onClick={()=>setShowPw(s=>!s)}>{showPw?'Hide':'Show'}</button>
              </div>
            </label>
          </div>
          {mode==='register' && (
            <div>
              <label>Display name<br/>
                <input value={displayName} onChange={e=>setDisplayName(e.target.value)} />
              </label>
            </div>
          )}
          {mode==='register' && (
            <div>
              <label>Confirm password<br/>
                <div style={{display:'flex', gap:6}}>
                  <input type={showPw2?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} />
                  <button type="button" onClick={()=>setShowPw2(s=>!s)}>{showPw2?'Hide':'Show'}</button>
                </div>
              </label>
            </div>
          )}
          {error && <div style={{color:'salmon'}}>{error}</div>}
          <div style={{display:'flex', gap:8}}>
            {mode==='login' ? (
              <>
                <button onClick={doLogin}>Login</button>
                <button onClick={()=>setMode('register')}>Switch to Register</button>
              </>
            ) : (
              <>
                <button onClick={doRegister}>Register</button>
                <button onClick={()=>setMode('login')}>Switch to Login</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
