import { useMemo, useState } from 'react';
import type { Color, Coord, GameState, Move } from '../chess/types';
import { initialBoard } from '../chess/initial';
import { at, isCheck, isCheckmate, legalMoves, makeMove, needsPromotion, opposite, hasAnyLegalMove, insufficientMaterial, positionKey, moveToSAN } from '../chess/logic';
import { playMove, playCapture, playCastle } from '../sound';
import './ChessBoard.css';

// Piece images (Cburnett set; see CREDITS.md)
import wK from '../assets/pieces/cburnett/Chess_klt45.svg';
import wQ from '../assets/pieces/cburnett/Chess_qlt45.svg';
import wR from '../assets/pieces/cburnett/Chess_rlt45.svg';
import wB from '../assets/pieces/cburnett/Chess_blt45.svg';
import wN from '../assets/pieces/cburnett/Chess_nlt45.svg';
import wP from '../assets/pieces/cburnett/Chess_plt45.svg';
import bK from '../assets/pieces/cburnett/Chess_kdt45.svg';
import bQ from '../assets/pieces/cburnett/Chess_qdt45.svg';
import bR from '../assets/pieces/cburnett/Chess_rdt45.svg';
import bB from '../assets/pieces/cburnett/Chess_bdt45.svg';
import bN from '../assets/pieces/cburnett/Chess_ndt45.svg';
import bP from '../assets/pieces/cburnett/Chess_pdt45.svg';

const PIECE_IMG: Record<string, string> = { wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, bN, bP } as any;

function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

function algebraic(pos: Coord): string {
  const files = 'abcdefgh';
  return `${files[pos.c]}${8 - pos.r}`;
}

export default function ChessBoard({ players, selectedModifiers, onExit, onMove, disabled = false, externalMove, showHints = true, lockColor, onOpenSettings }: { players: { w: string; b: string }, selectedModifiers: string[]; onExit?: () => void; onMove?: (m: Move) => void; disabled?: boolean; externalMove?: Move | null; showHints?: boolean; lockColor?: Color, onOpenSettings?: () => void }) {
  const [state, setState] = useState<GameState>(() => ({
    board: initialBoard(),
    turn: 'w',
    selected: null,
    legalTargets: [],
    inCheck: null,
    winner: null,
    drawReason: null,
    history: [],
    enPassantTarget: null,
    players,
    selectedModifiers,
    halfmoveClock: 0,
    repetition: {},
  }));

  const statusText = useMemo(() => {
    if (state.winner) {
      if (state.winner === 'draw') {
        const reason = state.drawReason === 'stalemate'
          ? 'Stalemate'
          : state.drawReason === 'insufficient_material'
          ? 'Insufficient material'
          : state.drawReason === 'fifty_move_rule'
          ? '50-move rule'
          : state.drawReason === 'threefold_repetition'
          ? 'Threefold repetition'
          : 'Draw';
        return `Draw — ${reason}`;
      }
      const name = state.winner === 'w' ? state.players?.w ?? 'White' : state.players?.b ?? 'Black';
      return `${name} wins!`;
    }
    const check = isCheck(state.board, state.turn, state.enPassantTarget);
    const name = state.turn === 'w' ? state.players?.w ?? 'White' : state.players?.b ?? 'Black';
    if (check) return `${name} to move — Check!`;
    return `${name} to move`;
  }, [state.board, state.turn, state.winner, state.enPassantTarget, state.players, state.drawReason]);

  function onSquareClick(r: number, c: number) {
    if (disabled) return;
    if (lockColor && lockColor !== state.turn) return;
    if (state.winner) return;
    const pos: Coord = { r, c };
    const piece = at(state.board, pos);

    // If a legal target is clicked, perform move
    const isLegalTarget = state.legalTargets?.includes(`${r},${c}`);
    if (state.selected && isLegalTarget) {
      const from = state.selected;
      const to = pos;
      const moving = at(state.board, from)!;
      const promo = needsPromotion(moving, to);
      const move: Move = { from, to, promotion: promo ?? undefined };
      // compute en passant target for next turn (if a pawn moved two squares)
      let nextEnPassant: Coord | null = null;
      if (moving.type === 'P' && Math.abs(to.r - from.r) === 2) {
        nextEnPassant = { r: (to.r + from.r) / 2, c: from.c };
      }

      const destBefore = at(state.board, to);
      const nextBoard = makeMove(state.board, move, state.enPassantTarget ?? null);
      const nextTurn: Color = opposite(state.turn);
      const inCheckNext = isCheck(nextBoard, nextTurn, nextEnPassant) ? nextTurn : null;
      const checkmate = isCheckmate(nextBoard, nextTurn, nextEnPassant);

      // 50-move rule and repetition
      const didCapture = !!destBefore || move.isEnPassant === true;
      let halfmoveClock = state.halfmoveClock ?? 0;
      if (moving.type === 'P' || didCapture) halfmoveClock = 0; else halfmoveClock += 1;
      const rep = { ...(state.repetition ?? {}) } as Record<string, number>;
      const key = positionKey(nextBoard, nextTurn, nextEnPassant);
      rep[key] = (rep[key] ?? 0) + 1;

      let winner: GameState['winner'] = null;
      let drawReason: GameState['drawReason'] = null;
      if (checkmate) {
        winner = state.turn;
      } else {
        const anyMove = hasAnyLegalMove(nextBoard, nextTurn, nextEnPassant);
        if (!anyMove && !inCheckNext) { winner = 'draw'; drawReason = 'stalemate'; }
        else if (insufficientMaterial(nextBoard)) { winner = 'draw'; drawReason = 'insufficient_material'; }
        else if (halfmoveClock >= 100) { winner = 'draw'; drawReason = 'fifty_move_rule'; }
        else if (rep[key] >= 3) { winner = 'draw'; drawReason = 'threefold_repetition'; }
      }
      const san = moveToSAN(state.board, move, state.turn, state.enPassantTarget ?? null);
      const nextState: GameState = {
        ...state,
        board: nextBoard,
        turn: nextTurn,
        selected: null,
        legalTargets: [],
        inCheck: inCheckNext,
        winner,
        drawReason: winner === 'draw' ? drawReason : null,
        history: [...state.history, { ...move, san, color: state.turn, byName: state.turn === 'w' ? (state.players?.w ?? 'White') : (state.players?.b ?? 'Black') }],
        enPassantTarget: nextEnPassant,
        halfmoveClock,
        repetition: rep,
      };
      if (moving.type === 'K' && Math.abs(to.c - from.c) === 2) playCastle();
      else if (didCapture) playCapture();
      else playMove();
      setState(nextState);
      onMove?.(move);
      return;
    }

    // Otherwise, (re)select a piece of the side to move
    if (piece && piece.color === state.turn) {
      // Toggle off if clicking same selected piece
      if (state.selected && state.selected.r === r && state.selected.c === c) {
        setState(s => ({ ...s, selected: null, legalTargets: [] }));
        return;
      }
      const legal = legalMoves(state.board, pos, state.turn, state.enPassantTarget ?? null);
      setState(s => ({
        ...s,
        selected: pos,
        legalTargets: legal.map(coord => `${coord.r},${coord.c}`),
      }));
    } else {
      // Clicking empty or opponent clears selection
      setState(s => ({ ...s, selected: null, legalTargets: [] }));
    }
  }

  // Apply external moves (e.g., from server)
  const [lastAppliedKey, setLastAppliedKey] = useState<string | null>(null);
  const ext = externalMove;
  if (ext) {
    const key = `${ext.from.r},${ext.from.c}-${ext.to.r},${ext.to.c}-${ext.promotion || ''}-${state.history.length}`;
    if (lastAppliedKey !== key) {
      const moving = at(state.board, ext.from);
      if (moving) {
        const destBefore = at(state.board, ext.to);
        const hadCapture = !!destBefore || !!ext.isEnPassant;
        // compute en passant target for next turn
        let nextEnPassant: any = null;
        if (moving.type === 'P' && Math.abs(ext.to.r - ext.from.r) === 2) {
          nextEnPassant = { r: (ext.to.r + ext.from.r) / 2, c: ext.from.c };
        }
        const nextBoard = makeMove(state.board, ext, state.enPassantTarget ?? null);
        const nextTurn: Color = opposite(state.turn);
        const inCheckNext = isCheck(nextBoard, nextTurn, nextEnPassant) ? nextTurn : null;
        const checkmate = isCheckmate(nextBoard, nextTurn, nextEnPassant);

        // 50-move rule and repetition
        let halfmoveClock = state.halfmoveClock ?? 0;
        if (moving.type === 'P' || hadCapture) halfmoveClock = 0; else halfmoveClock += 1;
        const rep = { ...(state.repetition ?? {}) } as Record<string, number>;
        const keyPos = positionKey(nextBoard, nextTurn, nextEnPassant);
        rep[keyPos] = (rep[keyPos] ?? 0) + 1;

        let winner: GameState['winner'] = null;
        let drawReason: GameState['drawReason'] = null;
        if (checkmate) {
          winner = state.turn;
        } else {
          const anyMove = hasAnyLegalMove(nextBoard, nextTurn, nextEnPassant);
          if (!anyMove && !inCheckNext) { winner = 'draw'; drawReason = 'stalemate'; }
          else if (insufficientMaterial(nextBoard)) { winner = 'draw'; drawReason = 'insufficient_material'; }
          else if (halfmoveClock >= 100) { winner = 'draw'; drawReason = 'fifty_move_rule'; }
          else if (rep[keyPos] >= 3) { winner = 'draw'; drawReason = 'threefold_repetition'; }
        }
        const san = moveToSAN(state.board, ext, state.turn, state.enPassantTarget ?? null);
        const nextState: GameState = {
          ...state,
          board: nextBoard,
          turn: nextTurn,
          selected: null,
          legalTargets: [],
          inCheck: inCheckNext,
          winner,
          drawReason: winner === 'draw' ? drawReason : null,
          history: [...state.history, { ...ext, san, color: state.turn, byName: state.turn === 'w' ? (state.players?.w ?? 'White') : (state.players?.b ?? 'Black') }],
          enPassantTarget: nextEnPassant,
          halfmoveClock,
          repetition: rep,
        };
        if (moving.type === 'K' && Math.abs(ext.to.c - ext.from.c) === 2) playCastle();
        else if (hadCapture) playCapture();
        else playMove();
        setState(nextState);
        setLastAppliedKey(key);
      }
    }
  }

  function reset() {
    setState({
      board: initialBoard(),
      turn: 'w',
      selected: null,
      legalTargets: [],
      inCheck: null,
      winner: null,
      drawReason: null,
      history: [],
      enPassantTarget: null,
      players,
      selectedModifiers,
      halfmoveClock: 0,
      repetition: {},
    });
  }

  return (
    <div className="chess-wrapper container mx-auto">
      <div className="chess-sidebar">
        <h2 className="text-xl font-bold">Pigeon Chess (Basic)</h2>
        <div className="status">{statusText}</div>
        <button className="reset" onClick={reset}>New Game</button>
        {onOpenSettings ? <button className="reset" onClick={onOpenSettings}>Settings</button> : null}
        {onExit ? <button className="reset" onClick={onExit}>Back to Setup</button> : null}
        <div className="legend">
          <div><span className="dot sel"/> Selected</div>
          <div><span className="dot tgt"/> Legal move</div>
          <div><span className="dot chk"/> In check</div>
        </div>
        <div className="history">
          <h3>Moves</h3>
          <ol>
            {state.history.map((m, i) => (
              <li key={i}>{m.color === 'w' ? (state.players?.w ?? 'White') : (state.players?.b ?? 'Black')}: {m.san || `${algebraic(m.from)}→${algebraic(m.to)}`}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="board" role="grid" aria-label="Chessboard">
        {state.board.map((row, r) => (
          <div key={r} className="rank" role="row">
            {row.map((sq, c) => {
              const isDark = (r + c) % 2 === 1;
              const selected = state.selected && state.selected.r === r && state.selected.c === c;
              const target = showHints && state.legalTargets?.includes(`${r},${c}`);
              const inCheckCls = state.inCheck && sq?.type === 'K' && sq.color === state.inCheck;
              return (
                <button
                  key={cellKey(r, c)}
                  className={`square ${isDark ? 'dark' : 'light'} ${selected ? 'selected' : ''} ${target ? 'target' : ''} ${inCheckCls ? 'check' : ''}`}
                  onClick={() => onSquareClick(r, c)}
                  role="gridcell"
                  aria-label={`Square ${r},${c}`}
                >
                  {sq ? (
                    <img className={`piece ${sq.color}`} src={PIECE_IMG[`${sq.color}${sq.type}`]} alt={`${sq.color}${sq.type}`} />
                  ) : (
                    <span className="dot-holder">{target ? <span className="move-dot"/> : null}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
