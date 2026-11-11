
/**
 * Game: Lights Out
 * Switch every light off to complete the puzzle.
 */
(function () {
  'use strict';

  const WIDTH = 400;
  const HEIGHT = 540;
  const SIZE = 5;
  const CELL = 58;
  const GRID_X = 55;
  const GRID_Y = 105;

  const COLORS = {
    background: '#090d18',
    panel: '#111a2b',
    grid: '#26364c',
    text: '#e8f4ff',
    muted: '#8294ad',
    accent: '#00e5ff',
    lit: '#00d9ff',
    litGlow: 'rgba(0,229,255,0.22)',
    off: '#18283c',
    success: '#16c784',
    selected: '#ffffff'
  };

  const DIFFICULTIES = {
    easy: { moves: 7, label: 'EASY' },
    medium: { moves: 15, label: 'MEDIUM' },
    hard: { moves: 25, label: 'HARD' }
  };

  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['lights-out'] = {

    id: 'lights-out',
    title: 'Lights Out',
    category: 'Puzzle',
    description: 'Switch off every light to solve the puzzle!',
    instructions: 'Click a tile to toggle it and its four adjacent tiles. Turn off every light to win!',

    canvas: null,
    ctx: null,
    callbacks: null,
    animationId: null,

    isRunning: false,
    isPaused: false,
    finished: false,

    board: [],
    selectedRow: 2,
    selectedCol: 2,

    difficulty: 'easy',
    moves: 0,
    score: 0,

    startTime: 0,
    elapsedSeconds: 0,
    gameOverTimer: null,

    pointerDownHandler: null,
    keyHandler: null,

    init(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;

      this.canvas.width = WIDTH;
      this.canvas.height = HEIGHT;
      this.canvas.style.touchAction = 'none';

      this.pointerDownHandler =
        this.onPointerDown.bind(this);

      this.keyHandler =
        this.onKeyDown.bind(this);

      this.canvas.addEventListener(
        'pointerdown',
        this.pointerDownHandler
      );

      window.addEventListener(
        'keydown',
        this.keyHandler
      );

      this.reset();
    },

    start() {
      this.isRunning = true;
      this.isPaused = false;
      this.startTime = Date.now() -
        this.elapsedSeconds * 1000;

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }

      this.loop();
    },

    loop() {
      if (!this.isRunning || this.isPaused) return;

      if (!this.finished) {
        this.elapsedSeconds = Math.floor(
          (Date.now() - this.startTime) / 1000
        );
      }

      this.draw();

      this.animationId =
        requestAnimationFrame(this.loop.bind(this));
    },

    reset() {
      if (this.gameOverTimer) {
        clearTimeout(this.gameOverTimer);
        this.gameOverTimer = null;
      }

      this.board = [];

      for (let row = 0; row < SIZE; row++) {
        this.board.push(
          Array(SIZE).fill(false)
        );
      }

      this.moves = 0;
      this.score = 0;
      this.elapsedSeconds = 0;
      this.finished = false;
      this.isPaused = false;

      this.selectedRow = 2;
      this.selectedCol = 2;

      this.startTime = Date.now();

      this.generatePuzzle();

      if (this.callbacks) {
        this.callbacks.onScore(0);
        this.callbacks.onLives(0);
      }

      this.draw();
    },

    generatePuzzle() {
      // Begin with every light switched off.
      this.board = Array.from(
        { length: SIZE },
        () => Array(SIZE).fill(false)
      );

      const scrambleMoves =
        DIFFICULTIES[this.difficulty].moves;

      // Apply random valid moves to create
      // a puzzle that always has a solution.
      for (let i = 0; i < scrambleMoves; i++) {
        const row = Math.floor(
          Math.random() * SIZE
        );

        const col = Math.floor(
          Math.random() * SIZE
        );

        this.toggleLights(row, col);
      }

      // Avoid an already completed puzzle.
      if (this.isBoardComplete()) {
        this.toggleLights(2, 2);
      }
    },

    toggleLights(row, col) {
      const positions = [
        [row, col],
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
      ];

      positions.forEach(([r, c]) => {
        if (
          r >= 0 &&
          r < SIZE &&
          c >= 0 &&
          c < SIZE
        ) {
          this.board[r][c] =
            !this.board[r][c];
        }
      });
    },

    isBoardComplete() {
      return this.board.every(row =>
        row.every(light => !light)
      );
    },

    countLights() {
      return this.board.reduce(
        (total, row) =>
          total + row.filter(Boolean).length,
        0
      );
    },

    selectDifficulty(level) {
      if (
        !DIFFICULTIES[level] ||
        !this.isRunning ||
        this.isPaused ||
        this.finished
      ) {
        return;
      }

      this.difficulty = level;
      this.reset();
    },

    handleTileClick(row, col) {
      if (
        !this.isRunning ||
        this.isPaused ||
        this.finished
      ) {
        return;
      }

      this.selectedRow = row;
      this.selectedCol = col;

      this.toggleLights(row, col);
      this.moves++;

      this.score = Math.max(
        0,
        1000 - this.moves * 15 -
        this.elapsedSeconds * 3
      );

      if (this.callbacks) {
        this.callbacks.onScore(this.score);
      }

      if (this.isBoardComplete()) {
        this.winGame();
        return;
      }

      this.draw();
    },

    pause() {
      this.isPaused = true;

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    },

    resume() {
      if (this.isRunning && this.isPaused) {
        this.isPaused = false;

        this.startTime =
          Date.now() - this.elapsedSeconds * 1000;

        this.loop();
      }
    },

    restart() {
      this.destroy();

      if (this.canvas && this.pointerDownHandler) {
        this.canvas.addEventListener(
          'pointerdown',
          this.pointerDownHandler
        );
      }

      if (this.keyHandler) {
        window.addEventListener(
          'keydown',
          this.keyHandler
        );
      }

      this.reset();
      this.start();
    },

    destroy() {
      this.isRunning = false;
      this.isPaused = false;

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      if (this.gameOverTimer) {
        clearTimeout(this.gameOverTimer);
        this.gameOverTimer = null;
      }

      if (this.canvas && this.pointerDownHandler) {
        this.canvas.removeEventListener(
          'pointerdown',
          this.pointerDownHandler
        );
      }

      if (this.keyHandler) {
        window.removeEventListener(
          'keydown',
          this.keyHandler
        );
      }
    },

    getPointerPosition(e) {
      const rect = this.canvas.getBoundingClientRect();

      return {
        x: (e.clientX - rect.left) *
          (WIDTH / rect.width),

        y: (e.clientY - rect.top) *
          (HEIGHT / rect.height)
      };
    },

    onPointerDown(e) {
      if (
        !this.isRunning ||
        this.isPaused ||
        this.finished
      ) {
        return;
      }

      e.preventDefault();

      const position = this.getPointerPosition(e);
      const x = position.x;
      const y = position.y;

      // Difficulty buttons
      if (y >= 425 && y <= 463) {
        if (x >= 25 && x <= 135) {
          this.selectDifficulty('easy');
          return;
        }

        if (x >= 145 && x <= 255) {
          this.selectDifficulty('medium');
          return;
        }

        if (x >= 265 && x <= 375) {
          this.selectDifficulty('hard');
          return;
        }
      }

      // Restart button
      if (
        y >= 485 &&
        y <= 525 &&
        x >= 110 &&
        x <= 290
      ) {
        this.reset();
        return;
      }

      // Game grid
      const col = Math.floor(
        (x - GRID_X) / CELL
      );

      const row = Math.floor(
        (y - GRID_Y) / CELL
      );

      if (
        row < 0 ||
        row >= SIZE ||
        col < 0 ||
        col >= SIZE
      ) {
        return;
      }

      this.handleTileClick(row, col);
    },

    onKeyDown(e) {
      if (
        !this.isRunning ||
        this.isPaused ||
        this.finished
      ) {
        return;
      }

      let handled = true;

      switch (e.key) {
        case 'ArrowUp':
          this.selectedRow = Math.max(
            0,
            this.selectedRow - 1
          );
          break;

        case 'ArrowDown':
          this.selectedRow = Math.min(
            SIZE - 1,
            this.selectedRow + 1
          );
          break;

        case 'ArrowLeft':
          this.selectedCol = Math.max(
            0,
            this.selectedCol - 1
          );
          break;

        case 'ArrowRight':
          this.selectedCol = Math.min(
            SIZE - 1,
            this.selectedCol + 1
          );
          break;

        case 'Enter':
        case ' ':
          this.handleTileClick(
            this.selectedRow,
            this.selectedCol
          );
          break;

        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        this.draw();
      }
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remaining = seconds % 60;

      return (
        String(minutes).padStart(2, '0') +
        ':' +
        String(remaining).padStart(2, '0')
      );
    },

    winGame() {
      if (this.finished) return;

      this.finished = true;
      this.isRunning = false;

      const timeBonus = Math.max(
        0,
        300 - this.elapsedSeconds * 3
      );

      this.score += timeBonus;

      if (this.callbacks) {
        this.callbacks.onScore(this.score);
      }

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      this.draw();

      this.gameOverTimer = setTimeout(() => {
        this.gameOverTimer = null;

        if (this.callbacks) {
          this.callbacks.onGameOver(this.score);
        }
      }, 1200);
    },

    drawRoundedRect(
      x,
      y,
      width,
      height,
      radius,
      color
    ) {
      const ctx = this.ctx;

      ctx.fillStyle = color;
      ctx.beginPath();

      ctx.roundRect(
        x,
        y,
        width,
        height,
        radius
      );

      ctx.fill();
    },

    drawTile(row, col) {
      const ctx = this.ctx;

      const x = GRID_X + col * CELL + 3;
      const y = GRID_Y + row * CELL + 3;

      const size = CELL - 6;
      const isLit = this.board[row][col];

      const isSelected =
        row === this.selectedRow &&
        col === this.selectedCol;

      // Tile background
      this.drawRoundedRect(
        x,
        y,
        size,
        size,
        9,
        isLit ? COLORS.lit : COLORS.off
      );

      // Glow effect
      if (isLit) {
        ctx.fillStyle = COLORS.litGlow;

        ctx.beginPath();
        ctx.arc(
          x + size / 2,
          y + size / 2,
          15,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      // Inner light
      ctx.fillStyle = isLit
        ? '#ffffff'
        : '#31435b';

      ctx.beginPath();

      ctx.arc(
        x + size / 2,
        y + size / 2,
        isLit ? 7 : 5,
        0,
        Math.PI * 2
      );

      ctx.fill();

      // Selection border for keyboard navigation
      if (isSelected) {
        ctx.strokeStyle = COLORS.selected;
        ctx.lineWidth = 2;

        ctx.strokeRect(
          x + 2,
          y + 2,
          size - 4,
          size - 4
        );
      }
    },

    draw() {
      const ctx = this.ctx;

      if (!ctx) return;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Header
      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 25px Arial';
      ctx.textAlign = 'center';

      ctx.fillText(
        'LIGHTS OUT',
        WIDTH / 2,
        35
      );

      ctx.fillStyle = COLORS.muted;
      ctx.font = '12px Arial';

      ctx.fillText(
        'Switch off every light to win!',
        WIDTH / 2,
        57
      );

      // Stats panels
      this.drawRoundedRect(
        25, 68, 105, 28, 8, COLORS.panel
      );

      this.drawRoundedRect(
        147, 68, 105, 28, 8, COLORS.panel
      );

      this.drawRoundedRect(
        270, 68, 105, 28, 8, COLORS.panel
      );

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 11px Arial';

      ctx.fillText(
        `MOVES: ${this.moves}`,
        77,
        86
      );

      ctx.fillText(
        `TIME: ${this.formatTime(this.elapsedSeconds)}`,
        199,
        86
      );

      ctx.fillText(
        `LIGHTS: ${this.countLights()}`,
        322,
        86
      );

      // Grid panel
      this.drawRoundedRect(
        GRID_X - 7,
        GRID_Y - 7,
        CELL * SIZE + 14,
        CELL * SIZE + 14,
        12,
        COLORS.panel
      );

      // Grid border
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;

      ctx.strokeRect(
        GRID_X,
        GRID_Y,
        CELL * SIZE,
        CELL * SIZE
      );

      // Draw tiles
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          this.drawTile(row, col);
        }
      }

      // Instructions
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 13px Arial';

      ctx.fillText(
        'TURN OFF ALL THE LIGHTS',
        WIDTH / 2,
        410
      );

      ctx.fillStyle = COLORS.muted;
      ctx.font = '11px Arial';

      ctx.fillText(
        'Tap a tile to toggle it and its neighbours',
        WIDTH / 2,
        418
      );

      // Difficulty buttons
      const difficulties = [
        { key: 'easy', x: 25, width: 110 },
        { key: 'medium', x: 145, width: 110 },
        { key: 'hard', x: 265, width: 110 }
      ];

      difficulties.forEach(item => {
        const active =
          this.difficulty === item.key;

        this.drawRoundedRect(
          item.x,
          425,
          item.width,
          38,
          8,
          active ? '#17394a' : '#26364c'
        );

        ctx.fillStyle = active
          ? COLORS.accent
          : COLORS.text;

        ctx.font = 'bold 12px Arial';

        ctx.fillText(
          DIFFICULTIES[item.key].label,
          item.x + item.width / 2,
          449
        );
      });

      // Restart button
      this.drawRoundedRect(
        110,
        485,
        180,
        38,
        8,
        '#17394a'
      );

      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 13px Arial';

      ctx.fillText(
        'NEW PUZZLE',
        WIDTH / 2,
        509
      );

      // Win screen
      if (this.finished) {
        ctx.fillStyle = 'rgba(5,10,20,0.91)';

        ctx.fillRect(
          0,
          0,
          WIDTH,
          HEIGHT
        );

        ctx.fillStyle = COLORS.success;
        ctx.font = 'bold 29px Arial';

        ctx.fillText(
          'ALL LIGHTS OUT!',
          WIDTH / 2,
          225
        );

        ctx.fillStyle = COLORS.text;
        ctx.font = '15px Arial';

        ctx.fillText(
          `Moves: ${this.moves}`,
          WIDTH / 2,
          270
        );

        ctx.fillText(
          `Time: ${this.formatTime(this.elapsedSeconds)}`,
          WIDTH / 2,
          300
        );

        ctx.fillText(
          `Final Score: ${this.score}`,
          WIDTH / 2,
          330
        );

        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 13px Arial';

        ctx.fillText(
          'PUZZLE COMPLETED!',
          WIDTH / 2,
          370
        );
      }
    }
  };

})();
