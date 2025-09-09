import './MenuScreen.css';
import '../styles/medieval.css';
import AboutModal from './AboutModal';
import { useState } from 'react';
import logoUrl from '../assets/pigeon-chess-logo.png';

export default function MenuScreen({ onPlayOffline, onPlayOnline, onSettings, onExit, onAccount }: { onPlayOffline: () => void; onPlayOnline: () => void; onSettings: () => void; onExit?: () => void; onAccount: () => void }) {
  const [openAbout, setOpenAbout] = useState(false);
  return (
    <div className="menu-wrap medieval-bg">
      <section className="hero-wrap">
        <div className="menu-inner medieval-panel">
          <div className="title medieval-title" style={{justifySelf:'start'}}>
            <div className="word">PIGEON</div>
            <div className="word">CHESS</div>
            <div style={{opacity:.8, fontSize:18, marginTop:10}}>A gritty twist on a timeless game</div>
          </div>
          <div className="buttons">
            <button className="btn btn-medieval" onClick={onPlayOffline}>PLAY OFFLINE</button>
            <button className="btn btn-medieval" onClick={onPlayOnline}>PLAY ONLINE (BETA)</button>
            <button className="btn btn-medieval" onClick={onSettings}>SETTINGS</button>
            <button className="btn btn-medieval" onClick={()=>setOpenAbout(true)}>ABOUT</button>
            <button className="btn btn-medieval" onClick={onAccount}>ACCOUNT</button>
            {onExit ? <button className="btn btn-medieval" onClick={onExit}>EXIT</button> : null}
          </div>
          <div className="logo-sigil">
            <img src={logoUrl} alt="Pigeon Chess" />
          </div>
          <AboutModal open={openAbout} onClose={()=>setOpenAbout(false)} />
          <div className="noise-overlay" />
        </div>
      </section>
      <section className="board-section">
        <div className="menu-board">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className={`sq ${((Math.floor(i/8)+i)%2===0)?'light':'dark'}`}></div>
          ))}
        </div>
      </section>
    </div>
  );
}
