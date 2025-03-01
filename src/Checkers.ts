import { EventEmitter } from "events";
import {
  Color,
  PieceType,
  Piece,
  Position,
  CheckersMove,
  GameState,
  CheckersGameState,
} from "./types";

/**
 * Main Checkers game class with event emitting
 */
export class Checkers extends EventEmitter {
  private _board: (Piece | null)[][];
  private _turn: Color;

  constructor() {
    super();
    this._board = [];
    this._turn = "red";
    this.reset();
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this._board = Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) => {
        if ((row + col) % 2 === 1) {
          if (row < 3) return { color: "black", type: "man" };
          if (row > 4) return { color: "red", type: "man" };
        }
        return null;
      })
    );
    this._turn = "red";
    this._emitStateChange();
  }

  /**
   * Returns the piece at the given position (or null).
   */
  getPiece(pos: Position): Piece | null {
    if (pos.row < 0 || pos.row >= 8 || pos.col < 0 || pos.col >= 8) return null;
    return this._board[pos.row][pos.col];
  }

  /**
   * Get current game state
   */
  getCurrentState(): CheckersGameState {
    const allowedMoves = Checkers.getAllowedMovesForBoard(
      this._board,
      this._turn
    );
    const isGameOver = allowedMoves.length === 0;
    const boardStatus = isGameOver
      ? `Game Over! ${this._turn === "red" ? "Black" : "Red"} wins!`
      : `${this._turn}'s turn`;

    return {
      board: Checkers.cloneBoard(this._board),
      turn: this._turn,
      allowedMoves,
      gameState: isGameOver
        ? "gameOver"
        : this._turn === "red"
        ? "redTurn"
        : "blackTurn",
      boardStatus,
      isGameOver,
    };
  }

  /**
   * Execute a move if valid
   */
  move(move: CheckersMove): boolean {
    const valid = this.validateMove(move);
    if (!valid) return false;

    const piece = this.getPiece(move.from)!;

    // Apply captures
    move.captures.forEach(({ row, col }) => (this._board[row][col] = null));

    // Move piece
    const finalPos = move.path[move.path.length - 1];
    this._board[move.from.row][move.from.col] = null;
    this._board[finalPos.row][finalPos.col] = this._promoteIfNeeded(
      piece,
      finalPos.row
    );

    // Switch turns
    this._turn = this._turn === "red" ? "black" : "red";
    this._emitStateChange();
    return true;
  }

  /**
   * Generate best move using minimax algorithm
   */
  bestMove(depth: number): CheckersMove | null {
    const result = Checkers.minimax(
      Checkers.cloneBoard(this._board),
      depth,
      true,
      this._turn,
      this._turn
    );
    return result.move;
  }

  private _emitStateChange(): void {
    this.emit("stateChange", this.getCurrentState());
  }

  private _promoteIfNeeded(piece: Piece, row: number): Piece {
    if (piece.type === "king") return piece;
    if (piece.color === "red" && row === 0) return { ...piece, type: "king" };
    if (piece.color === "black" && row === 7) return { ...piece, type: "king" };
    return piece;
  }

  private validateMove(move: CheckersMove): boolean {
    const allowedMoves = Checkers.getAllowedMovesForBoard(
      this._board,
      this._turn
    );
    return allowedMoves.some((m) => Checkers.compareMoves(m, move));
  }

  /**
   * Generate all allowed moves for the player whose turn is `turn` on the given board.
   * If any capturing moves are available, they are mandatory.
   */
  static getAllowedMovesForBoard(
    board: (Piece | null)[][],
    turn: Color
  ): CheckersMove[] {
    const allCaptures: CheckersMove[] = [];
    const allSimple: CheckersMove[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === turn) {
          const pos: Position = { row: r, col: c };
          const captures = Checkers.getCapturesForPiece(board, pos, piece);
          if (captures.length > 0) {
            allCaptures.push(...captures);
          } else {
            const simple = Checkers.getSimpleMovesForPiece(board, pos, piece);
            allSimple.push(...simple);
          }
        }
      }
    }
    return allCaptures.length > 0 ? allCaptures : allSimple;
  }

  /**
   * Recursively generate all capturing (jump) moves for a piece starting from `pos` on the given board.
   */
  static getCapturesForPiece(
    board: (Piece | null)[][],
    pos: Position,
    piece: Piece,
    currentMove?: CheckersMove
  ): CheckersMove[] {
    const moves: CheckersMove[] = [];
    const directions = Checkers.getDirections(piece);
    let foundCapture = false;
    // Initialize the move sequence.
    const moveSoFar: CheckersMove = currentMove
      ? {
          ...currentMove,
          path: [...currentMove.path],
          captures: [...currentMove.captures],
        }
      : { from: pos, path: [], captures: [] };

    for (const d of directions) {
      const enemyPos: Position = { row: pos.row + d[0], col: pos.col + d[1] };
      const landingPos: Position = {
        row: pos.row + 2 * d[0],
        col: pos.col + 2 * d[1],
      };

      // Check boundaries for landing.
      if (
        landingPos.row < 0 ||
        landingPos.row >= 8 ||
        landingPos.col < 0 ||
        landingPos.col >= 8
      )
        continue;

      const enemyPiece =
        enemyPos.row >= 0 &&
        enemyPos.row < 8 &&
        enemyPos.col >= 0 &&
        enemyPos.col < 8
          ? board[enemyPos.row][enemyPos.col]
          : null;
      // There must be an opponent piece to capture.
      if (!enemyPiece || enemyPiece.color === piece.color) continue;
      // Landing square must be empty.
      if (board[landingPos.row][landingPos.col] !== null) continue;

      foundCapture = true;
      // Clone board for simulation.
      const newBoard = Checkers.cloneBoard(board);
      // Remove the captured piece.
      newBoard[enemyPos.row][enemyPos.col] = null;
      // Move piece to landing square.
      newBoard[landingPos.row][landingPos.col] = piece;
      newBoard[pos.row][pos.col] = null;
      // Build new move sequence.
      const newMove: CheckersMove = {
        from: moveSoFar.from,
        path: moveSoFar.path.concat([landingPos]),
        captures: moveSoFar.captures.concat([enemyPos]),
      };
      // Recursively check for further captures.
      const furtherCaptures = Checkers.getCapturesForPiece(
        newBoard,
        landingPos,
        piece,
        newMove
      );
      if (furtherCaptures.length > 0) {
        moves.push(...furtherCaptures);
      } else {
        moves.push(newMove);
      }
    }
    // If no capture was found but we already captured something, return the current sequence.
    if (!foundCapture && moveSoFar.captures.length > 0) {
      return [moveSoFar];
    }
    return moves;
  }

  /**
   * Generate simple (non-capturing) moves for a piece at position `pos` on the given board.
   */
  static getSimpleMovesForPiece(
    board: (Piece | null)[][],
    pos: Position,
    piece: Piece
  ): CheckersMove[] {
    const moves: CheckersMove[] = [];
    const directions = Checkers.getDirections(piece);
    for (const d of directions) {
      const target: Position = { row: pos.row + d[0], col: pos.col + d[1] };
      if (
        target.row < 0 ||
        target.row >= 8 ||
        target.col < 0 ||
        target.col >= 8
      )
        continue;
      if (board[target.row][target.col] === null) {
        moves.push({ from: pos, path: [target], captures: [] });
      }
    }
    return moves;
  }

  // --- Static Utility Methods for Move Generation and Minimax ---

  /**
   * Deep-clone a board (8x8 array).
   */
  static cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
    return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  }

  /**
   * Returns the allowed movement directions for a piece.
   * For a man: red moves upward (row decreases) and black moves downward (row increases).
   * Kings move in all four diagonal directions.
   */
  static getDirections(piece: Piece): number[][] {
    if (piece.type === "king") {
      return [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
    } else {
      return piece.color === "red"
        ? [
            [-1, -1],
            [-1, 1],
          ]
        : [
            [1, -1],
            [1, 1],
          ];
    }
  }

  /**
   * Returns a new board state after applying the given move.
   * This function does not modify the original board.
   */
  static updateBoard(
    board: (Piece | null)[][],
    move: CheckersMove
  ): (Piece | null)[][] {
    const newBoard = Checkers.cloneBoard(board);
    const piece = newBoard[move.from.row][move.from.col];
    if (!piece) return newBoard; // Should not happen if move is valid.
    // Remove piece from starting square.
    newBoard[move.from.row][move.from.col] = null;
    // Remove captured pieces.
    for (const cap of move.captures) {
      newBoard[cap.row][cap.col] = null;
    }
    // Final landing square.
    const finalPos = move.path[move.path.length - 1];
    const newPiece = { ...piece };
    // Promote if a man reaches the opponent’s baseline.
    if (newPiece.type === "man") {
      if (newPiece.color === "red" && finalPos.row === 0) {
        newPiece.type = "king";
      } else if (newPiece.color === "black" && finalPos.row === 7) {
        newPiece.type = "king";
      }
    }
    newBoard[finalPos.row][finalPos.col] = newPiece;
    return newBoard;
  }

  /**
   * Evaluate the board state from the perspective of the given player.
   * Positive values favor `perspective`, negative values favor the opponent.
   */
  static evaluateBoard(board: (Piece | null)[][], perspective: Color): number {
    let value = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const pieceVal = piece.type === "man" ? 10 : 50;
          if (piece.color === perspective) {
            value += pieceVal;
          } else {
            value -= pieceVal;
          }
        }
      }
    }
    return value;
  }

  /**
   * Helper: Shuffle an array (Fisher–Yates shuffle).
   */
  static shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Minimax algorithm (without alpha–beta pruning) to search for the best move.
   * @param board The board state to evaluate.
   * @param depth How many plies to search.
   * @param isMax Whether we are maximizing or minimizing.
   * @param turn Which color is to move on this board.
   * @param perspective The original player for whom we are evaluating.
   * @returns An object with a score and the best move found.
   */
  static minimax(
    board: (Piece | null)[][],
    depth: number,
    isMax: boolean,
    turn: Color,
    perspective: Color
  ): { score: number; move: CheckersMove | null } {
    const moves = Checkers.getAllowedMovesForBoard(board, turn);
    // Terminal condition: depth 0 or no available moves.
    if (depth === 0 || moves.length === 0) {
      return { score: Checkers.evaluateBoard(board, perspective), move: null };
    }

    // Shuffle moves for some randomness.
    const shuffledMoves = Checkers.shuffle(moves.slice());

    if (isMax) {
      let bestVal = -Infinity;
      let bestMove: CheckersMove | null = null;
      for (const move of shuffledMoves) {
        const newBoard = Checkers.updateBoard(board, move);
        const nextTurn: Color = turn === "red" ? "black" : "red";
        const result = Checkers.minimax(
          newBoard,
          depth - 1,
          false,
          nextTurn,
          perspective
        );
        if (result.score > bestVal) {
          bestVal = result.score;
          bestMove = move;
        }
      }
      return { score: bestVal, move: bestMove };
    } else {
      let bestVal = Infinity;
      let bestMove: CheckersMove | null = null;
      for (const move of shuffledMoves) {
        const newBoard = Checkers.updateBoard(board, move);
        const nextTurn: Color = turn === "red" ? "black" : "red";
        const result = Checkers.minimax(
          newBoard,
          depth - 1,
          true,
          nextTurn,
          perspective
        );
        if (result.score < bestVal) {
          bestVal = result.score;
          bestMove = move;
        }
      }
      return { score: bestVal, move: bestMove };
    }
  }

  /**
   * Helper: Compare two moves for equality.
   */
  static compareMoves(m1: CheckersMove, m2: CheckersMove): boolean {
    if (m1.from.row !== m2.from.row || m1.from.col !== m2.from.col)
      return false;
    if (m1.path.length !== m2.path.length) return false;
    for (let i = 0; i < m1.path.length; i++) {
      if (
        m1.path[i].row !== m2.path[i].row ||
        m1.path[i].col !== m2.path[i].col
      ) {
        return false;
      }
    }
    if (m1.captures.length !== m2.captures.length) return false;
    for (let i = 0; i < m1.captures.length; i++) {
      if (
        m1.captures[i].row !== m2.captures[i].row ||
        m1.captures[i].col !== m2.captures[i].col
      ) {
        return false;
      }
    }
    return true;
  }
}
