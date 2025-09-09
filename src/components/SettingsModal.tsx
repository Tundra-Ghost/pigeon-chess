import { useEffect, useState } from 'react';

type Settings = {
  showHints: boolean;
  theme: 'auto'|'light'|'dark';
  sfxEnabled: boolean;
  sfxVolume: number; // 0..1
  bgmEnabled: boolean;
  bgmVolume: number; // 0..1
};
const LS_KEY = 'settings';

function load(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || '') as Partial<Settings>;
    return {
      showHints: s.showHints ?? true,
      theme: s.theme ?? 'auto',
      sfxEnabled: s.sfxEnabled ?? true,
      sfxVolume: s.sfxVolume ?? 0.7,
      bgmEnabled: s.bgmEnabled ?? true,
      bgmVolume: s.bgmVolume ?? 0.5,
    };
  } catch {
    return { showHints: true, theme: 'auto', sfxEnabled: true, sfxVolume: 0.7, bgmEnabled: true, bgmVolume: 0.5 };
  }
}
function save(s: Settings) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

export default function SettingsModal({ open, onClose, onChange }: { open: boolean; onClose: () => void; onChange?: (s: Settings)=>void }) {
  const [settings, setSettings] = useState<Settings>(load());
  useEffect(()=>{ onChange?.(settings); save(settings); }, [settings]);
  if (!open) return null;
  return (
    <div style={{position:'fixed', inset:0, background:'#0008', display:'grid', placeItems:'center', zIndex:50}}>
      <div style={{background:'#111', color:'#fff', padding:16, borderRadius:8, width:360}}>
        <h3 style={{marginTop:0}}>Settings</h3>
        <label style={{display:'flex', alignItems:'center', gap:8}}>
          <input type="checkbox" checked={settings.showHints} onChange={e=>setSettings(s=>({...s, showHints: e.target.checked}))} /> Show legal move hints
        </label>
        <div style={{marginTop:8}}>
          <div style={{fontWeight:600, marginBottom:4}}>Sound Effects</div>
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={settings.sfxEnabled} onChange={e=>setSettings(s=>({...s, sfxEnabled: e.target.checked}))} /> Enable SFX
          </label>
          <input type="range" min={0} max={1} step={0.01} value={settings.sfxVolume} onChange={e=>setSettings(s=>({...s, sfxVolume: parseFloat(e.target.value)}))} style={{width:'100%'}} />
        </div>
        <div style={{marginTop:8}}>
          <div style={{fontWeight:600, marginBottom:4}}>Music</div>
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={settings.bgmEnabled} onChange={e=>setSettings(s=>({...s, bgmEnabled: e.target.checked}))} /> Enable BGM
          </label>
          <input type="range" min={0} max={1} step={0.01} value={settings.bgmVolume} onChange={e=>setSettings(s=>({...s, bgmVolume: parseFloat(e.target.value)}))} style={{width:'100%'}} />
        </div>
        <div style={{marginTop:8}}>
          <div>Theme</div>
          <select value={settings.theme} onChange={e=>setSettings(s=>({...s, theme: e.target.value as Settings['theme']}))}>
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function getSettings(): Settings { return load(); }
