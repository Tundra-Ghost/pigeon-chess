import './App.css';
import LocalAIMatch from './offline/LocalAIMatch';
import SetupScreen from './components/SetupScreen';
import SettingsModal, { getSettings } from './components/SettingsModal';
import OnlineMatch from './multiplayer/OnlineMatch';
import OnlineLobby from './multiplayer/OnlineLobby';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { playMenuBgm, playGameBgm, setSoundOptions, unlockBgm } from './sound';
import { SettingsProvider } from './contexts/SettingsContext';
import { UiProvider } from './contexts/UiContext';
import MenuScreen from './components/MenuScreen';
import ColorPickerModal from './components/ColorPickerModal';
import MatchHistory from './history/MatchHistory';
import MatchDetail from './history/MatchDetail';
import Toaster from './ui/Toaster';
 

function App() {
  const [players, setPlayers] = useState<{ w: string; b: string }>({ w: 'White', b: 'Black' });
  const [, setSelectedModifiers] = useState<string[]>([]);
  const [offlineHumanSide, setOfflineHumanSide] = useState<'w'|'b'>('w');
  const [openColorPick, setOpenColorPick] = useState(false);
  const [settings, setSettings] = useState(getSettings());
  // Local modals now controlled by UiContext; keep fallbacks for legacy calls
  const [openSettings, setOpenSettings] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);

  // Global event to open auth from SetupScreen
  // Legacy document event removed; UiContext should be used going forward

  const location = useLocation();
  // Choose BGM based on route
  useEffect(() => {
    const p = location.pathname || '/';
    if (p.startsWith('/play') || p.startsWith('/online/match')) playGameBgm();
    else playMenuBgm();
  }, [location.pathname]);
  // Unlock BGM on first user interaction to satisfy autoplay restrictions
  useEffect(() => {
    const unlock = () => {
      const p = location.pathname || '/';
      const scene = (p.startsWith('/play') || p.startsWith('/online/match')) ? 'game' : 'menu';
      unlockBgm(scene as any);
    };
    window.addEventListener('pointerdown', unlock, { once: true } as any);
    window.addEventListener('keydown', unlock, { once: true } as any);
    return () => {
      window.removeEventListener('pointerdown', unlock as any);
      window.removeEventListener('keydown', unlock as any);
    };
  }, [location.pathname]);

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
    <SettingsProvider>
    <UiProvider>
    <div>
      <Routes>
        <Route path="/" element={
          <>
            <MenuScreen
              onPlayOffline={() => { setOpenColorPick(true); navigate('/setup'); }}
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
            <SetupScreen vsAI={true} humanSide={offlineHumanSide} onStart={({ whiteName, blackName, selectedModifiersWhite, selectedModifiersBlack }) => {
              setPlayers({ w: whiteName || 'White', b: blackName || 'Black' });
              // For local play, merge both sets into one for now
              setSelectedModifiers(Array.from(new Set([...(selectedModifiersWhite||[]), ...(selectedModifiersBlack||[])])));
              navigate('/play/local');
            }} onOpenSettings={() => setOpenSettings(true)} />
            <ColorPickerModal
              open={openColorPick}
              onClose={() => setOpenColorPick(false)}
              onConfirm={(side)=>{ setOfflineHumanSide(side); setOpenColorPick(false); }}
            />
            <AuthModal open={openAuth} onClose={()=>setOpenAuth(false)} onGoProfile={()=>{ setOpenAuth(false); navigate('/profile'); }} />
            <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} onChange={setSettings} />
          </>
        } />

        <Route path="/play/local" element={
          <>
            <h1>Pigeon Chess</h1>
            <p className="read-the-docs">Local match vs simple AI. Castling/en passant supported; pawns auto‑promote to queens.</p>
            <LocalAIMatch onExit={() => navigate('/')} players={players} humanSide={offlineHumanSide} />
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
      </UiProvider>
      </SettingsProvider>
  );
}

function OnlineMatchRoute(){
  const { code } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const name = query.get('name') || 'Guest';
  return <OnlineMatch roomId={code || ''} userName={name} onExit={() => window.history.back()} />
}

export default App;
