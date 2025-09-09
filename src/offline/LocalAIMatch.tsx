import { useMemo, useRef, useState } from 'react';
import ChessBoard from '../components/ChessBoard';
import { initialBoard } from '../chess/initial';
import type { Move, Board } from '../chess/types';
import { makeMove } from '../chess/logic';
import { aiChooseMove } from '../ai/simple';

export default function LocalAIMatch({ onExit, players }: { onExit?: () => void; players: { w: string; b: string } }) {
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

  // After human (white) move, pick AI (black) move
  async function onHumanMove(m: Move) {
    setHistory(h => [...h, m]);
    if (thinking.current) return;
    thinking.current = true;
    setTimeout(() => {
      // derive current en passant target from last move
      let epNow: any = null;
      const last = history[history.length - 1] || m;
      if (last) {
        const dr = Math.abs(last.to.r - last.from.r);
        const moved = boardNow[last.to.r]?.[last.to.c] || null;
        if (moved && moved.type === 'P' && dr === 2) {
          epNow = { r: (last.to.r + last.from.r)/2, c: last.from.c };
        }
      }
      const ai = aiChooseMove(boardNow, 'b', epNow);
      if (ai) {
        setHistory(h => [...h, ai]);
        setExternalMove(ai);
      }
      thinking.current = false;
    }, 120); // slight delay for UX
  }

  return (
    <div>
      <ChessBoard
        players={players}
        selectedModifiers={[]}
        onExit={onExit}
        onMove={onHumanMove}
        externalMove={externalMove}
      />
    </div>
  );
}
