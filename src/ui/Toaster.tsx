import { useEffect, useState } from 'react';

export type Toast = { id: number; type: 'info'|'success'|'error'; text: string };

let counter = 1;
export function showToast(type: Toast['type'], text: string) {
  const ev = new CustomEvent('toast', { detail: { id: counter++, type, text } as Toast });
  document.dispatchEvent(ev);
}

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    function onToast(e: any) {
      const t: Toast = e.detail;
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3200);
    }
    document.addEventListener('toast', onToast as any);
    return () => document.removeEventListener('toast', onToast as any);
  }, []);

  return (
    <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 1000, display: 'grid', gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#7f1d1d' : t.type === 'success' ? '#14532d' : '#1f2937',
          color: '#fff', padding: '10px 12px', borderRadius: 8,
          boxShadow: '0 8px 20px rgba(0,0,0,0.35)'
        }}>{t.text}</div>
      ))}
    </div>
  );
}

