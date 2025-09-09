import './App.css';
import ChessBoard from './components/ChessBoard';
import SetupScreen from './components/SetupScreen';
import SettingsModal, { getSettings } from './components/SettingsModal';
import OnlineMatch from './multiplayer/OnlineMatch';
import OnlineLobby from './multiplayer/OnlineLobby';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { playMenuBgm, playGameBgm, setSoundOptions } from './sound';
import MenuScreen from './components/MenuScreen';
import MatchHistory from './history/MatchHistory';
import MatchDetail from './history/MatchDetail';
import Toaster from './ui/Toaster';

function App() {
  const [view] = useState<'menu'|'setup'|'local'|'onlineLobby'|'onlineMatch'|'profile'>('menu');
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

  useEffect(() => {
    if (view === 'local' || view === 'onlineMatch') playGameBgm();
    else playMenuBgm();
  }, [view]);

  useEffect(() => {
    setSoundOptions({
      sfxEnabled: settings.sfxEnabled,
      sfxVolume: settings.sfxVolume,
      bgmEnabled: settings.bgmEnabled,
      bgmVolume: settings.bgmVolume,
    });
  }, [settings.sfxEnabled, settings.sfxVolume, settings.bgmEnabled, settings.bgmVolume]);

  const navigate = useNavigate();

  return (
    <div>
      <Routes>
        <Route path="/" element={
          <>
            <MenuScreen
              onPlayOffline={() => navigate('/setup')}
              onPlayOnline={() => navigate('/online/lobby')}
              onSettings={() => setOpenSettings(true)}
              onExit={() => alert('Use the browser tab to close the game.')}
              onAccount={() => setOpenAuth(true)}
            />
            <AuthModal open={openAuth} onClose={()=>setOpenAuth(false)} onGoProfile={()=>{ setOpenAuth(false); navigate('/profile'); }} />
            <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} onChange={setSettings} />
          </>
        } />

        <Route path="/setup" element={
          <>
            <SetupScreen onStart={({ whiteName, blackName, selectedModifiers }) => {
              setPlayers({ w: whiteName || 'White', b: blackName || 'Black' });
              setSelectedModifiers(selectedModifiers);
              navigate('/play/local');
            }} onOpenSettings={() => setOpenSettings(true)} />
            <AuthModal open={openAuth} onClose={()=>setOpenAuth(false)} onGoProfile={()=>{ setOpenAuth(false); navigate('/profile'); }} />
            <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} onChange={setSettings} />
          </>
        } />

        <Route path="/play/local" element={
          <>
            <h1>Pigeon Chess</h1>
            <p className="read-the-docs">Chess with basic rules + castling and en passant; pawns auto-promote to queens. Modifiers are scaffolded.</p>
            <ChessBoard players={players} selectedModifiers={selectedModifiers} onExit={() => navigate('/')} showHints={settings.showHints} onOpenSettings={() => setOpenSettings(true)} />
            <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} onChange={setSettings} />
          </>
        } />

        <Route path="/online/lobby" element={<OnlineLobby onBack={() => navigate('/')} onStartMatch={(code,name)=> navigate(`/online/match/${encodeURIComponent(code)}?name=${encodeURIComponent(name)}`)} />} />
        <Route path="/online/match/:code" element={<OnlineMatchRoute />} />

        <Route path="/profile" element={<ProfilePage onBack={() => navigate('/')} />} />
        <Route path="/history" element={<MatchHistory />} />
        <Route path="/history/:code" element={<MatchDetail />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function OnlineMatchRoute(){
  const { code } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const name = query.get('name') || 'Guest';
  return <OnlineMatch roomId={code || ''} userName={name} onExit={() => window.history.back()} />
}

export default App;
