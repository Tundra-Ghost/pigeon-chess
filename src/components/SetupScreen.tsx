import { useState } from 'react';
import { MODIFIERS } from '../modifiers/data';
import './SetupScreen.css';

export interface SetupData {
  whiteName: string;
  blackName: string;
  selectedModifiers: string[];
}

export default function SetupScreen({ onStart }: { onStart: (data: SetupData) => void }) {
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
      <div className="setup-card">
        <h2 className="text-2xl font-bold">Pigeon Chess — Setup</h2>
        <div className="row">
          <label>
            <span className="font-semibold">White Name</span>
            <input className="mt-1" value={whiteName} onChange={(e) => setWhiteName(e.target.value)} placeholder="White player" />
          </label>
          <label>
            <span className="font-semibold">Black Name</span>
            <input className="mt-1" value={blackName} onChange={(e) => setBlackName(e.target.value)} placeholder="Black player" />
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

        <button className="start" onClick={start}>Start Game</button>
      </div>
    </div>
  );
}
