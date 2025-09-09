import './App.css';
import ChessBoard from './components/ChessBoard';
import SetupScreen from './components/SetupScreen';
import SettingsModal, { getSettings } from './components/SettingsModal';
import OnlineGame from './multiplayer/OnlineGame';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import React, { useState } from 'react';

function App() {
  const [view, setView] = useState<'setup'|'local'|'online'|'profile'>('setup');
  const [players, setPlayers] = useState<{ w: string; b: string }>({ w: 'White', b: 'Black' });
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [settings, setSettings] = useState(getSettings());
  const [openSettings, setOpenSettings] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);

  // Global event to open auth from SetupScreen
  React.useEffect(() => {
    const handler = () => setOpenAuth(true);
    document.addEventListener('open-auth', handler as any);
    return () => document.removeEventListener('open-auth', handler as any);
  }, []);

  if (view === 'setup') {
    return (
      <>
        <SetupScreen
        onStart={({ whiteName, blackName, selectedModifiers }) => {
          setPlayers({ w: whiteName || 'White', b: blackName || 'Black' });
          setSelectedModifiers(selectedModifiers);
          setView('local');
        }}
        onStartOnline={({ whiteName, blackName, selectedModifiers }) => {
          setPlayers({ w: whiteName || 'White', b: blackName || 'Black' });
          setSelectedModifiers(selectedModifiers);
          setView('online');
        }}
        onOpenSettings={() => setOpenSettings(true)}
        />
        <AuthModal open={openAuth} onClose={()=>setOpenAuth(false)} onGoProfile={()=>{ setOpenAuth(false); setView('profile'); }} />
        <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} onChange={setSettings} />
      </>
    );
  }

  return (
    <div>
      <h1>Pigeon Chess</h1>
      <p className="read-the-docs">Chess with basic rules + castling and en passant; pawns auto-promote to queens. Modifiers are scaffolded.</p>
      {view==='local' && (
        <ChessBoard players={players} selectedModifiers={selectedModifiers} onExit={() => setView('setup')} showHints={settings.showHints} />
      )}
      {view==='online' && (
        <OnlineGame onExit={() => setView('setup')} />
      )}
      {view==='profile' && (
        <ProfilePage onBack={() => setView('setup')} />
      )}
      <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} onChange={setSettings} />
      <AuthModal open={openAuth} onClose={()=>setOpenAuth(false)} onGoProfile={()=>{ setOpenAuth(false); setView('profile'); }} />
    </div>
  );
}

export default App;
