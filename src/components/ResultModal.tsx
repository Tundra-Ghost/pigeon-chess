import '../styles/medieval.css';

export default function ResultModal({ open, winner, drawReason, onClose }: { open: boolean; winner?: 'w'|'b'|null; drawReason?: string|null; onClose: () => void }) {
  if (!open) return null;
  const text = winner ? `${winner==='w'?'White':'Black'} wins!` : `Draw — ${(drawReason||'').replace(/_/g,' ')}`;
  return (
    <div style={{position:'fixed', inset:0, background:'#000a', display:'grid', placeItems:'center', zIndex:100}}>
      <div className="medieval-card" style={{ color:'#f5e6c8', padding:16, borderRadius:10, width:420, maxWidth:'92vw'}}>
        <h3 className="medieval-title" style={{marginTop:0}}>Game Over</h3>
        <p style={{fontSize:18, fontWeight:700}}>{text}</p>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
          <button className="btn-medieval" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
