import './MenuScreen.css';
import AboutModal from './AboutModal';
import { useState } from 'react';

export default function MenuScreen({ onPlayOffline, onPlayOnline, onSettings, onExit, onAccount }: { onPlayOffline: () => void; onPlayOnline: () => void; onSettings: () => void; onExit?: () => void; onAccount: () => void }) {
  const [openAbout, setOpenAbout] = useState(false);
  return (
    <div className="menu-wrap">
      <div className="sky">
        <div className="cloud c1"/>
        <div className="cloud c2"/>
        <div className="cloud c3"/>
      </div>
      <div className="ground"/>
      <div className="menu-inner">
        <div className="title">
          <div className="word">PIGEON</div>
          <div className="word">CHESS</div>
        </div>
        <div className="buttons">
          <button className="btn" onClick={onPlayOffline}>PLAY OFFLINE</button>
          <button className="btn" onClick={onPlayOnline}>PLAY ONLINE (BETA)</button>
          <button className="btn" onClick={onSettings}>SETTINGS</button>
          <button className="btn" onClick={()=>setOpenAbout(true)}>ABOUT</button>
          <button className="btn" onClick={onAccount}>ACCOUNT</button>
          {onExit ? <button className="btn" onClick={onExit}>EXIT</button> : null}
        </div>
        <AboutModal open={openAbout} onClose={()=>setOpenAbout(false)} />
      </div>
    </div>
  );
}
