export type Color = 'w' | 'b';

export type PieceType = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K';

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
}

export type Square = Piece | null;

export type Board = Square[][]; // [rank][file] with rank 0 at top (black side)

export interface Coord {
  r: number; // 0..7 row (rank)
  c: number; // 0..7 col (file)
}

export interface Move {
  from: Coord;
  to: Coord;
  promotion?: PieceType; // when pawn promotes
  captured?: Piece | null;
  // inferred flags
  isCastle?: boolean;
  isEnPassant?: boolean;
}

export interface GameState {
  board: Board;
  turn: Color;
  selected?: Coord | null;
  legalTargets?: string[]; // list of "r,c" strings
  inCheck?: Color | null;
  winner?: Color | 'draw' | null;
  drawReason?: 'stalemate' | 'insufficient_material' | 'fifty_move_rule' | 'threefold_repetition' | null;
  history: Move[];
  enPassantTarget?: Coord | null; // square that can be captured en passant this move
  players?: { w: string; b: string };
  selectedModifiers?: string[];
  halfmoveClock?: number; // 50-move rule counter (half-moves)
  repetition?: Record<string, number>; // threefold repetition hashmap
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}
