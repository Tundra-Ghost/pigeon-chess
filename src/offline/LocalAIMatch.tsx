import { useEffect, useMemo, useRef, useState } from 'react';
import ChessBoard from '../components/ChessBoard';
import { initialBoard } from '../chess/initial';
import type { Move, Board, Color } from '../chess/types';
import { makeMove } from '../chess/logic';
import { aiChooseMove } from '../ai/simple';

export default function LocalAIMatch({ onExit, players, humanSide = 'w' }: { onExit?: () => void; players: { w: string; b: string }; humanSide?: Color }) {
  const [history, setHistory] = useState<Move[]>([]);
  const [externalMove, setExternalMove] = useState<Move | null>(null);
  const thinking = useRef(false);

  // Rebuild board from history
  const boardNow: Board = useMemo(() => {
    let b = initialBoard();
    let ep: any = null;
    for (const m of history) {
      b = makeMove(b, m, ep);
      // recompute ep like in ChessBoard
      ep = null;
      const from = m.from, to = m.to;
      const dr = Math.abs(to.r - from.r);
      if (dr === 2) ep = { r: (to.r + from.r)/2, c: from.c };
    }
    return b;
  }, [history]);

  // After human move, AI replies if it's AI's turn
  async function onHumanMove(m: Move) {
    // Append human move first
    setHistory(h => [...h, m]);
  }

  // If it's AI's turn (including at start when humanSide === 'b'), make a move
  useEffect(() => {
    const movesPlayed = history.length;
    const sideToMove: Color = movesPlayed % 2 === 0 ? 'w' : 'b';
    const aiSide: Color = humanSide === 'w' ? 'b' : 'w';
    if (sideToMove !== aiSide) return;
    if (thinking.current) return;
    thinking.current = true;
    const timer = setTimeout(() => {
      // En passant target from the last move (if a double-step just happened)
      let epForAI: any = null;
      const last = history[history.length - 1];
      if (last && Math.abs(last.to.r - last.from.r) === 2) {
        epForAI = { r: (last.to.r + last.from.r)/2, c: last.from.c };
      }
      const ai = aiChooseMove(boardNow, aiSide, epForAI);
      if (ai) {
        setHistory(h => [...h, ai]);
        setExternalMove(ai);
      }
      thinking.current = false;
    }, 120);
    return () => clearTimeout(timer);
  }, [history, boardNow, humanSide]);

  return (
    <div>
      <ChessBoard
        players={players}
        selectedModifiers={[]}
        onExit={onExit}
        onMove={onHumanMove}
        externalMove={externalMove}
        lockColor={humanSide}
      />
    </div>
  );
}
