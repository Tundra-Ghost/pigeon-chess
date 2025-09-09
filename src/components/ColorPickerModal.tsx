import { useState } from 'react';
import wK from '../assets/pieces/cburnett/Chess_klt45.svg';
import bK from '../assets/pieces/cburnett/Chess_kdt45.svg';

export default function ColorPickerModal({ open, onClose: _onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (side: 'w'|'b') => void }) {
  const [choice, setChoice] = useState<'w'|'b'|null>(null);
  if (!open) return null;
  const isW = choice === 'w';
  const isB = choice === 'b';
  return (
    <div
      role="dialog"
      aria-modal
      style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}
    >
      <div className="medieval-card" style={{
        background:'#14110f', border:'2px solid #3a2a1f', borderRadius:16,
        padding:24, width:'min(90vw, 640px)'
      }}>
        <h3 className="text-2xl font-bold medieval-title" style={{marginBottom:16, textAlign:'center'}}>Choose Your Side</h3>
        <div style={{display:'flex', gap:16, justifyContent:'center', marginBottom:16}}>
          <button
            className={`cpick ${isW ? 'pressed' : ''}`}
            onClick={()=> setChoice('w')}
            aria-pressed={isW}
            aria-label="Play as White"
            style={btnStyle(isW)}
          >
            <img src={wK} alt="White King" style={{width:72, height:72}} />
            <div style={{marginTop:8, fontWeight:800, fontSize:16}}>White</div>
          </button>
          <button
            className={`cpick ${isB ? 'pressed' : ''}`}
            onClick={()=> setChoice('b')}
            aria-pressed={isB}
            aria-label="Play as Black"
            style={btnStyle(isB)}
          >
            <img src={bK} alt="Black King" style={{width:72, height:72}} />
            <div style={{marginTop:8, fontWeight:800, fontSize:16}}>Black</div>
          </button>
        </div>
        <div style={{display:'flex', justifyContent:'center', gap:12}}>
          <button className="btn-medieval" disabled={!choice} onClick={()=> choice && onConfirm(choice)}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(pressed: boolean): React.CSSProperties {
  return {
    display:'grid', placeItems:'center', width:180, padding:16,
    borderRadius:14,
    border: pressed ? '2px solid #d6b24a' : '2px solid #3a2a1f',
    background: pressed ? 'linear-gradient(180deg,#4b3b20,#2a221a)' : 'transparent',
    boxShadow: pressed ? '0 0 14px rgba(255,213,79,0.35)' : 'none',
    color:'#f1e0b7', cursor:'pointer'
  };
}
