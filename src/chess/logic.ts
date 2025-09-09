import { cloneBoard, inBounds } from './types';
import type { Board, Color, Coord, Move, Piece, PieceType } from './types';

export function at(board: Board, pos: Coord): Piece | null {
  return board[pos.r][pos.c];
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.r === b.r && a.c === b.c;
}

export function coordKey(pos: Coord): string {
  return `${pos.r},${pos.c}`;
}

function pushSlideMoves(board: Board, from: Coord, color: Color, dr: number, dc: number, acc: Coord[]) {
  let r = from.r + dr;
  let c = from.c + dc;
  while (inBounds(r, c)) {
    const t = board[r][c];
    if (!t) {
      acc.push({ r, c });
    } else {
      if (t.color !== color) acc.push({ r, c });
      break;
    }
    r += dr;
    c += dc;
  }
}

export function pseudoLegalMoves(board: Board, from: Coord, enPassantTarget?: Coord | null): Coord[] {
  const piece = at(board, from);
  if (!piece) return [];
  const { type, color } = piece;
  const moves: Coord[] = [];

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1; // white moves up (towards rank 0)
    const startRank = color === 'w' ? 6 : 1;
    const one: Coord = { r: from.r + dir, c: from.c };
    if (inBounds(one.r, one.c) && !at(board, one)) {
      moves.push(one);
      const two: Coord = { r: from.r + 2 * dir, c: from.c };
      if (from.r === startRank && !at(board, two)) moves.push(two);
    }
    // captures
    for (const dc of [-1, 1]) {
      const cap: Coord = { r: from.r + dir, c: from.c + dc };
      if (inBounds(cap.r, cap.c)) {
        const t = at(board, cap);
        if (t && t.color !== color) moves.push(cap);
      }
    }
    // en passant capture
    if (enPassantTarget) {
      for (const dc of [-1, 1]) {
        const ep: Coord = { r: from.r + dir, c: from.c + dc };
        if (ep.r === enPassantTarget.r && ep.c === enPassantTarget.c) {
          // Only if destination matches target and square is empty
          if (!at(board, ep)) moves.push(ep);
        }
      }
    }
    return moves;
  }

  if (type === 'N') {
    const deltas = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    for (const [dr, dc] of deltas) {
      const r = from.r + dr;
      const c = from.c + dc;
      if (!inBounds(r, c)) continue;
      const t = board[r][c];
      if (!t || t.color !== color) moves.push({ r, c });
    }
    return moves;
  }

  if (type === 'B' || type === 'R' || type === 'Q') {
    const slides: number[][] = [];
    if (type !== 'R') slides.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    if (type !== 'B') slides.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    for (const [dr, dc] of slides) pushSlideMoves(board, from, color, dr, dc, moves);
    return moves;
  }

  if (type === 'K') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = from.r + dr;
        const c = from.c + dc;
        if (!inBounds(r, c)) continue;
        const t = board[r][c];
        if (!t || t.color !== color) moves.push({ r, c });
      }
    }
    // Castling
    // Conditions: king and rook haven't moved, path empty, king not in check and squares not attacked
    const kingStartC = 4;
    const homeRank = color === 'w' ? 7 : 0;
    const kingAtStart = from.r === homeRank && from.c === kingStartC && !piece.hasMoved;
    if (kingAtStart) {
      // King-side rook at file 7
      const rookK = board[homeRank][7];
      if (rookK && rookK.type === 'R' && !rookK.hasMoved) {
        const emptyPath = !board[homeRank][5] && !board[homeRank][6];
        if (emptyPath) {
          const squaresSafe =
            !squareAttackedBy(board, { r: homeRank, c: 4 }, opposite(color)) &&
            !squareAttackedBy(board, { r: homeRank, c: 5 }, opposite(color)) &&
            !squareAttackedBy(board, { r: homeRank, c: 6 }, opposite(color));
          if (squaresSafe) moves.push({ r: homeRank, c: 6 });
        }
      }
      // Queen-side rook at file 0
      const rookQ = board[homeRank][0];
      if (rookQ && rookQ.type === 'R' && !rookQ.hasMoved) {
        const emptyPath = !board[homeRank][1] && !board[homeRank][2] && !board[homeRank][3];
        if (emptyPath) {
          const squaresSafe =
            !squareAttackedBy(board, { r: homeRank, c: 4 }, opposite(color)) &&
            !squareAttackedBy(board, { r: homeRank, c: 3 }, opposite(color)) &&
            !squareAttackedBy(board, { r: homeRank, c: 2 }, opposite(color));
          if (squaresSafe) moves.push({ r: homeRank, c: 2 });
        }
      }
    }
    return moves;
  }

  return moves;
}

export function findKing(board: Board, color: Color): Coord | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'K' && p.color === color) return { r, c };
    }
  }
  return null;
}

export function squareAttackedBy(board: Board, target: Coord, attacker: Color, enPassantTarget?: Coord | null): boolean {
  // Generate pseudo moves for all pieces of attacker and see if target included
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== attacker) continue;
      const from = { r, c };
      const moves = pseudoLegalMoves(board, from, enPassantTarget);
      if (moves.some(m => m.r === target.r && m.c === target.c)) return true;
    }
  }
  return false;
}

export function makeMove(board: Board, move: Move, enPassantTarget?: Coord | null): Board {
  const nb = cloneBoard(board);
  const piece = nb[move.from.r][move.from.c];
  nb[move.from.r][move.from.c] = null;
  if (!piece) return nb;
  // detect special moves
  // castling: king moves two squares from starting pos
  if (piece.type === 'K' && Math.abs(move.to.c - move.from.c) === 2) {
    move.isCastle = true;
    const homeRank = move.from.r;
    if (move.to.c === 6) {
      // king side: move rook from 7->5
      nb[homeRank][5] = nb[homeRank][7];
      nb[homeRank][7] = null;
      if (nb[homeRank][5]) nb[homeRank][5]!.hasMoved = true;
    } else if (move.to.c === 2) {
      // queen side: move rook 0->3
      nb[homeRank][3] = nb[homeRank][0];
      nb[homeRank][0] = null;
      if (nb[homeRank][3]) nb[homeRank][3]!.hasMoved = true;
    }
  }

  // en passant: pawn moves diagonally to empty square equal to ep target
  if (
    piece.type === 'P' &&
    enPassantTarget &&
    move.to.r === enPassantTarget.r &&
    move.to.c === enPassantTarget.c &&
    !nb[move.to.r][move.to.c]
  ) {
    move.isEnPassant = true;
    const dir = piece.color === 'w' ? -1 : 1;
    const capR = move.to.r - dir; // square of the pawn that was passed
    nb[capR][move.to.c] = null; // remove captured pawn
  }

  // promotion
  if (move.promotion) piece.type = move.promotion;
  piece.hasMoved = true;
  nb[move.to.r][move.to.c] = piece;
  return nb;
}

export function legalMoves(board: Board, from: Coord, colorToMove: Color, enPassantTarget?: Coord | null): Coord[] {
  const piece = at(board, from);
  if (!piece || piece.color !== colorToMove) return [];
  const candidates = pseudoLegalMoves(board, from, enPassantTarget);
  const legal: Coord[] = [];
  for (const to of candidates) {
    const move: Move = { from, to };
    const next = makeMove(board, move, enPassantTarget);
    const kingPos = findKing(next, colorToMove);
    if (!kingPos) continue; // malformed
    if (!squareAttackedBy(next, kingPos, opposite(colorToMove), enPassantTarget)) legal.push(to);
  }
  return legal;
}

export function opposite(c: Color): Color {
  return c === 'w' ? 'b' : 'w';
}

export function isCheck(board: Board, color: Color, enPassantTarget?: Coord | null): boolean {
  const k = findKing(board, color);
  if (!k) return false;
  return squareAttackedBy(board, k, opposite(color), enPassantTarget);
}

export function isCheckmate(board: Board, color: Color, enPassantTarget?: Coord | null): boolean {
  if (!isCheck(board, color, enPassantTarget)) return false;
  // if no legal moves available
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      const from = { r, c };
      const moves = legalMoves(board, from, color, enPassantTarget);
      if (moves.length > 0) return false;
    }
  }
  return true;
}

export function needsPromotion(piece: Piece, to: Coord): PieceType | null {
  if (piece.type !== 'P') return null;
  if (piece.color === 'w' && to.r === 0) return 'Q';
  if (piece.color === 'b' && to.r === 7) return 'Q';
  return null;
}

export function hasAnyLegalMove(board: Board, color: Color, enPassantTarget?: Coord | null): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      const from = { r, c };
      const moves = legalMoves(board, from, color, enPassantTarget);
      if (moves.length > 0) return true;
    }
  }
  return false;
}

export function insufficientMaterial(board: Board): boolean {
  const pieces: { type: PieceType; color: Color }[] = [];
  const bishopsColors: Color[] = []; // track bishop square colors as 'w' or 'b' squares
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      pieces.push({ type: p.type, color: p.color });
      if (p.type === 'B') {
        const dark = (r + c) % 2 === 1;
        bishopsColors.push(dark ? 'b' : 'w');
      }
    }
  }
  // Only kings
  if (pieces.every(p => p.type === 'K')) return true;
  // King + minor vs King
  const nonKings = pieces.filter(p => p.type !== 'K');
  if (nonKings.length === 1 && (nonKings[0].type === 'N' || nonKings[0].type === 'B')) return true;
  // King+B vs King+B with bishops on same color squares
  if (nonKings.length === 2 && nonKings.every(p => p.type === 'B')) {
    if (bishopsColors.length === 2 && bishopsColors[0] === bishopsColors[1]) return true;
  }
  return false;
}

function castlingRights(board: Board): string {
  let rights = '';
  // White
  const wk = board[7][4];
  const wrH = board[7][7];
  const wrA = board[7][0];
  if (wk && wk.type === 'K' && wk.color === 'w' && !wk.hasMoved) {
    if (wrH && wrH.type === 'R' && wrH.color === 'w' && !wrH.hasMoved) rights += 'K';
    if (wrA && wrA.type === 'R' && wrA.color === 'w' && !wrA.hasMoved) rights += 'Q';
  }
  // Black
  const bk = board[0][4];
  const brH = board[0][7];
  const brA = board[0][0];
  if (bk && bk.type === 'K' && bk.color === 'b' && !bk.hasMoved) {
    if (brH && brH.type === 'R' && brH.color === 'b' && !brH.hasMoved) rights += 'k';
    if (brA && brA.type === 'R' && brA.color === 'b' && !brA.hasMoved) rights += 'q';
  }
  return rights || '-';
}

export function positionKey(board: Board, turn: Color, enPassantTarget?: Coord | null): string {
  // Simple FEN-like key
  const rows: string[] = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) { row += String(empty); empty = 0; }
        const letter = p.type;
        row += p.color === 'w' ? letter : letter.toLowerCase();
      }
    }
    if (empty > 0) row += String(empty);
    rows.push(row);
  }
  const boardStr = rows.join('/');
  const ep = enPassantTarget ? `${enPassantTarget.r}${enPassantTarget.c}` : '-';
  const cr = castlingRights(board);
  return `${boardStr} ${turn} ${cr} ${ep}`;
}
