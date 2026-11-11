/**
 * Game 11: Sudoku Master
 * 9x9 Number Logic Puzzle
 */
(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['sudoku-master'] = {
    id: 'sudoku-master',
    title: 'Sudoku Master',
    category: 'Puzzle',
    description: 'Challenge your brain! Complete the 9x9 Sudoku grid using logic and number skills.',
    instructions: 'Select an empty cell, then choose a number from 1 to 9. Fill every row, column and 3x3 box without repeating numbers.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    board: [],
    solution: [],
    selected: null,
    mistakes: 0,
    maxMistakes: 5,
    score: 0,
    hints: 3,
    elapsed: 0,
    difficulty: 'Easy',
    message: 'SELECT A CELL TO BEGIN',
    messageTimer: 0,
    gameFinished: false,
    lastTime: 0,
    gameOverTimer: null,

    cellSize: 40,
    gridX: 20,
    gridY: 75,

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;

      this.canvas.width = 400;
      this.canvas.height = 540;

      this.boundPointer = this.onPointerDown.bind(this);
      this.boundKey = this.onKeyDown.bind(this);

      this.canvas.addEventListener('pointerdown', this.boundPointer);
      window.addEventListener('keydown', this.boundKey);

    },

    generateSolvedBoard() {
      const base = 3;
      const side = 9;

      const pattern = (r, c) =>
        (base * (r % base) + Math.floor(r / base) + c) % side;

      const shuffle = (array) => {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
      };

      const rows = shuffle([0, 1, 2])
        .flatMap(group => shuffle([0, 1, 2]).map(r => group * 3 + r));

      const cols = shuffle([0, 1, 2])
        .flatMap(group => shuffle([0, 1, 2]).map(c => group * 3 + c));

      const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      return rows.map(r =>
        cols.map(c => numbers[pattern(r, c)])
      );
    },

    
generatePuzzle() {
  this.solution = this.generateSolvedBoard();

  this.board = this.solution.map(row =>
    row.map(value => ({
      value,
      fixed: true,
      error: false
    }))
  );

  const difficultySettings = {
    Easy: 38,
    Medium: 48,
    Hard: 56
  };

  const removeCount = difficultySettings[this.difficulty] || 38;

  // Create a shuffled list of all cell positions
  const positions = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push({ r, c });
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Count possible solutions, stopping after finding 2
  const countSolutions = (grid) => {
    let bestRow = -1;
    let bestCol = -1;
    let bestCandidates = null;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== 0) continue;

        const candidates = [];

        for (let num = 1; num <= 9; num++) {
          let valid = true;

          for (let i = 0; i < 9; i++) {
            if (grid[r][i] === num || grid[i][c] === num) {
              valid = false;
              break;
            }
          }

          const boxRow = Math.floor(r / 3) * 3;
          const boxCol = Math.floor(c / 3) * 3;

          for (let br = boxRow; br < boxRow + 3; br++) {
            for (let bc = boxCol; bc < boxCol + 3; bc++) {
              if (grid[br][bc] === num) valid = false;
            }
          }

          if (valid) candidates.push(num);
        }

        if (candidates.length === 0) return 0;

        if (
          bestCandidates === null ||
          candidates.length < bestCandidates.length
        ) {
          bestRow = r;
          bestCol = c;
          bestCandidates = candidates;
        }

        if (bestCandidates.length === 1) break;
      }

      if (bestCandidates && bestCandidates.length === 1) break;
    }

    if (bestRow === -1) return 1;

    let total = 0;

    for (const num of bestCandidates) {
      grid[bestRow][bestCol] = num;

      total += countSolutions(grid);

      grid[bestRow][bestCol] = 0;

      if (total >= 2) return 2;
    }

    return total;
  };

  let removed = 0;

  for (const position of positions) {
    if (removed >= removeCount) break;

    const { r, c } = position;
    const originalValue = this.board[r][c].value;

    this.board[r][c].value = 0;

    const testGrid = this.board.map(row =>
      row.map(cell => cell.value)
    );

    if (countSolutions(testGrid) === 1) {
      this.board[r][c].fixed = false;
      removed++;
    } else {
      this.board[r][c].value = originalValue;
    }
  }
},


    start() {
      this.isRunning = true;
      this.isPaused = false;
      this.reset();
      this.lastTime = performance.now();
      this.loop();
    },

    reset() {
  if (this.gameOverTimer) {
    clearTimeout(this.gameOverTimer);
    this.gameOverTimer = null;
  }

  this.generatePuzzle();

  this.selected = null;
  this.mistakes = 0;
  this.score = 0;
  this.hints = 3;
  this.elapsed = 0;
  this.message = 'SELECT A CELL TO BEGIN';
  this.messageTimer = 0;
  this.gameFinished = false;

  if (this.callbacks) {
    this.callbacks.onScore(0);
    this.callbacks.onLives(this.maxMistakes);
  }
},

    pause() {
      this.isPaused = true;
    },

    resume() {
      if (this.isRunning && this.isPaused) {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.loop();
      }
    },

    restart() {
      this.destroy();

      if (this.canvas && this.boundPointer) {
        this.canvas.addEventListener('pointerdown', this.boundPointer);
      }

      if (this.boundKey) {
        window.addEventListener('keydown', this.boundKey);
      }

      this.start();
    },

    destroy() {
  this.isRunning = false;

  if (this.animId) {
    cancelAnimationFrame(this.animId);
    this.animId = null;
  }

  if (this.gameOverTimer) {
    clearTimeout(this.gameOverTimer);
    this.gameOverTimer = null;
  }

  if (this.canvas && this.boundPointer) {
    this.canvas.removeEventListener('pointerdown', this.boundPointer);
  }

  if (this.boundKey) {
    window.removeEventListener('keydown', this.boundKey);
  }
},

    showMessage(message) {
      this.message = message;
      this.messageTimer = 2;
    },

    onPointerDown(e) {
      if (!this.isRunning || this.isPaused || this.gameFinished) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Difficulty buttons
      if (y >= 35 && y <= 65) {
        if (x >= 15 && x <= 125) this.changeDifficulty('Easy');
        else if (x >= 145 && x <= 255) this.changeDifficulty('Medium');
        else if (x >= 275 && x <= 385) this.changeDifficulty('Hard');
        return;
      }

      // Sudoku grid
      if (
        x >= this.gridX &&
        x < this.gridX + 360 &&
        y >= this.gridY &&
        y < this.gridY + 360
      ) {
        const col = Math.floor((x - this.gridX) / this.cellSize);
        const row = Math.floor((y - this.gridY) / this.cellSize);

        this.selected = { row, col };
        this.showMessage('CHOOSE A NUMBER BELOW');
        return;
      }

      // Number buttons
      if (y >= 450 && y <= 490) {
        const number = Math.floor((x - 20) / 40) + 1;

        if (number >= 1 && number <= 9 && x >= 20 && x < 380) {
          this.enterNumber(number);
        }
        return;
      }

      // Bottom controls
      if (y >= 500 && y <= 530) {
        if (x < 135) this.useHint();
        else if (x < 270) this.clearCell();
        else this.newGame();
      }
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused || this.gameFinished) return;

      if (/^[1-9]$/.test(e.key)) {
        this.enterNumber(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        this.clearCell();
      } else if (this.selected) {
        const { row, col } = this.selected;

        if (e.key === 'ArrowUp') this.selected.row = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') this.selected.row = Math.min(8, row + 1);
        if (e.key === 'ArrowLeft') this.selected.col = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') this.selected.col = Math.min(8, col + 1);
      }
    },

    changeDifficulty(level) {
      if (this.difficulty === level) return;

      this.difficulty = level;
      this.newGame();
    },

    isMoveValid(number, row, col) {
  // Check the selected row
  for (let c = 0; c < 9; c++) {
    if (c !== col && this.board[row][c].value === number) {
      return false;
    }
  }

  // Check the selected column
  for (let r = 0; r < 9; r++) {
    if (r !== row && this.board[r][col].value === number) {
      return false;
    }
  }

  // Check the 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (
        (r !== row || c !== col) &&
        this.board[r][c].value === number
      ) {
        return false;
      }
    }
  }

  return true;
},

    enterNumber(number) {
  if (!this.selected || this.gameFinished) return;

  const { row, col } = this.selected;
  const cell = this.board[row][col];

  if (cell.fixed) {
    this.showMessage('THIS CELL CANNOT BE CHANGED');
    return;
  }

  if (cell.value === number) return;

  // Check Sudoku row, column and 3x3 box rules
  if (!this.isMoveValid(number, row, col)) {
    this.mistakes++;
    this.score = Math.max(0, this.score - 5);

    this.callbacks.onScore(this.score);
    this.callbacks.onLives(this.maxMistakes - this.mistakes);

    this.showMessage('NUMBER ALREADY IN ROW/COLUMN/BOX');

    if (this.mistakes >= this.maxMistakes) {
      this.endGame();
    }
    return;
  }

  if (number === this.solution[row][col]) {
    cell.value = number;
    cell.error = false;

    this.score += 10;
    this.callbacks.onScore(this.score);

    this.showMessage('CORRECT! +10 POINTS');

    if (this.isPuzzleComplete()) {
      this.winGame();
    }
  } else {
    this.mistakes++;
    this.score = Math.max(0, this.score - 5);

    this.callbacks.onScore(this.score);
    this.callbacks.onLives(this.maxMistakes - this.mistakes);

    this.showMessage('WRONG NUMBER! TRY AGAIN');

    if (this.mistakes >= this.maxMistakes) {
      this.endGame();
    }
  }
},

    clearCell() {
      if (!this.selected || this.gameFinished) return;

      const { row, col } = this.selected;
      const cell = this.board[row][col];

      if (!cell.fixed) {
        cell.value = 0;
        cell.error = false;
        this.showMessage('CELL CLEARED');
      }
    },

    useHint() {
      if (!this.selected || this.gameFinished) {
        this.showMessage('SELECT AN EMPTY CELL FIRST');
        return;
      }

      if (this.hints <= 0) {
        this.showMessage('NO HINTS LEFT!');
        return;
      }

      const { row, col } = this.selected;
      const cell = this.board[row][col];

      if (cell.fixed || cell.value !== 0) {
        this.showMessage('SELECT AN EMPTY CELL');
        return;
      }

      cell.value = this.solution[row][col];
      cell.error = false;

      this.hints--;
      this.score = Math.max(0, this.score - 10);

      this.callbacks.onScore(this.score);
      this.showMessage('HINT USED!');

      if (this.isPuzzleComplete()) {
        this.winGame();
      }
    },

    newGame() {
      this.reset();
      this.showMessage('NEW PUZZLE READY!');
    },

    isPuzzleComplete() {
      return this.board.every((row, r) =>
        row.every((cell, c) =>
          cell.value === this.solution[r][c]
        )
      );
    },

    winGame() {
  if (this.gameFinished) return;

  this.gameFinished = true;
  this.isRunning = false;

  const timeBonus = Math.max(0, 500 - Math.floor(this.elapsed) * 2);
  this.score += timeBonus;

  this.callbacks.onScore(this.score);
  this.showMessage('SUDOKU MASTER! YOU WIN!');

  this.gameOverTimer = setTimeout(() => {
    this.gameOverTimer = null;

    if (this.callbacks) {
      this.callbacks.onGameOver(this.score);
    }
  }, 1500);
},

    endGame() {
  if (this.gameFinished) return;

  this.gameFinished = true;
  this.isRunning = false;

  this.showMessage('GAME OVER! TRY AGAIN');

  this.gameOverTimer = setTimeout(() => {
    this.gameOverTimer = null;

    if (this.callbacks) {
      this.callbacks.onGameOver(this.score);
    }
  }, 1000);
},

    update(dt) {
      if (this.gameFinished) return;

      this.elapsed += dt;

      if (this.messageTimer > 0) {
        this.messageTimer -= dt;
      }
    },

    draw() {
      const ctx = this.ctx;

      ctx.fillStyle = '#070b18';
      ctx.fillRect(0, 0, 400, 540);

      // Title
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 21px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUDOKU MASTER', 200, 25);

      // Difficulty buttons
      const levels = ['Easy', 'Medium', 'Hard'];
      const positions = [15, 145, 275];

      levels.forEach((level, i) => {
        ctx.fillStyle = this.difficulty === level ? '#00b8c8' : '#172338';
        ctx.fillRect(positions[i], 38, 110, 25);

        ctx.strokeStyle = '#00f0ff';
        ctx.strokeRect(positions[i], 38, 110, 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(level.toUpperCase(), positions[i] + 55, 55);
      });

      // Grid background
      ctx.fillStyle = '#111c30';
      ctx.fillRect(this.gridX, this.gridY, 360, 360);

      const selected = this.selected;

      // Cell backgrounds and numbers
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const x = this.gridX + c * this.cellSize;
          const y = this.gridY + r * this.cellSize;
          const cell = this.board[r][c];

          let fill = '#101a2c';

          if (
            selected &&
            (selected.row === r || selected.col === c)
          ) {
            fill = '#1b3047';
          }

          if (selected && selected.row === r && selected.col === c) {
            fill = '#15546a';
          }

          if (
  selected &&
  cell.value !== 0 &&
  this.board[selected.row][selected.col].value !== 0 &&
  cell.value === this.board[selected.row][selected.col].value
) {
  fill = '#214253';
}

          ctx.fillStyle = fill;
          ctx.fillRect(x + 1, y + 1, 38, 38);

          if (cell.value !== 0) {
            ctx.fillStyle = cell.fixed ? '#e2e8f0' : '#00f0ff';
            ctx.font = cell.fixed ? 'bold 19px monospace' : '19px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell.value, x + 20, y + 20);
          }
        }
      }

      // Grid lines
      for (let i = 0; i <= 9; i++) {
        ctx.beginPath();
        ctx.moveTo(this.gridX + i * 40, this.gridY);
        ctx.lineTo(this.gridX + i * 40, this.gridY + 360);

        ctx.moveTo(this.gridX, this.gridY + i * 40);
        ctx.lineTo(this.gridX + 360, this.gridY + i * 40);

        ctx.strokeStyle = i % 3 === 0 ? '#00f0ff' : '#34445d';
        ctx.lineWidth = i % 3 === 0 ? 2.5 : 0.7;
        ctx.stroke();
      }

      // Number selection
      for (let n = 1; n <= 9; n++) {
        const x = 20 + (n - 1) * 40;

        ctx.fillStyle = '#172a40';
        ctx.fillRect(x, 450, 36, 38);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 450, 36, 38);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 17px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n, x + 18, 469);
      }

      // Bottom controls
      const buttons = [
        { x: 10, text: `HINT (${this.hints})` },
        { x: 145, text: 'CLEAR' },
        { x: 270, text: 'NEW GAME' }
      ];

      buttons.forEach(button => {
        ctx.fillStyle = '#172a40';
        ctx.fillRect(button.x, 500, 120, 28);

        ctx.strokeStyle = '#00f0ff';
        ctx.strokeRect(button.x, 500, 120, 28);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(button.text, button.x + 60, 514);
      });

      // Status and score
      // Status and message area
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const showCurrentMessage =
  this.messageTimer > 0 || this.gameFinished;

ctx.fillStyle = showCurrentMessage ? '#00f0ff' : '#94a3b8';
ctx.font = '9px monospace';

const statusText =
  `MISTAKES: ${this.mistakes}/${this.maxMistakes}  |  TIME: ${Math.floor(this.elapsed)}s`;

ctx.fillText(
  showCurrentMessage ? this.message : statusText,
  200,
  442
);

    },
    loop() {
      if (!this.isRunning || this.isPaused) return;

      const now = performance.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      this.update(dt);
      this.draw();

      this.animId = requestAnimationFrame(this.loop.bind(this));
    }
  };
})();