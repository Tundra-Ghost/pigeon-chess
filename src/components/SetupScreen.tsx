import { useState } from 'react';
// Auth opens as a modal from parent
import './SetupScreen.css';
import '../styles/medieval.css';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../contexts/UiContext';
import ModifierBrowser from './modifiers/ModifierBrowser';
import './modifiers/modifiers.css';

export interface SetupData {
  whiteName: string;
  blackName: string;
  selectedModifiersWhite: string[];
  selectedModifiersBlack: string[];
  bannedModifiers: string[];
}

export default function SetupScreen({ onStart, onOpenSettings }: { onStart: (data: SetupData) => void; onOpenSettings?: () => void }) {
  const navigate = useNavigate();
  const ui = useUi();
  const [whiteName, setWhiteName] = useState('White');
  const [blackName, setBlackName] = useState('Black');
  const [phase, setPhase] = useState<'ban'|'select'>('ban');
  const [activeSide, setActiveSide] = useState<'w'|'b'>('w');
  const [selectedW, setSelectedW] = useState<string[]>([]);
  const [selectedB, setSelectedB] = useState<string[]>([]);
  const [banned, setBanned] = useState<string[]>([]);
  const [bannedBy, setBannedBy] = useState<{ w?: string; b?: string }>({});


  function start() {
    onStart({ whiteName, blackName, selectedModifiersWhite: selectedW, selectedModifiersBlack: selectedB, bannedModifiers: banned });
  }

  return (
    <div className="setup-wrap">
      <div className="setup-card medieval-card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
          <h2 className="text-2xl font-bold medieval-title">Pigeon Chess — Setup</h2>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-medieval" onClick={ui.openAuth}>Account</button>
            {onOpenSettings ? (
              <button className="btn-medieval" onClick={onOpenSettings}>Settings</button>
            ) : (
              <button className="btn-medieval" onClick={ui.openSettings}>Settings</button>
            )}
            <button className="btn-medieval" onClick={() => navigate('/')}>Back</button>
          </div>
        </div>
        <div className="row">
          <label>
            <span className="font-semibold">White Name</span>
            <input className="mt-1 px-3 py-2 rounded-md border border-stone-600 bg-stone-900 text-white" value={whiteName} onChange={(e) => setWhiteName(e.target.value)} placeholder="White player" />
          </label>
          <label>
            <span className="font-semibold">Black Name</span>
            <input className="mt-1 px-3 py-2 rounded-md border border-stone-600 bg-stone-900 text-white" value={blackName} onChange={(e) => setBlackName(e.target.value)} placeholder="Black player" />
          </label>
        </div>

        <h3 className="mt-4 text-lg font-semibold medieval-title">Modifiers</h3>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <div><strong>Phase:</strong> {phase==='ban'?'Ban (each player one ban)':'Select'} · <strong>Active:</strong> {activeSide==='w'?'White':'Black'}</div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-medieval" onClick={()=>setActiveSide(s=> s==='w'?'b':'w')}>Switch Side</button>
            {phase==='ban' && (bannedBy.w && bannedBy.b) && (
              <button className="btn-medieval" onClick={()=> setPhase('select')}>Next Phase</button>
            )}
          </div>
        </div>
        <div style={{marginBottom:8}}>
          <strong>Banned:</strong> {banned.length? banned.join(', '): 'None'}
        </div>
        <ModifierBrowser
          selectedIds={activeSide==='w'? selectedW : selectedB}
          onChange={(ids)=> activeSide==='w'? setSelectedW(ids) : setSelectedB(ids)}
          bannedIds={banned}
          phase={phase}
          canBan={phase==='ban' && ((activeSide==='w' && !bannedBy.w) || (activeSide==='b' && !bannedBy.b))}
          onBan={(id)=>{
            if (phase!=='ban') return;
            if (banned.includes(id)) return;
            setBanned(prev=> [...prev, id]);
            setBannedBy(prev=> ({ ...prev, [activeSide]: id }));
            setActiveSide(s=> s==='w'?'b':'w');
          }}
        />

        <div style={{display:'grid', gap:8}}>
          <button className="start btn-medieval" onClick={start}>
            Play
          </button>
          <small style={{opacity:.8}}>Tip: Ban phase (one each), then selection phase. Use Switch Side to pick for both players offline. Save quick picks will arrive soon.</small>
        </div>
        
      </div>
    </div>
  );
}
