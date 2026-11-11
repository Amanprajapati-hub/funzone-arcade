
/**
 * Game 12: Nonogram Pixel Art
 * Reveal hidden pixel art using number clues.
 */
(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['nonogram-pixel-art'] = {
    id: 'nonogram-pixel-art',
    title: 'Nonogram Pixel Art',
    category: 'Puzzle',
    description: 'Decode number clues and reveal hidden pixel art!',
    instructions: 'Use the row and column clues to fill the correct cells. Mark empty cells with X. Reveal the complete pixel picture!',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    gameOverTimer: null,
    boundPointer: null,
    boundKey: null,

    isRunning: false,
    isPaused: false,

    size: 10,
    cellSize: 30,
    gridX: 85,
    gridY: 105,

    pattern: [],
    board: [],
    rowClues: [],
    colClues: [],

    selectedTool: 'fill',
    mistakes: 0,
    maxMistakes: 5,
    hints: 3,
    score: 0,
    elapsed: 0,
    message: 'SOLVE THE PIXEL PUZZLE',
    messageTimer: 0,
    finished: false,
    lastTime: 0,

    puzzle: [
      '00100100100',
      '01110101110',
      '11111111111',
      '11111111111',
      '01111111110',
      '00111111100',
      '00011111000',
      '00001110000',
      '00000100000',
      '00000000000',
      '00000000000'
    ],

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;

      this.canvas.width = 440;
      this.canvas.height = 540;

      this.gridX = 85;
      this.gridY = 105;
      this.cellSize = 30;

      this.canvas.style.touchAction = 'none';

      this.boundPointer = this.onPointerDown.bind(this);
      this.boundKey = this.onKeyDown.bind(this);

      this.canvas.addEventListener('pointerdown', this.boundPointer);
      window.addEventListener('keydown', this.boundKey);
    },

    getClues(line) {
      const clues = [];
      let count = 0;

      for (const value of line) {
        if (value === 1) {
          count++;
        } else if (count > 0) {
          clues.push(count);
          count = 0;
        }
      }

      if (count > 0) {
        clues.push(count);
      }

      return clues.length ? clues : [0];
    },

    createPuzzle() {
      const rows = this.puzzle.slice(0, this.size);

      this.pattern = rows.map(row =>
        row.slice(0, this.size).split('').map(Number)
      );

      this.board = Array.from(
        { length: this.size },
        () => Array(this.size).fill(0)
      );

      this.rowClues = this.pattern.map(row =>
        this.getClues(row)
      );

      this.colClues = Array.from(
        { length: this.size },
        (_, col) =>
          this.getClues(
            this.pattern.map(row => row[col])
          )
      );
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

      this.createPuzzle();

      this.selectedTool = 'fill';
      this.mistakes = 0;
      this.hints = 3;
      this.score = 0;
      this.elapsed = 0;
      this.finished = false;

      this.message = 'SOLVE THE PIXEL PUZZLE';
      this.messageTimer = 0;

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
        this.canvas.addEventListener(
          'pointerdown',
          this.boundPointer
        );
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
        this.canvas.removeEventListener(
          'pointerdown',
          this.boundPointer
        );
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
      if (!this.isRunning || this.isPaused || this.finished) return;

      e.preventDefault();

      const rect = this.canvas.getBoundingClientRect();

      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;

      const x = (e.clientX - rect.left) * sx;
      const y = (e.clientY - rect.top) * sy;

      // Grid interaction
      const gx = this.gridX;
      const gy = this.gridY;

      if (
        x >= gx &&
        x < gx + this.size * this.cellSize &&
        y >= gy &&
        y < gy + this.size * this.cellSize
      ) {
        const col = Math.floor(
          (x - gx) / this.cellSize
        );

        const row = Math.floor(
          (y - gy) / this.cellSize
        );

        this.handleCell(row, col);
        return;
      }

      // Tool buttons
      if (y >= 425 && y <= 465) {
        if (x >= 25 && x <= 195) {
          this.selectedTool = 'fill';
          this.showMessage('FILL TOOL SELECTED');
        } else if (x >= 215 && x <= 385) {
          this.selectedTool = 'mark';
          this.showMessage('MARK TOOL SELECTED');
        }

        return;
      }

      // Bottom buttons
      if (y >= 480 && y <= 520) {
        if (x >= 20 && x <= 145) {
          this.useHint();
        } else if (x >= 155 && x <= 280) {
          this.clearBoard();
        } else if (x >= 290 && x <= 420) {
          this.newGame();
        }
      }
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused || this.finished) return;

      const key = e.key.toLowerCase();

      if (key === 'f') {
        this.selectedTool = 'fill';
        this.showMessage('FILL TOOL SELECTED');
      } else if (key === 'x') {
        this.selectedTool = 'mark';
        this.showMessage('MARK TOOL SELECTED');
      }
    },

    handleCell(row, col) {
      if (
        row < 0 || row >= this.size ||
        col < 0 || col >= this.size
      ) {
        return;
      }

      const current = this.board[row][col];
      const correct = this.pattern[row][col];

      if (this.selectedTool === 'fill') {
        if (current === 1) return;

        if (correct === 1) {
          this.board[row][col] = 1;

          this.score += 10;

          this.callbacks.onScore(this.score);

          this.showMessage('CORRECT PIXEL! +10');
        } else {
          this.mistakes++;

          this.callbacks.onLives(
            Math.max(0, this.maxMistakes - this.mistakes)
          );

          this.showMessage('WRONG PIXEL!');

          if (this.mistakes >= this.maxMistakes) {
            this.endGame();
            return;
          }
        }
      } else {
        if (current === 1) return;

        this.board[row][col] =
          current === 2 ? 0 : 2;
      }

      if (this.checkWin()) {
        this.winGame();
      }
    },

    checkWin() {
      return this.board.every((row, r) =>
        row.every((cell, c) => {
          if (this.pattern[r][c] === 1) {
            return cell === 1;
          }

          return cell !== 1;
        })
      );
    },

    useHint() {
      if (this.finished) return;

      if (this.hints <= 0) {
        this.showMessage('NO HINTS LEFT!');
        return;
      }

      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (
            this.pattern[r][c] === 1 &&
            this.board[r][c] !== 1
          ) {
            this.board[r][c] = 1;

            this.hints--;

            this.score = Math.max(0, this.score - 10);

            this.callbacks.onScore(this.score);

            this.showMessage('HINT REVEALED!');

            if (this.checkWin()) {
              this.winGame();
            }

            return;
          }
        }
      }

      this.showMessage('NO MORE PIXELS TO REVEAL');
    },

    clearBoard() {
      if (this.finished) return;

      this.board = Array.from(
        { length: this.size },
        () => Array(this.size).fill(0)
      );

      // Prevent score and mistake farming
      this.score = 0;
      this.mistakes = 0;

      if (this.callbacks) {
        this.callbacks.onScore(0);
        this.callbacks.onLives(this.maxMistakes);
      }

      this.showMessage('BOARD CLEARED');
    },

    newGame() {
      if (this.finished) {
        this.finished = false;
      }

      this.reset();
      this.showMessage('NEW PIXEL PUZZLE READY');
    },

    winGame() {
      if (this.finished) return;

      this.finished = true;
      this.isRunning = false;

      const bonus = Math.max(
        0,
        300 - Math.floor(this.elapsed)
      );

      this.score += bonus;

      this.callbacks.onScore(this.score);

      this.showMessage('PIXEL ART COMPLETE!');

      this.gameOverTimer = setTimeout(() => {
        this.gameOverTimer = null;

        if (this.callbacks && this.finished) {
          this.callbacks.onGameOver(this.score);
        }
      }, 1200);
    },

    endGame() {
      if (this.finished) return;

      this.finished = true;
      this.isRunning = false;

      this.showMessage('PUZZLE FAILED!');

      this.gameOverTimer = setTimeout(() => {
        this.gameOverTimer = null;

        if (this.callbacks && this.finished) {
          this.callbacks.onGameOver(this.score);
        }
      }, 1000);
    },

    update(dt) {
      if (this.finished) return;

      this.elapsed += dt;

      if (this.messageTimer > 0) {
        this.messageTimer = Math.max(
          0,
          this.messageTimer - dt
        );
      }
    },

    draw() {
      const ctx = this.ctx;

      ctx.fillStyle = '#070b18';
      ctx.fillRect(0, 0, 440, 540);

      // Title
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 19px monospace';
      ctx.textAlign = 'center';

      ctx.fillText('NONOGRAM PIXEL ART', 220, 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';

      ctx.fillText('FOLLOW THE NUMBER CLUES', 220, 55);

      // Column clues
      for (let c = 0; c < this.size; c++) {
        const clues = this.colClues[c];

        const x =
          this.gridX + c * this.cellSize + 15;

        clues.forEach((value, index) => {
          ctx.fillStyle = '#00f0ff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';

          ctx.fillText(
            value,
            x,
            this.gridY - 8 -
              (clues.length - 1 - index) * 13
          );
        });
      }

      // Row clues
      for (let r = 0; r < this.size; r++) {
        const clues = this.rowClues[r];

        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';

        ctx.fillText(
          clues.join(' '),
          this.gridX - 10,
          this.gridY + r * this.cellSize + 19
        );
      }

      // Grid
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          const x =
            this.gridX + c * this.cellSize;

          const y =
            this.gridY + r * this.cellSize;

          const cell = this.board[r][c];

          ctx.fillStyle =
            cell === 1 ? '#00c8d9' : '#152238';

          ctx.fillRect(
            x + 1,
            y + 1,
            this.cellSize - 2,
            this.cellSize - 2
          );

          ctx.strokeStyle = '#40516a';
          ctx.lineWidth = 1;

          ctx.strokeRect(
            x,
            y,
            this.cellSize,
            this.cellSize
          );

          if (cell === 2) {
            ctx.strokeStyle = '#ff668c';
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x + 9, y + 9);
            ctx.lineTo(x + 21, y + 21);

            ctx.moveTo(x + 21, y + 9);
            ctx.lineTo(x + 9, y + 21);

            ctx.stroke();
          }
        }
      }

      // Tools
      const tools = [
        {
          x: 25,
          text: 'FILL (F)',
          active: this.selectedTool === 'fill'
        },
        {
          x: 215,
          text: 'MARK (X)',
          active: this.selectedTool === 'mark'
        }
      ];

      tools.forEach(tool => {
        ctx.fillStyle =
          tool.active ? '#087f91' : '#172a40';

        ctx.fillRect(tool.x, 425, 170, 40);

        ctx.strokeStyle = '#00f0ff';
        ctx.strokeRect(tool.x, 425, 170, 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';

        ctx.fillText(
          tool.text,
          tool.x + 85,
          450
        );
      });

      // Bottom buttons
      const buttons = [
        { x: 20, text: `HINT (${this.hints})` },
        { x: 155, text: 'CLEAR' },
        { x: 290, text: 'NEW GAME' }
      ];

      buttons.forEach(button => {
        ctx.fillStyle = '#172a40';

        ctx.fillRect(
          button.x,
          480,
          125,
          40
        );

        ctx.strokeStyle = '#00f0ff';

        ctx.strokeRect(
          button.x,
          480,
          125,
          40
        );

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';

        ctx.fillText(
          button.text,
          button.x + 62,
          504
        );
      });

      // Status
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';

      ctx.fillText(
        `MISTAKES: ${this.mistakes}/${this.maxMistakes}`,
        20,
        405
      );

      ctx.textAlign = 'right';

      ctx.fillText(
        `TIME: ${Math.floor(this.elapsed)}s`,
        420,
        405
      );

      // Message
      ctx.fillStyle = '#00f0ff';
      ctx.textAlign = 'center';
      ctx.font = '11px monospace';

      ctx.fillText(
        this.messageTimer > 0 || this.finished
          ? this.message
          : 'F = FILL  |  X = MARK',
        220,
        530
      );
    },

    loop() {
      if (!this.isRunning || this.isPaused) return;

      const now = performance.now();

      const dt = Math.min(
        (now - this.lastTime) / 1000,
        0.1
      );

      this.lastTime = now;

      this.update(dt);
      this.draw();

      this.animId = requestAnimationFrame(
        this.loop.bind(this)
      );
    }
  };
})();
