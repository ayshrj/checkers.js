# @ayshrj/checkers.js

[![npm](https://img.shields.io/npm/v/@ayshrj/checkers.js?color=blue)](https://www.npmjs.com/package/@ayshrj/checkers.js)
[![npm](https://img.shields.io/npm/dm/@ayshrj/checkers.js)](https://www.npmjs.com/package/@ayshrj/checkers.js)

**@ayshrj/checkers.js** is a TypeScript library for playing Checkers (Draughts) with AI and real-time state management. It provides:

- **Full Rules Enforcement**: Ensures valid moves, mandatory captures, and king promotions.
- **AI Support**: Minimax-based AI for strategic move recommendations.
- **Event-Driven Updates**: Uses an event system to notify state changes.
- **Typed Data Structures**: Full TypeScript support for safe and reliable development.

---

## Table of Contents

- [@ayshrj/checkers.js](#ayshrjcheckersjs)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Importing](#importing)
    - [Import (as ESM)](#import-as-esm)
    - [Import (as CommonJS)](#import-as-commonjs)
  - [Quick Start Example](#quick-start-example)
  - [Features](#features)
  - [API](#api)
    - [`Checkers` Class](#checkers-class)
      - [Methods](#methods)
      - [Event Handling](#event-handling)
      - [Type Definitions](#type-definitions)
  - [Example: React Integration](#example-react-integration)
  - [License](#license)

---

## Installation

```bash
npm install @ayshrj/checkers.js
```
or
```bash
yarn add @ayshrj/checkers.js
```

---

## Importing

### Import (as ESM)

```ts
import { Checkers } from '@ayshrj/checkers.js';
```

### Import (as CommonJS)

```ts
const { Checkers } = require('@ayshrj/checkers.js');
```

---

## Quick Start Example

```ts
import { Checkers } from '@ayshrj/checkers.js';

// Initialize a new game
const game = new Checkers();

game.on('stateChange', (state) => {
  console.log('New State:', state.boardStatus);
});

// Make first valid move
const moves = game.getCurrentState().allowedMoves;
if (moves.length > 0) {
  game.move(moves[0]);
}

// Get AI move suggestion and apply it
const best = game.bestMove(3);
if (best) game.move(best);
```

---

## Features

1. **Rules Enforcement**  
   - Ensures valid piece movement.
   - Implements forced captures where required.
   - Handles king promotions.

2. **AI Move Suggestions**  
   - Uses Minimax algorithm to provide best moves.
   - Adjustable depth for AI difficulty.

3. **Event-Driven Updates**  
   - Emits `stateChange` event after every move.
   - Helps in real-time UI updates.

4. **Typed Data Structures**  
   - TypeScript definitions for all game elements.

---

## API

### `Checkers` Class

#### Methods

- **`reset()`**: Resets the game state to the initial configuration.
- **`move(move: CheckersMove)`**: Executes a validated move.
- **`bestMove(depth: number)`**: Returns the best AI move using Minimax.
- **`getCurrentState()`**: Returns the current game state, including allowed moves and board setup.

#### Event Handling

- **`stateChange`**: Triggered after every valid move with the updated game state.
  ```ts
  game.on('stateChange', (state) => {
    console.log(state);
  });
  ```

#### Type Definitions

- **`CheckersGameState`**: Represents the full game state, including the board, turn, and available moves.
- **`CheckersMove`**: Defines a validated move with piece positions.
- **`Piece`/`Position`**: Represents board components.

---

## Example: React Integration

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { Checkers, CheckersMove, Piece } from "@ayshrj/checkers.js";

interface Position {
  row: number;
  col: number;
}

const CheckerPage = () => {
  const [checkers, setCheckers] = useState(new Checkers());
  const [board, setBoard] = useState<(Piece | null)[][]>(
    checkers.getCurrentState().board
  );
  const [difficulty, setDifficulty] = useState<2 | 4 | 6>(4);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<CheckersMove[]>([]);
  const [gameStatus, setGameStatus] = useState<string>("Red to move");
  const [botThinking, setBotThinking] = useState(false);
  const [gameMode, setGameMode] = useState<"bot" | "human" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateBoard = () => {
    setBoard(checkers.getCurrentState().board.map((row) => [...row]));
    updateGameStatus();
  };

  const updateGameStatus = () => {
    const allowedMoves = checkers.getCurrentState().allowedMoves;
    if (allowedMoves.length === 0) {
      const winner =
        checkers.getCurrentState().turn === "red"
          ? gameMode === "bot"
            ? "Green"
            : "Black"
          : "Red";
      setGameStatus(`Game over! ${winner} wins!`);
    } else {
      setGameStatus(
        `${
          checkers.getCurrentState().turn.charAt(0).toUpperCase() +
          checkers.getCurrentState().turn.slice(1)
        } to move`
      );
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (
      botThinking ||
      (gameMode === "bot" && checkers.getCurrentState().turn === "black")
    )
      return;

    const piece = board[row][col];
    if (!selectedPos) {
      if (piece && piece.color === checkers.getCurrentState().turn) {
        setSelectedPos({ row, col });
        const allowedMoves = checkers.getCurrentState().allowedMoves;
        const pieceMoves = allowedMoves.filter(
          (move) => move.from.row === row && move.from.col === col
        );
        setValidMoves(pieceMoves);
      }
    } else {
      const move = validMoves.find((m) => {
        const final = m.path[m.path.length - 1];
        return final.row === row && final.col === col;
      });
      if (move) {
        const moveSuccess = checkers.move(move);
        if (moveSuccess) {
          updateBoard();
          setSelectedPos(null);
          setValidMoves([]);
        }
      } else {
        if (piece && piece.color === checkers.getCurrentState().turn) {
          setSelectedPos({ row, col });
          const allowedMoves = checkers.getCurrentState().allowedMoves;
          const pieceMoves = allowedMoves.filter(
            (move) => move.from.row === row && move.from.col === col
          );
          setValidMoves(pieceMoves);
        } else {
          setSelectedPos(null);
          setValidMoves([]);
        }
      }
    }
  };

  useEffect(() => {
    if (gameMode === "bot" && checkers.getCurrentState().turn === "black") {
      setBotThinking(true);
      setTimeout(() => {
        const best = checkers.bestMove(difficulty);
        if (best) {
          checkers.move(best);
          updateBoard();
        }
        setBotThinking(false);
      }, 500);
    }
  }, [board, gameMode, difficulty]);

  const startNewMatch = (mode: "bot" | "human") => {
    const newCheckers = new Checkers();
    setCheckers(newCheckers);
    setBoard(newCheckers.getCurrentState().board.map((row) => [...row]));
    setSelectedPos(null);
    setValidMoves([]);
    setGameStatus(
      `${
        newCheckers.getCurrentState().turn.charAt(0).toUpperCase() +
        newCheckers.getCurrentState().turn.slice(1)
      } to move`
    );
    setGameMode(mode);
    setIsModalOpen(false);
  };

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
        height: "100vh",
      }}
    >
      {/* Game Status */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "500" }}>
            {gameMode === "bot"
              ? gameStatus.replace("Black", "Green").replace("black", "green")
              : gameStatus}
            {botThinking && (
              <span style={{ color: "#0000FF", marginLeft: "8px" }}>
                Bot is thinking...
              </span>
            )}
          </div>
        </div>
        {/* Board */}
        <div
          style={{
            width: "100%",
            aspectRatio: "1/1",
            backgroundColor: "#f0f0f0",
            borderRadius: "8px",
            position: "relative",
          }}
        >
          {/* Files (columns) */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              display: "flex",
              justifyContent: "space-around",
              padding: "0 16px",
            }}
          >
            {["a", "b", "c", "d", "e", "f", "g", "h"].map((file) => (
              <div key={file} style={{ fontSize: "12px", opacity: "0.7" }}>
                {file}
              </div>
            ))}
          </div>
          {/* Ranks (rows) */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              alignItems: "center",
              padding: "16px 0",
            }}
          >
            {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
              <div key={rank} style={{ fontSize: "12px", opacity: "0.7" }}>
                {rank}
              </div>
            ))}
          </div>
          {/* Render the board grid */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              padding: "16px",
              gridTemplateColumns: "repeat(8, 1fr)",
              gridTemplateRows: "repeat(8, 1fr)",
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((col, colIndex) => {
                const isDarkSquare = (rowIndex + colIndex) % 2 === 1;
                const isSelected =
                  selectedPos &&
                  selectedPos.row === rowIndex &&
                  selectedPos.col === colIndex;
                const isValidMove = validMoves.some((move) => {
                  const final = move.path[move.path.length - 1];
                  return final.row === rowIndex && final.col === colIndex;
                });
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderBottom: "1px solid #ccc",
                      borderRight: "1px solid #ccc",
                      backgroundColor: isDarkSquare ? "#e0e0e0" : "#f8f8f8",
                      border: isSelected ? "4px solid #0000FF" : "none",
                      position: "relative",
                      ...(isValidMove ? { backgroundColor: "#00FF0030" } : {}),
                    }}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {col && (
                        <div
                          style={{
                            borderRadius: "50%",
                            height: "60%",
                            width: "60%",
                            backgroundColor:
                              col.color === "black" ? "#00FF00" : "#FF0000",
                            position: "absolute",
                          }}
                        >
                          {col.type === "king" && (
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                height: "50%",
                                width: "50%",
                                backgroundColor: "white",
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
        }}
      >
        {gameMode === "bot" && (
          <div
            style={{
              display: "flex",
              width: "100%",
              gap: "8px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {[
              { value: 2, label: "Easy" },
              { value: 4, label: "Medium" },
              { value: 6, label: "Hard" },
            ].map(({ value, label }) => (
              <button
                key={value}
                style={{
                  ...buttonStyle,
                  width: "33%",
                  backgroundColor: value === difficulty ? "#00FF00" : "#ccc",
                  color: value === difficulty ? "white" : "black",
                }}
                onClick={() => setDifficulty(value as 2 | 4 | 6)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#0000FF",
            color: "white",
            width: "100%",
          }}
          onClick={() => setIsModalOpen(true)}
        >
          Reset
        </button>
      </div>

      {/* Initial Game Mode Selection Modal */}
      {gameMode === null && (
        <div style={modalStyle}>
          <h2 style={{ marginBottom: "16px" }}>Select Game Mode</h2>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: "16px",
            }}
          >
            <button
              style={{
                ...buttonStyle,
                width: "50%",
                backgroundColor: "#00FF00",
                color: "white",
              }}
              onClick={() => startNewMatch("bot")}
            >
              Vs Bot
            </button>
            <button
              style={{
                ...buttonStyle,
                width: "50%",
                backgroundColor: "#00FF00",
                color: "white",
              }}
              onClick={() => startNewMatch("human")}
            >
              Vs Human
            </button>
          </div>
        </div>
      )}

      {/* Reset Game Mode Modal */}
      {isModalOpen && (
        <div style={modalStyle}>
          <h2 style={{ marginBottom: "16px" }}>Reset Game</h2>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: "16px",
            }}
          >
            <button
              style={{
                ...buttonStyle,
                width: "50%",
                backgroundColor: "#00FF00",
                color: "white",
              }}
              onClick={() => startNewMatch("bot")}
            >
              Vs Bot
            </button>
            <button
              style={{
                ...buttonStyle,
                width: "50%",
                backgroundColor: "#00FF00",
                color: "white",
              }}
              onClick={() => startNewMatch("human")}
            >
              Vs Human
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckerPage;
```

---

## License

MIT - Free for commercial and personal use.