import { useEffect, useMemo, useState } from 'react';
// Auth opens as a modal from parent
import './SetupScreen.css';
import '../styles/medieval.css';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../contexts/UiContext';
import ModifierBrowser from './modifiers/ModifierBrowser';
import './modifiers/modifiers.css';
import { MODIFIERS, MOD_RULES } from '../modifiers/data';
import { aiChooseBan, aiChooseModifiers } from '../ai/simple';

export interface SetupData {
  whiteName: string;
  blackName: string;
  selectedModifiersWhite: string[];
  selectedModifiersBlack: string[];
  bannedModifiers: string[];
}

export default function SetupScreen({ onStart, onOpenSettings, vsAI = true, humanSide = 'w' }: { onStart: (data: SetupData) => void; onOpenSettings?: () => void; vsAI?: boolean; humanSide?: 'w'|'b' }) {
  const navigate = useNavigate();
  const ui = useUi();
  const [whiteName, setWhiteName] = useState('White');
  const [blackName, setBlackName] = useState('Black');
  const [phase, setPhase] = useState<'ban'|'select'>('ban');
  const [activeSide, setActiveSide] = useState<'w'|'b'>(humanSide);
  const [selectedW, setSelectedW] = useState<string[]>([]);
  const [selectedB, setSelectedB] = useState<string[]>([]);
  const [banned, setBanned] = useState<string[]>([]);
  const [bannedBy, setBannedBy] = useState<{ w?: string; b?: string }>({});
  const allIds = useMemo(() => MODIFIERS.map(m => m.id), []);
  const aiSide: 'w'|'b' = humanSide === 'w' ? 'b' : 'w';

  // Auto-ban for AI during ban phase
  useEffect(() => {
    if (!vsAI) return;
    if (phase !== 'ban') return;
    if (activeSide !== aiSide) return;
    if ((aiSide === 'w' && bannedBy.w) || (aiSide === 'b' && bannedBy.b)) return;
    const available = allIds.filter(id => !banned.includes(id));
    const pick = aiChooseBan(available, banned);
    if (pick) {
      setBanned(prev => [...prev, pick]);
      setBannedBy(prev => ({ ...prev, [aiSide]: pick }));
    }
    setActiveSide(humanSide);
  }, [vsAI, phase, activeSide, aiSide, humanSide, bannedBy.w, bannedBy.b, banned, allIds]);

  // Auto-advance when both bans are done
  useEffect(() => {
    if (phase === 'ban' && bannedBy.w && bannedBy.b) {
      setPhase('select');
      setActiveSide(humanSide);
    }
  }, [phase, bannedBy.w, bannedBy.b, humanSide]);

  // Pre-pick AI modifiers on selection phase
  useEffect(() => {
    if (!vsAI) return;
    if (phase !== 'select') return;
    const available = allIds.filter(id => !banned.includes(id));
    if (aiSide === 'w') {
      if (selectedW.length === 0) setSelectedW(aiChooseModifiers(available, banned));
    } else {
      if (selectedB.length === 0) setSelectedB(aiChooseModifiers(available, banned));
    }
  }, [vsAI, phase, aiSide, banned, allIds, selectedW.length, selectedB.length]);

  // If a modifier becomes banned, purge it from both players' selections
  useEffect(() => {
    if (!banned?.length) return;
    setSelectedW(prev => prev.filter(id => !banned.includes(id)));
    setSelectedB(prev => prev.filter(id => !banned.includes(id)));
  }, [banned]);
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
        <div className="phase-banner medieval-card">
          <div className="phase-row">
            <div className="phase-steps">
              <div className={`phase-step ${phase==='ban'?'active':''}`}>
                <span className="num">1</span>
                <span className="label">Ban</span>
              </div>
              <div className={`phase-step ${phase==='select'?'active':''}`}>
                <span className="num">2</span>
                <span className="label">Select</span>
              </div>
            </div>
            <div className="phase-actions">
              <span className={`side-pill ${activeSide==='w'?'w':'b'}`}>Active: {activeSide==='w'?'White':'Black'}</span>
              <button className="btn-medieval" onClick={()=>setActiveSide(s=> s==='w'?'b':'w')}>Switch Side</button>
              {phase==='ban' && (bannedBy.w && bannedBy.b) && (
                <button className="btn-medieval" onClick={()=> setPhase('select')}>Next Phase</button>
              )}
            </div>
          </div>
          <div className="phase-info">
            {phase==='ban' ? (
              <>
                <strong>Ban phase:</strong> Each side bans one modifier. Banned: {banned.length? banned.join(', '): 'None'}
              </>
            ) : (
              <>
                <strong>Select phase:</strong> Choose up to {MOD_RULES.maxSelected} modifiers within a budget of {MOD_RULES.pointBudget} points. Category limits apply.
              </>
            )}
          </div>
          {vsAI && (
            <div className="phase-sub">
              <strong>You play:</strong> {humanSide==='w'?'White':'Black'}; <strong>AI plays:</strong> {aiSide==='w'?'White':'Black'}
            </div>
          )}
        </div>
        <div style={{display:'none'}}>
          <div><strong>Phase:</strong> {phase==='ban'?'Ban (each player one ban)':'Select'} · <strong>Active:</strong> {activeSide==='w'?'White':'Black'}</div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-medieval" onClick={()=>setActiveSide(s=> s==='w'?'b':'w')}>Switch Side</button>
            {phase==='ban' && (bannedBy.w && bannedBy.b) && (
              <button className="btn-medieval" onClick={()=> setPhase('select')}>Next Phase</button>
            )}
          </div>
        </div>
        <div style={{display:'none'}}>
          <strong>Banned:</strong> {banned.length? banned.join(', '): 'None'}
        </div>
        {vsAI && (
          <div style={{display:'none'}}>
            <strong>You play:</strong> {humanSide==='w'?'White':'Black'}; <strong>AI plays:</strong> {aiSide==='w'?'White':'Black'}
          </div>
        )}
        <ModifierBrowser
          selectedIds={activeSide==='w'? selectedW : selectedB}
          onChange={(ids)=> {
            if (vsAI && activeSide !== humanSide) return;
            if (activeSide==='w') setSelectedW(ids); else setSelectedB(ids);
          }}
          bannedIds={banned}
          phase={phase}
          canBan={phase==='ban' && ((activeSide==='w' && !bannedBy.w) || (activeSide==='b' && !bannedBy.b)) && (!vsAI || activeSide===humanSide)}
          onBan={(id)=>{
            if (phase!=='ban') return;
            if (banned.includes(id)) return;
            setBanned(prev=> [...prev, id]);
            setBannedBy(prev=> ({ ...prev, [activeSide]: id }));
            setActiveSide(s=> s==='w'?'b':'w');
          }}
          summaryWhite={selectedW}
          summaryBlack={selectedB}
          summaryBanned={bannedBy}
        />

        <div className="setup-footer">
          <button className="start btn-medieval" onClick={start}>Play</button>
          <div className="tip-bar">
            <span className="tip-label">Tip</span>
            <span>
              Ban one modifier per side, then select. Use Switch Side to pick for both players offline. {vsAI ? 'AI will ban and select for its side.' : ''}
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
