import '../styles/medieval.css';

export default function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed', inset:0, background:'#000a', display:'grid', placeItems:'center', zIndex:100}}>
      <div className="medieval-card" style={{ color:'#f5e6c8', padding:16, borderRadius:10, width:520, maxWidth:'92vw'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 className="medieval-title" style={{margin:0}}>About Pigeon Chess</h3>
          <button className="btn-medieval" onClick={onClose}>Close</button>
        </div>
        <p style={{marginTop:8}}>Classic chess with chaotic twists. Built with React + TypeScript. Server uses Express + Socket.IO with server-side move validation and SAN notation.</p>
        <p>Chess piece SVGs by Cburnett (CC BY-SA 3.0). See CREDITS.md.</p>
        <p>Open source prototype. Expect bugs and birds.</p>
      </div>
    </div>
  );
}
