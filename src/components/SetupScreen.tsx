import { useState } from 'react';
import { MODIFIERS } from '../modifiers/data';
// Auth opens as a modal from parent
import './SetupScreen.css';
import '../styles/medieval.css';
import { useNavigate } from 'react-router-dom';

export interface SetupData {
  whiteName: string;
  blackName: string;
  selectedModifiers: string[];
}

export default function SetupScreen({ onStart, onOpenSettings }: { onStart: (data: SetupData) => void; onOpenSettings?: () => void }) {
  const navigate = useNavigate();
  const [whiteName, setWhiteName] = useState('White');
  const [blackName, setBlackName] = useState('Black');
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function start() {
    onStart({ whiteName, blackName, selectedModifiers: selected });
  }

  return (
    <div className="setup-wrap">
      <div className="setup-card medieval-card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
          <h2 className="text-2xl font-bold medieval-title">Pigeon Chess — Setup</h2>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-medieval" onClick={() => document.dispatchEvent(new CustomEvent('open-auth'))}>Account</button>
            {onOpenSettings && <button className="btn-medieval" onClick={onOpenSettings}>Settings</button>}
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

        <h3 className="mt-4 text-lg font-semibold">Modifiers (scaffold)</h3>
        <div className="mods">
          {MODIFIERS.map((m) => (
            <label key={m.id} className={`mod ${selected.includes(m.id) ? 'on' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggle(m.id)}
              />
              <span className="mod-title">{m.name}</span>
              <span className="mod-desc">{m.description}</span>
            </label>
          ))}
        </div>

        <div style={{display:'grid', gap:8}}>
          <button className="start btn-medieval" onClick={start}>
            Play
          </button>
          <small style={{opacity:.8}}>Tip: Click a piece to see legal moves (dots). Click again to deselect. You can adjust sounds and hints in Settings.</small>
        </div>
        
      </div>
    </div>
  );
}
