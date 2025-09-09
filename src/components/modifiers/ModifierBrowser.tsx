import { useMemo, useState } from 'react';
import type { Modifier } from '../../modifiers/data';
import { MODIFIERS, MOD_RULES, MOD_TAGS, MOD_CATEGORIES } from '../../modifiers/data';
import './modifiers.css';
import placeholderIcon from '../../assets/404-error.svg';

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  bannedIds?: string[];
  phase?: 'ban' | 'select';
  onBan?: (id: string) => void;
  canBan?: boolean;
};

export default function ModifierBrowser({ selectedIds, onChange, bannedIds = [], phase = 'select', onBan, canBan = false }: Props){
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [category, setCategory] = useState<'All' | Modifier['category']>('All');

  const selected = useMemo(() => MODIFIERS.filter(m => selectedIds.includes(m.id)), [selectedIds]);
  const costUsed = selected.reduce((a,b)=>a+b.cost,0);

  function toggleTag(tag: string){
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);
  }

  function canSelect(m: Modifier): { ok: boolean; reason?: string }{
    if (selectedIds.includes(m.id)) return { ok: true };
    if (selectedIds.length >= MOD_RULES.maxSelected) return { ok: false, reason: 'Max selected' };
    if (costUsed + m.cost > MOD_RULES.pointBudget) return { ok: false, reason: 'Budget exceeded' };
    const catMax = MOD_RULES.perCategory[m.category];
    if (catMax){
      const countCat = selected.filter(s=>s.category===m.category).length;
      if (countCat >= catMax) return { ok: false, reason: `${m.category} limit` };
    }
    if (m.group){
      const hasGroup = selected.some(s=>s.group && s.group===m.group);
      if (hasGroup) return { ok: false, reason: 'Exclusive' };
    }
    return { ok: true };
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODIFIERS.filter(m => {
      if (bannedIds.includes(m.id)) return false;
      if (category !== 'All' && m.category !== category) return false;
      if (activeTags.length && !activeTags.every(t => m.tags.includes(t))) return false;
      if (q && !(m.name.toLowerCase().includes(q) || m.short.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [query, activeTags, category]);

  function toggle(m: Modifier){
    const already = selectedIds.includes(m.id);
    if (already){ onChange(selectedIds.filter(id => id !== m.id)); return; }
    const chk = canSelect(m);
    if (!chk.ok) return; // optionally surface message
    onChange([...selectedIds, m.id]);
  }

  return (
    <div className="mod-browser">
      <div>
        <div className="mod-toolbar">
          <input type="search" placeholder="Search modifiers…" value={query} onChange={e=>setQuery(e.target.value)} />
          <div className="chips">
            <span className={`chip ${category==='All'?'active':''}`} onClick={()=>setCategory('All')}>All</span>
            {MOD_CATEGORIES.map(cat => (
              <span key={cat} className={`chip ${category===cat?'active':''}`} onClick={()=>setCategory(cat)}>{cat}</span>
            ))}
          </div>
        </div>
        <div className="chips" style={{marginBottom:8}}>
          {MOD_TAGS.map(t => (
            <span key={t} className={`chip ${activeTags.includes(t)?'active':''}`} onClick={()=>toggleTag(t)}>{t}</span>
          ))}
        </div>

        <div className="mod-list">
          {filtered.map(m => {
            const active = selectedIds.includes(m.id);
            const chk = canSelect(m);
            const isBanned = bannedIds.includes(m.id);
            return (
              <div key={m.id} className="mod-card">
                {phase === 'select' ? (
                  <input aria-label="select modifier" type="checkbox" checked={active} onChange={()=>toggle(m)} />
                ) : (
                  <input aria-label="ban modifier" type="checkbox" disabled checked={false} />
                )}
                <div>
                  <img className="mod-icon" src={(m as any).icon || placeholderIcon} alt="modifier icon" />
                  <div className="name">{m.name} <span className="meta">[{m.category}] · cost {m.cost}</span></div>
                  <div className="desc">{m.short}</div>
                </div>
                <div>
                  {phase === 'select' ? (
                    <button className="btn-mini" disabled={!active && !chk.ok} onClick={()=>toggle(m)}>{active?'Remove':'Add'}</button>
                  ) : (
                    <button className="btn-mini" disabled={isBanned || !canBan || !onBan} onClick={()=> onBan && onBan(m.id)}>Ban</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mod-selected">
        <h4>Selected</h4>
        <div className="rulebar">
          <div>Count: <strong>{selectedIds.length}</strong> / {MOD_RULES.maxSelected}</div>
          <div>Budget: <strong>{costUsed}</strong> / {MOD_RULES.pointBudget}</div>
        </div>
        <ul>
          {selected.map(s => (
            <li key={s.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>{s.name} <span className="meta">[{s.category}] · {s.cost}pt</span></span>
              <button className="btn-mini" onClick={()=>onChange(selectedIds.filter(id=>id!==s.id))}>Remove</button>
            </li>
          ))}
        </ul>
        {selected.length>0 && (
          <button className="btn-mini" onClick={()=>onChange([])}>Clear All</button>
        )}
      </div>
    </div>
  );
}
