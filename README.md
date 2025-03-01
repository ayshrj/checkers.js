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
import { Checkers, CheckersGameState } from '@ayshrj/checkers.js';

function CheckersBoard() {
  const [game] = useState(new Checkers());
  const [state, setState] = useState<CheckersGameState>(game.getCurrentState());

  useEffect(() => {
    game.on('stateChange', setState);
    return () => game.removeAllListeners();
  }, [game]);

  return (
    <div className="board">
      {state.board.map((row, i) => (
        <div key={i} className="row">
          {row.map((piece, j) => (
            <div key={`${i}-${j}`} className="cell">
              {piece && <div className={`piece ${piece.color}`} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## License

MIT - Free for commercial and personal use.