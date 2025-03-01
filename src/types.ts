/**
 * Player colors in Checkers
 */
export type Color = "red" | "black";

/**
 * Type of checker piece
 */
export type PieceType = "man" | "king";

/**
 * Represents a game piece
 */
export interface Piece {
  color: Color;
  type: PieceType;
}

/**
 * Board position (row, column)
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Complete move definition including captures
 */
export interface CheckersMove {
  from: Position;
  path: Position[];
  captures: Position[];
}

/**
 * Possible game states
 */
export type GameState = "redTurn" | "blackTurn" | "gameOver";

/**
 * Complete game state snapshot
 */
export interface CheckersGameState {
  board: (Piece | null)[][];
  turn: Color;
  allowedMoves: CheckersMove[];
  gameState: GameState;
  boardStatus: string;
  isGameOver: boolean;
}
