import AuthPanel from './AuthPanel';

export default function AuthModal({ open, onClose, onGoProfile }: { open: boolean; onClose: () => void; onGoProfile: () => void }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed', inset:0, background:'#000a', display:'grid', placeItems:'center', zIndex:100}}>
      <div style={{background:'#111', color:'#fff', padding:16, borderRadius:10, width:420, maxWidth:'92vw', boxShadow:'0 10px 40px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{margin:0}}>Sign in / Register</h3>
          <button onClick={onClose}>Close</button>
        </div>
        <AuthPanel onGoProfile={onGoProfile} />
      </div>
    </div>
  );
}
