import type { Board, Piece } from './types';

function piece(type: Piece['type'], color: Piece['color']): Piece {
  return { type, color, hasMoved: false };
}

export function initialBoard(): Board {
  // Rank 0 (top) is Black back rank
  const empty = Array(8).fill(null);
  const board: Board = [
    [
      piece('R', 'b'),
      piece('N', 'b'),
      piece('B', 'b'),
      piece('Q', 'b'),
      piece('K', 'b'),
      piece('B', 'b'),
      piece('N', 'b'),
      piece('R', 'b'),
    ],
    Array(8)
      .fill(0)
      .map(() => piece('P', 'b')),
    [...empty],
    [...empty],
    [...empty],
    [...empty],
    Array(8)
      .fill(0)
      .map(() => piece('P', 'w')),
    [
      piece('R', 'w'),
      piece('N', 'w'),
      piece('B', 'w'),
      piece('Q', 'w'),
      piece('K', 'w'),
      piece('B', 'w'),
      piece('N', 'w'),
      piece('R', 'w'),
    ],
  ];
  return board;
}
