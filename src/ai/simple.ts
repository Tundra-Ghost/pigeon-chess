import type { Board, Color, Move, Coord } from '../chess/types';
import { legalMoves, makeMove, opposite, isCheckmate, needsPromotion } from '../chess/logic';
import { MODIFIERS, MOD_RULES, type Modifier } from '../modifiers/data';

// ---------- Modifier AI ----------

function scoreModifier(m: Modifier): number {
  let s = 0;
  // Favor impactful categories
  if (m.category === 'Movement') s += 3;
  if (m.category === 'Piece') s += 2.5;
  if (m.category === 'Board') s += 2;
  if (m.category === 'Economy') s += 1.5;
  if (m.category === 'Chaos') s += 1; // fun but risky
  // Tags heuristics
  if (m.tags.includes('promotion')) s += 0.8;
  if (m.tags.includes('tempo')) s += 0.5;
  if (m.tags.includes('pawn')) s += 0.2;
  // Value per cost
  s += Math.max(0, 3 - m.cost) * 0.5;
  return s;
}

export function aiChooseBan(availableIds: string[], banned: string[] = []): string | null {
  const pool = MODIFIERS.filter(m => availableIds.includes(m.id) && !banned.includes(m.id));
  if (!pool.length) return null;
  // Ban the highest cost with strong category impact or chaos
  const ranked = pool
    .map(m => ({ m, r: m.cost * 2 + (m.category === 'Chaos' ? 1.5 : 0) + (m.category === 'Movement' ? 1 : 0) }))
    .sort((a,b)=> b.r - a.r);
  return ranked[0].m.id;
}

export function aiChooseModifiers(availableIds: string[], banned: string[] = []): string[] {
  const rules = MOD_RULES;
  const pool = MODIFIERS.filter(m => availableIds.includes(m.id) && !banned.includes(m.id));
  const selected: Modifier[] = [];
  let budget = 0;
  const perCat: Record<Modifier['category'], number> = { Board:0, Piece:0, Movement:0, Economy:0, Chaos:0 };

  const ranked = pool
    .map(m => ({ m, s: scoreModifier(m) }))
    .sort((a,b)=> b.s - a.s);

  for (const { m } of ranked) {
    if (selected.length >= rules.maxSelected) break;
    if (budget + m.cost > rules.pointBudget) continue;
    const catMax = rules.perCategory[m.category];
    if (catMax && perCat[m.category] >= catMax) continue;
    if (m.group && selected.some(s => s.group === m.group)) continue;
    selected.push(m); budget += m.cost; perCat[m.category]++;
  }
  return selected.map(s => s.id);
}

// ---------- Simple Chess AI ----------

const PIECE_VALUES: Record<string, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

function evaluate(board: Board, color: Color): number {
  let score = 0;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p = board[r][c];
    if (!p) continue;
    const v = PIECE_VALUES[p.type];
    score += (p.color === color ? v : -v);
  }
  return score;
}

function generateMoves(board: Board, color: Color, enPassantTarget: Coord | null = null): Move[] {
  const moves: Move[] = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p = board[r][c];
    if (!p || p.color !== color) continue;
    const from = { r, c };
    const ls = legalMoves(board, from, color, enPassantTarget ?? null);
    for (const to of ls) {
      const mv: Move = { from, to };
      // consider auto-promotion to queen
      const prom = needsPromotion(p, to);
      if (prom) mv.promotion = prom;
      moves.push(mv);
    }
  }
  return moves;
}

export function aiChooseMove(board: Board, color: Color, enPassantTarget: Coord | null = null): Move | null {
  // Depth-2 minimax (very light)
  const myMoves = generateMoves(board, color, enPassantTarget ?? null);
  if (myMoves.length === 0) return null;
  let best: { m: Move; s: number } | null = null;
  for (const m of myMoves) {
    const b1 = makeMove(board, m, enPassantTarget ?? null);
    const opp = opposite(color);
    if (isCheckmate(b1, opp, null)) return m; // immediate win
    // Opponent reply
    const oppMoves = generateMoves(b1, opp, null);
    let worst = Infinity;
    if (oppMoves.length === 0) worst = evaluate(b1, color);
    else {
      for (const om of oppMoves) {
        const b2 = makeMove(b1, om, null);
        const val = evaluate(b2, color);
        if (val < worst) worst = val;
      }
    }
    if (!best || worst > best.s) best = { m, s: worst };
  }
  return best?.m || null;
}

