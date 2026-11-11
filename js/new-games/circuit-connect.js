
/**
 * Game: Circuit Connect
 * Rotate circuit tiles to connect the random source
 * to the random destination.
 */
(function () {
  'use strict';

  const WIDTH = 400;
  const HEIGHT = 540;
  const SIZE = 5;
  const CELL = 58;
  const GRID_X = 55;
  const GRID_Y = 115;

  const N = 1;
  const E = 2;
  const S = 4;
  const W = 8;

  const COLORS = {
    background: '#090d18',
    panel: '#111a2b',
    grid: '#26364c',
    text: '#e8f4ff',
    muted: '#8294ad',
    accent: '#00e5ff',
    wire: '#00d9ff',
    success: '#16c784',
    source: '#16c784',
    target: '#ff386b',
    selected: '#ffffff'
  };

  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['circuit-connect'] = {

    id: 'circuit-connect',
    title: 'Circuit Connect',
    category: 'Puzzle',
    description: 'Rotate circuit pieces to connect the power source!',
    instructions: 'Tap or click each circuit tile to rotate it. Connect the green power source to the red destination!',

    canvas: null,
    ctx: null,
    callbacks: null,
    animationId: null,

    isRunning: false,
    isPaused: false,
    finished: false,

    board: [],
    path: [],

    source: { row: 0, col: 0 },
    target: { row: 4, col: 4 },

    moves: 0,
    score: 0,

    selectedRow: 0,
    selectedCol: 0,

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

      this.pointerDownHandler = this.onPointerDown.bind(this);
      this.keyHandler = this.onKeyDown.bind(this);

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

      this.startTime =
        Date.now() - this.elapsedSeconds * 1000;

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }

      this.loop();
    },

    loop() {
      if (!this.isRunning || this.isPaused) return;

      this.elapsedSeconds = Math.floor(
        (Date.now() - this.startTime) / 1000
      );

      this.draw();

      this.animationId =
        requestAnimationFrame(this.loop.bind(this));
    },

    reset() {
      if (this.gameOverTimer) {
        clearTimeout(this.gameOverTimer);
        this.gameOverTimer = null;
      }

      this.moves = 0;
      this.score = 0;
      this.elapsedSeconds = 0;
      this.finished = false;
      this.isPaused = false;

      this.selectedRow = 0;
      this.selectedCol = 0;

      this.startTime = Date.now();

      this.generatePuzzle();

      if (this.callbacks) {
        if (this.callbacks.onScore) {
          this.callbacks.onScore(0);
        }

        if (this.callbacks.onLives) {
          this.callbacks.onLives(0);
        }
      }

      this.draw();
    },

    rotateMask(mask, amount = 1) {
      for (let i = 0; i < amount; i++) {
        mask = ((mask << 1) & 15) |
          ((mask >> 3) & 1);
      }

      return mask;
    },

    randomDirection() {
      const directions = [N, E, S, W];

      return directions[
        Math.floor(Math.random() * directions.length)
      ];
    },

    getBoundaryCells() {
      const cells = [];

      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          if (
            row === 0 ||
            row === SIZE - 1 ||
            col === 0 ||
            col === SIZE - 1
          ) {
            cells.push({ row, col });
          }
        }
      }

      return cells;
    },

    generateRandomPath() {
      const boundary = this.getBoundaryCells();

      // Select random start and end positions.
      // Keep enough distance between them.
      let start;
      let target;

      do {
        start = boundary[
          Math.floor(Math.random() * boundary.length)
        ];

        target = boundary[
          Math.floor(Math.random() * boundary.length)
        ];

      } while (
        (start.row === target.row &&
          start.col === target.col) ||
        (
          Math.abs(start.row - target.row) +
          Math.abs(start.col - target.col)
        ) < 4
      );

      this.source = { ...start };
      this.target = { ...target };

      const visited = new Set();
      const path = [];

      const key = (row, col) => `${row},${col}`;

      visited.add(key(start.row, start.col));
      path.push(start);

      const search = (row, col) => {
        if (
          row === target.row &&
          col === target.col
        ) {
          return true;
        }

        const neighbours = [
          { row: row - 1, col },
          { row: row + 1, col },
          { row, col: col - 1 },
          { row, col: col + 1 }
        ];

        // Randomize movement order.
        for (let i = neighbours.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));

          [neighbours[i], neighbours[j]] =
            [neighbours[j], neighbours[i]];
        }

        for (const next of neighbours) {
          if (
            next.row < 0 ||
            next.row >= SIZE ||
            next.col < 0 ||
            next.col >= SIZE
          ) {
            continue;
          }

          const nextKey = key(next.row, next.col);

          if (visited.has(nextKey)) continue;

          visited.add(nextKey);
          path.push(next);

          if (search(next.row, next.col)) {
            return true;
          }

          path.pop();
          visited.delete(nextKey);
        }

        return false;
      };

      search(start.row, start.col);

      return path;
    },

    getDirection(from, to) {
      if (to.row < from.row) return N;
      if (to.row > from.row) return S;
      if (to.col > from.col) return E;
      if (to.col < from.col) return W;

      return 0;
    },

    generatePuzzle() {
      this.board = Array.from(
        { length: SIZE },
        () => Array(SIZE).fill(null)
      );

      // New random path and new endpoint positions.
      this.path = this.generateRandomPath();

      const pathPositions = new Set(
        this.path.map(position =>
          `${position.row},${position.col}`
        )
      );

      // Create correct connections along the path.
      this.path.forEach((position, index) => {
        let solutionMask = 0;

        const previous = this.path[index - 1];
        const next = this.path[index + 1];

        if (previous) {
          solutionMask |= this.getDirection(
            position,
            previous
          );
        }

        if (next) {
          solutionMask |= this.getDirection(
            position,
            next
          );
        }

        const rotation = Math.floor(Math.random() * 4);

        this.board[position.row][position.col] = {
          mask: this.rotateMask(solutionMask, rotation),
          solution: solutionMask,
          rotation
        };
      });

      // Fill other cells with random circuit pieces.
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          if (pathPositions.has(`${row},${col}`)) {
            continue;
          }

          const solutionMask = this.randomDirection();
          const rotation = Math.floor(Math.random() * 4);

          this.board[row][col] = {
            mask: this.rotateMask(solutionMask, rotation),
            solution: solutionMask,
            rotation
          };
        }
      }

      // Start keyboard selection at the source.
      this.selectedRow = this.source.row;
      this.selectedCol = this.source.col;
    },

    getNeighbour(row, col, direction) {
      if (direction === N) {
        return { row: row - 1, col };
      }

      if (direction === E) {
        return { row, col: col + 1 };
      }

      if (direction === S) {
        return { row: row + 1, col };
      }

      if (direction === W) {
        return { row, col: col - 1 };
      }

      return null;
    },

    hasConnection(mask, direction) {
      return (mask & direction) !== 0;
    },

    isConnected() {
      const visited = new Set();

      const queue = [{
        row: this.source.row,
        col: this.source.col
      }];

      const directions = [
        { bit: N, opposite: S },
        { bit: E, opposite: W },
        { bit: S, opposite: N },
        { bit: W, opposite: E }
      ];

      while (queue.length > 0) {
        const current = queue.shift();

        const key = `${current.row},${current.col}`;

        if (visited.has(key)) continue;

        visited.add(key);

        if (
          current.row === this.target.row &&
          current.col === this.target.col
        ) {
          return true;
        }

        const tile =
          this.board[current.row][current.col];

        if (!tile) continue;

        directions.forEach(direction => {
          if (!this.hasConnection(
            tile.mask,
            direction.bit
          )) {
            return;
          }

          const next = this.getNeighbour(
            current.row,
            current.col,
            direction.bit
          );

          if (
            next.row < 0 ||
            next.row >= SIZE ||
            next.col < 0 ||
            next.col >= SIZE
          ) {
            return;
          }

          const neighbour =
            this.board[next.row][next.col];

          if (
            neighbour &&
            this.hasConnection(
              neighbour.mask,
              direction.opposite
            )
          ) {
            const nextKey =
              `${next.row},${next.col}`;

            if (!visited.has(nextKey)) {
              queue.push(next);
            }
          }
        });
      }

      return false;
    },

    rotateTile(row, col) {
      if (
        !this.isRunning ||
        this.isPaused ||
        this.finished
      ) {
        return;
      }

      const tile = this.board[row][col];

      if (!tile) return;

      tile.mask = this.rotateMask(tile.mask);
      tile.rotation = (tile.rotation + 1) % 4;

      this.selectedRow = row;
      this.selectedCol = col;

      this.moves++;

      this.score = Math.max(
        0,
        1000 - this.moves * 12 -
        this.elapsedSeconds * 2
      );

      if (this.callbacks && this.callbacks.onScore) {
        this.callbacks.onScore(this.score);
      }

      if (this.isConnected()) {
        this.winGame();
        return;
      }

      this.draw();
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

      // New puzzle button.
      if (
        y >= 485 &&
        y <= 525 &&
        x >= 110 &&
        x <= 290
      ) {
        this.reset();
        return;
      }

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

      this.rotateTile(row, col);
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
          this.rotateTile(
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

      if (this.callbacks && this.callbacks.onScore) {
        this.callbacks.onScore(this.score);
      }

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      this.draw();

      this.gameOverTimer = setTimeout(() => {
        this.gameOverTimer = null;

        if (this.callbacks && this.callbacks.onGameOver) {
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
      const tile = this.board[row][col];

      const x = GRID_X + col * CELL + 3;
      const y = GRID_Y + row * CELL + 3;
      const size = CELL - 6;

      const centerX = x + size / 2;
      const centerY = y + size / 2;

      const isSelected =
        row === this.selectedRow &&
        col === this.selectedCol;

      const isSource =
        row === this.source.row &&
        col === this.source.col;

      const isTarget =
        row === this.target.row &&
        col === this.target.col;

      this.drawRoundedRect(
        x,
        y,
        size,
        size,
        9,
        '#15243a'
      );

      // Circuit wires.
      ctx.strokeStyle = COLORS.wire;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      const directions = [
        { bit: N, x: centerX, y: y },
        { bit: E, x: x + size, y: centerY },
        { bit: S, x: centerX, y: y + size },
        { bit: W, x: x, y: centerY }
      ];

      directions.forEach(direction => {
        if (
          this.hasConnection(
            tile.mask,
            direction.bit
          )
        ) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(direction.x, direction.y);
          ctx.stroke();
        }
      });

      // Central connection point.
      ctx.fillStyle = COLORS.accent;

      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        7,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Highlight random source and target tiles.
      if (isSource || isTarget) {
        const color = isSource
          ? COLORS.source
          : COLORS.target;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.strokeRect(
          x + 2,
          y + 2,
          size - 4,
          size - 4
        );

        // Small S / T badge.
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          x + 11,
          y + 11,
          9,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = '#07111d';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
          isSource ? 'S' : 'T',
          x + 11,
          y + 11
        );

        ctx.textBaseline = 'alphabetic';
      }

      // Selection border.
      if (isSelected) {
        ctx.strokeStyle = COLORS.selected;
        ctx.lineWidth = 2;

        ctx.strokeRect(
          x + 4,
          y + 4,
          size - 8,
          size - 8
        );
      }
    },

    draw() {
      const ctx = this.ctx;

      if (!ctx) return;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Header.
      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';

      ctx.fillText(
        'CIRCUIT CONNECT',
        WIDTH / 2,
        35
      );

      ctx.fillStyle = COLORS.muted;
      ctx.font = '12px Arial';

      ctx.fillText(
        'Connect the green S to the red T!',
        WIDTH / 2,
        57
      );

      // Stats.
      this.drawRoundedRect(
        35, 68, 150, 29, 8, COLORS.panel
      );

      this.drawRoundedRect(
        215, 68, 150, 29, 8, COLORS.panel
      );

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 12px Arial';

      ctx.fillText(
        `MOVES: ${this.moves}`,
        110,
        87
      );

      ctx.fillText(
        `TIME: ${this.formatTime(this.elapsedSeconds)}`,
        290,
        87
      );

      // Grid panel.
      this.drawRoundedRect(
        GRID_X - 7,
        GRID_Y - 7,
        CELL * SIZE + 14,
        CELL * SIZE + 14,
        12,
        COLORS.panel
      );

      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;

      ctx.strokeRect(
        GRID_X,
        GRID_Y,
        CELL * SIZE,
        CELL * SIZE
      );

      // Draw all tiles.
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          this.drawTile(row, col);
        }
      }

      // Legend.
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Arial';

      ctx.fillStyle = COLORS.source;
      ctx.fillText('S = START', 125, 415);

      ctx.fillStyle = COLORS.target;
      ctx.fillText('T = END', 275, 415);

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 13px Arial';

      ctx.fillText(
        'ROTATE THE CIRCUIT TILES',
        WIDTH / 2,
        445
      );

      ctx.fillStyle = COLORS.muted;
      ctx.font = '11px Arial';

      ctx.fillText(
        'Tap or click a tile to rotate it',
        WIDTH / 2,
        463
      );

      // New puzzle button.
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

      // Win screen.
      if (this.finished) {
        ctx.fillStyle = 'rgba(5,10,20,0.91)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = COLORS.success;
        ctx.font = 'bold 27px Arial';

        ctx.fillText(
          'CIRCUIT CONNECTED!',
          WIDTH / 2,
          230
        );

        ctx.fillStyle = COLORS.text;
        ctx.font = '15px Arial';

        ctx.fillText(
          `Moves: ${this.moves}`,
          WIDTH / 2,
          275
        );

        ctx.fillText(
          `Time: ${this.formatTime(this.elapsedSeconds)}`,
          WIDTH / 2,
          305
        );

        ctx.fillText(
          `Final Score: ${this.score}`,
          WIDTH / 2,
          335
        );
      }
    }
  };

})();
