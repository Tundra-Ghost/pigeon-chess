export default function ResultModal({ open, winner, drawReason, onClose }: { open: boolean; winner?: 'w'|'b'|null; drawReason?: string|null; onClose: () => void }) {
  if (!open) return null;
  const text = winner ? `${winner==='w'?'White':'Black'} wins!` : `Draw — ${(drawReason||'').replace(/_/g,' ')}`;
  return (
    <div style={{position:'fixed', inset:0, background:'#000a', display:'grid', placeItems:'center', zIndex:100}}>
      <div style={{background:'#111', color:'#fff', padding:16, borderRadius:10, width:420, maxWidth:'92vw', boxShadow:'0 10px 40px rgba(0,0,0,0.5)'}}>
        <h3 style={{marginTop:0}}>Game Over</h3>
        <p style={{fontSize:18, fontWeight:700}}>{text}</p>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

