import { useMemo, useState } from 'react';
import type { Color, Coord, GameState, Move } from '../chess/types';
import { initialBoard } from '../chess/initial';
import { at, isCheck, isCheckmate, legalMoves, makeMove, needsPromotion, opposite, hasAnyLegalMove, insufficientMaterial, positionKey } from '../chess/logic';
import './ChessBoard.css';

const PIECE_UNICODE: Record<string, string> = {
  'wK': '♔',
  'wQ': '♕',
  'wR': '♖',
  'wB': '♗',
  'wN': '♘',
  'wP': '♙',
  'bK': '♚',
  'bQ': '♛',
  'bR': '♜',
  'bB': '♝',
  'bN': '♞',
  'bP': '♟',
};

function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

function algebraic(pos: Coord): string {
  const files = 'abcdefgh';
  return `${files[pos.c]}${8 - pos.r}`;
}

export default function ChessBoard({ players, selectedModifiers, onExit }: { players: { w: string; b: string }, selectedModifiers: string[]; onExit?: () => void }) {
  const [state, setState] = useState<GameState>(() => ({
    board: initialBoard(),
    turn: 'w',
    selected: null,
    legalTargets: [],
    inCheck: null,
    winner: null,
    history: [],
    enPassantTarget: null,
    players,
    selectedModifiers,
    halfmoveClock: 0,
    repetition: {},
  }));

  const statusText = useMemo(() => {
    if (state.winner) {
      return state.winner === 'draw' ? 'Draw' : `${state.winner === 'w' ? 'White' : 'Black'} wins!`;
    }
    const check = isCheck(state.board, state.turn, state.enPassantTarget);
    const name = state.turn === 'w' ? state.players?.w ?? 'White' : state.players?.b ?? 'Black';
    if (check) return `${name} to move — Check!`;
    return `${name} to move`;
  }, [state.board, state.turn, state.winner, state.enPassantTarget, state.players]);

  function onSquareClick(r: number, c: number) {
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

      const nextBoard = makeMove(state.board, move, state.enPassantTarget ?? null);
      const nextTurn: Color = opposite(state.turn);
      const checkmate = isCheckmate(nextBoard, nextTurn, nextEnPassant);
      const inCheckNext = isCheck(nextBoard, nextTurn, nextEnPassant) ? nextTurn : null;
      // 50-move rule and repetition
      const destBefore = at(state.board, to);
      const didCapture = !!destBefore || move.isEnPassant === true;
      let halfmoveClock = state.halfmoveClock ?? 0;
      if (moving.type === 'P' || didCapture) halfmoveClock = 0; else halfmoveClock += 1;
      const rep = { ...(state.repetition ?? {}) } as Record<string, number>;
      const key = positionKey(nextBoard, nextTurn, nextEnPassant);
      rep[key] = (rep[key] ?? 0) + 1;
      let winner: GameState['winner'] = null;
      if (checkmate) {
        winner = state.turn;
      } else {
        const anyMove = hasAnyLegalMove(nextBoard, nextTurn, nextEnPassant);
        if (!anyMove && !inCheckNext) winner = 'draw'; // stalemate
        else if (insufficientMaterial(nextBoard)) winner = 'draw';
        else if (halfmoveClock >= 100) winner = 'draw';
        else if (rep[key] >= 3) winner = 'draw';
      }
      const nextState: GameState = {
        ...state,
        board: nextBoard,
        turn: nextTurn,
        selected: null,
        legalTargets: [],
        inCheck: inCheckNext,
        winner,
        history: [...state.history, move],
        enPassantTarget: nextEnPassant,
        halfmoveClock,
        repetition: rep,
      };
      setState(nextState);
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

  function reset() {
    setState({
      board: initialBoard(),
      turn: 'w',
      selected: null,
      legalTargets: [],
      inCheck: null,
      winner: null,
      history: [],
      enPassantTarget: null,
      players,
      selectedModifiers,
      halfmoveClock: 0,
      repetition: {},
    });
  }

  return (
    <div className="chess-wrapper">
      <div className="chess-sidebar">
        <h2>Pigeon Chess (Basic)</h2>
        <div className="status">{statusText}</div>
        <button className="reset" onClick={reset}>New Game</button>
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
              <li key={i}>{algebraic(m.from)} → {algebraic(m.to)}{m.promotion ? `=${m.promotion}` : ''}</li>
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
              const target = state.legalTargets?.includes(`${r},${c}`);
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
                    <span className={`piece ${sq.color}`}>{PIECE_UNICODE[`${sq.color}${sq.type}`]}</span>
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
