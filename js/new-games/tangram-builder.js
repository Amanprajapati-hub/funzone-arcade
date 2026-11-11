
/**
 * Game: Tangram Builder
 * Randomized tangram puzzles with spaced pieces,
 * drag, rotate and mobile touch support.
 */
(function () {
  'use strict';

  const WIDTH = 400;
  const HEIGHT = 540;
  const PIECE_SCALE = 0.52;

  const COLORS = {
    background: '#090d18',
    panel: '#111a2b',
    text: '#e8f4ff',
    muted: '#8294ad',
    accent: '#00e5ff',
    success: '#16c784',
    selected: '#ffffff',
    pieces: [
      '#8b5cf6',
      '#00c9b7',
      '#f59e0b',
      '#438cff',
      '#e879f9',
      '#ff386b',
      '#16c784'
    ]
  };

  const SHAPES = {
    large: [
      [-42, -42], [42, -42], [-42, 42]
    ],
    medium: [
      [-30, -30], [30, -30], [-30, 30]
    ],
    small: [
      [-22, -22], [22, -22], [-22, 22]
    ],
    square: [
      [-22, -22], [22, -22],
      [22, 22], [-22, 22]
    ],
    parallelogram: [
      [-30, -21], [30, -21],
      [12, 21], [-48, 21]
    ]
  };

  const BASE_PIECES = [
    { id: 'piece1', shape: 'large' },
    { id: 'piece2', shape: 'large' },
    { id: 'piece3', shape: 'medium' },
    { id: 'piece4', shape: 'small' },
    { id: 'piece5', shape: 'small' },
    { id: 'piece6', shape: 'square' },
    { id: 'piece7', shape: 'parallelogram' }
  ];

  const TRAY_POSITIONS = [
    { x: 35, y: 425 },
    { x: 90, y: 425 },
    { x: 145, y: 425 },
    { x: 200, y: 425 },
    { x: 255, y: 425 },
    { x: 310, y: 425 },
    { x: 365, y: 425 }
  ];

  const TARGET_POSITIONS = [
    { x: 65, y: 155 },
    { x: 155, y: 155 },
    { x: 245, y: 155 },
    { x: 335, y: 155 },
    { x: 110, y: 245 },
    { x: 200, y: 245 },
    { x: 290, y: 245 }
  ];

  function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  function randomRotation() {
    return Math.floor(Math.random() * 4) * 90;
  }

  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['tangram-builder'] = {
    id: 'tangram-builder',
    title: 'Tangram Builder',
    category: 'Puzzle',
    description: 'Arrange geometric pieces to complete the puzzle!',
    instructions:
      'Drag the seven pieces into their matching outlines. Select a piece and rotate it using the rotate button or R key.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animationId: null,

    isRunning: false,
    isPaused: false,
    finished: false,

    pieces: [],
    selectedPiece: null,

    moves: 0,
    score: 0,

    startTime: 0,
    elapsedSeconds: 0,

    dragOffsetX: 0,
    dragOffsetY: 0,
    isDragging: false,

    pointerDownHandler: null,
    pointerMoveHandler: null,
    pointerUpHandler: null,
    keyHandler: null,

    gameOverTimer: null,

    init(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;

      this.canvas.width = WIDTH;
      this.canvas.height = HEIGHT;
      this.canvas.style.touchAction = 'none';

      this.pointerDownHandler = this.onPointerDown.bind(this);
      this.pointerMoveHandler = this.onPointerMove.bind(this);
      this.pointerUpHandler = this.onPointerUp.bind(this);
      this.keyHandler = this.onKeyDown.bind(this);

      this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
      this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
      this.canvas.addEventListener('pointerup', this.pointerUpHandler);
      this.canvas.addEventListener('pointercancel', this.pointerUpHandler);

      window.addEventListener('keydown', this.keyHandler);

      this.reset();
    },

    start() {
      this.isRunning = true;
      this.isPaused = false;
      this.startTime = Date.now() - this.elapsedSeconds * 1000;

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
      this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    reset() {
      if (this.gameOverTimer) {
        clearTimeout(this.gameOverTimer);
        this.gameOverTimer = null;
      }

      // Randomize target positions and piece order.
      const targetPositions = shuffle(TARGET_POSITIONS);
      const trayPositions = [...TRAY_POSITIONS];

      const randomizedPieces = shuffle(BASE_PIECES);

      this.pieces = randomizedPieces.map((config, index) => {
        const target = targetPositions[index];
        const tray = trayPositions[index];

        return {
          ...config,

          x: tray.x,
          y: tray.y,

          targetX: target.x,
          targetY: target.y,

          rotation: 0,
          targetRotation: randomRotation(),

          placed: false,
          scale: PIECE_SCALE,

          color: COLORS.pieces[
            Math.floor(Math.random() * COLORS.pieces.length)
          ]
        };
      });

      // Ensure the target rotations are not all identical.
      this.selectedPiece = null;

      this.moves = 0;
      this.score = 0;
      this.elapsedSeconds = 0;

      this.finished = false;
      this.isPaused = false;
      this.isDragging = false;

      this.startTime = Date.now();

      if (this.callbacks) {
        this.callbacks.onScore(0);
        this.callbacks.onLives(0);
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
        this.startTime = Date.now() - this.elapsedSeconds * 1000;
        this.loop();
      }
    },

    restart() {
      this.destroy();

      if (!this.canvas) return;

      this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
      this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
      this.canvas.addEventListener('pointerup', this.pointerUpHandler);
      this.canvas.addEventListener('pointercancel', this.pointerUpHandler);

      window.addEventListener('keydown', this.keyHandler);

      this.reset();
      this.start();
    },

    destroy() {
      this.isRunning = false;
      this.isPaused = false;
      this.isDragging = false;

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      if (this.gameOverTimer) {
        clearTimeout(this.gameOverTimer);
        this.gameOverTimer = null;
      }

      if (this.canvas) {
        this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
        this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
        this.canvas.removeEventListener('pointerup', this.pointerUpHandler);
        this.canvas.removeEventListener('pointercancel', this.pointerUpHandler);
      }

      if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
      }
    },

    getPointerPosition(e) {
      const rect = this.canvas.getBoundingClientRect();

      return {
        x: (e.clientX - rect.left) * (WIDTH / rect.width),
        y: (e.clientY - rect.top) * (HEIGHT / rect.height)
      };
    },

    getShapePoints(piece) {
      return SHAPES[piece.shape];
    },

    getPieceAt(x, y) {
      for (let i = this.pieces.length - 1; i >= 0; i--) {
        const piece = this.pieces[i];

        if (piece.placed) continue;

        const dx = x - piece.x;
        const dy = y - piece.y;

        if (Math.sqrt(dx * dx + dy * dy) <= 34) {
          return piece;
        }
      }

      return null;
    },

    onPointerDown(e) {
      if (!this.isRunning || this.isPaused || this.finished) return;

      e.preventDefault();

      const position = this.getPointerPosition(e);
      const x = position.x;
      const y = position.y;

      // Rotate button.
      if (x >= 145 && x <= 255 && y >= 330 && y <= 370) {
        this.rotateSelected();
        return;
      }

      // New puzzle button.
      if (x >= 110 && x <= 290 && y >= 485 && y <= 525) {
        this.reset();
        return;
      }

      const piece = this.getPieceAt(x, y);
      if (!piece) return;

      this.selectedPiece = piece.id;

      this.dragOffsetX = x - piece.x;
      this.dragOffsetY = y - piece.y;

      this.isDragging = true;

      // Bring selected piece to the top.
      this.pieces = this.pieces.filter(item => item.id !== piece.id);
      this.pieces.push(piece);

      if (this.canvas.setPointerCapture) {
        this.canvas.setPointerCapture(e.pointerId);
      }

      this.draw();
    },

    onPointerMove(e) {
      if (
        !this.isDragging ||
        !this.isRunning ||
        this.isPaused ||
        this.finished
      ) {
        return;
      }

      e.preventDefault();

      const position = this.getPointerPosition(e);
      const piece = this.getSelectedPiece();

      if (!piece) return;

      piece.x = Math.max(
        20,
        Math.min(WIDTH - 20, position.x - this.dragOffsetX)
      );

      piece.y = Math.max(
        105,
        Math.min(HEIGHT - 35, position.y - this.dragOffsetY)
      );

      this.draw();
    },

    onPointerUp() {
      if (!this.isDragging) return;

      this.isDragging = false;

      const piece = this.getSelectedPiece();
      if (!piece) return;

      this.moves++;

      const dx = piece.x - piece.targetX;
      const dy = piece.y - piece.targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const angleDifference = Math.abs(
        ((piece.rotation - piece.targetRotation + 540) % 360) - 180
      );

      if (distance <= 22 && angleDifference <= 0.1) {
        piece.x = piece.targetX;
        piece.y = piece.targetY;
        piece.placed = true;

        this.score += 100;

        if (this.callbacks) {
          this.callbacks.onScore(this.score);
        }

        if (this.pieces.every(item => item.placed)) {
          this.winGame();
          return;
        }
      }

      this.draw();
    },

    getSelectedPiece() {
      return this.pieces.find(piece => piece.id === this.selectedPiece);
    },

    rotateSelected() {
      if (!this.isRunning || this.isPaused || this.finished) return;

      const piece = this.getSelectedPiece();
      if (!piece || piece.placed) return;

      piece.rotation = (piece.rotation + 90) % 360;
      this.moves++;

      this.draw();
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused || this.finished) return;

      if (
        e.key.toLowerCase() === 'r' ||
        e.key === 'Enter'
      ) {
        e.preventDefault();
        this.rotateSelected();
      }

      if (e.key === 'Escape') {
        this.selectedPiece = null;
        this.isDragging = false;
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

      const timeBonus = Math.max(0, 300 - this.elapsedSeconds * 3);
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

    drawRoundedRect(x, y, width, height, radius, color) {
      const ctx = this.ctx;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    },

    drawPolygon(points, color, x, y, rotation, outline = false, scale = PIECE_SCALE) {
      const ctx = this.ctx;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(scale, scale);

      ctx.beginPath();

      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
      });

      ctx.closePath();

      if (outline) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    },

    drawTarget(piece) {
      this.drawPolygon(
        this.getShapePoints(piece),
        'rgba(0,229,255,0.75)',
        piece.targetX,
        piece.targetY,
        piece.targetRotation,
        true
      );
    },

    drawPiece(piece) {
      this.drawPolygon(
        this.getShapePoints(piece),
        piece.color,
        piece.x,
        piece.y,
        piece.rotation
      );

      if (piece.id === this.selectedPiece) {
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = COLORS.selected;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(piece.x, piece.y, 27, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
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

      ctx.fillText('TANGRAM BUILDER', WIDTH / 2, 35);

      ctx.fillStyle = COLORS.muted;
      ctx.font = '12px Arial';
      ctx.fillText('Fit all seven pieces into their outlines!', WIDTH / 2, 57);

      // Stats.
      this.drawRoundedRect(35, 68, 150, 27, 8, COLORS.panel);
      this.drawRoundedRect(215, 68, 150, 27, 8, COLORS.panel);

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 12px Arial';

      ctx.fillText(`MOVES: ${this.moves}`, 110, 86);
      ctx.fillText(`TIME: ${this.formatTime(this.elapsedSeconds)}`, 290, 86);

      // Target board.
      this.drawRoundedRect(20, 105, 360, 185, 12, COLORS.panel);

      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 11px Arial';
      ctx.fillText('TARGET SHAPES', WIDTH / 2, 101);

      // Target outlines.
      this.pieces.forEach(piece => {
        if (!piece.placed) {
          this.drawTarget(piece);
        }
      });

      // Placed pieces.
      this.pieces.forEach(piece => {
        if (piece.placed) {
          this.drawPiece(piece);
        }
      });

      // Instructions.
      ctx.fillStyle = COLORS.text;
      ctx.font = '11px Arial';
      ctx.fillText('Drag pieces into their matching outlines', WIDTH / 2, 310);

      ctx.fillStyle = COLORS.muted;
      ctx.fillText('Select a piece and press R to rotate', WIDTH / 2, 323);

      // Rotate button.
      this.drawRoundedRect(145, 330, 110, 40, 8, '#17394a');

      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 13px Arial';
      ctx.fillText('ROTATE ↻', WIDTH / 2, 355);

      // Piece tray.
      this.drawRoundedRect(20, 375, 360, 105, 12, COLORS.panel);

      ctx.fillStyle = COLORS.muted;
      ctx.font = 'bold 11px Arial';
      ctx.fillText('DRAG YOUR PIECES HERE', WIDTH / 2, 393);

      // Unplaced pieces.
      this.pieces.forEach(piece => {
        if (!piece.placed) {
          this.drawPiece(piece);
        }
      });

      // Progress.
      const completed = this.pieces.filter(piece => piece.placed).length;

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`COMPLETED: ${completed}/7`, WIDTH / 2, 473);

      // New puzzle button.
      this.drawRoundedRect(110, 485, 180, 38, 8, '#17394a');

      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 13px Arial';
      ctx.fillText('NEW PUZZLE', WIDTH / 2, 509);

      // Win screen.
      if (this.finished) {
        ctx.fillStyle = 'rgba(5,10,20,0.92)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = COLORS.success;
        ctx.font = 'bold 27px Arial';
        ctx.fillText('PUZZLE COMPLETED!', WIDTH / 2, 220);

        ctx.fillStyle = COLORS.text;
        ctx.font = '15px Arial';

        ctx.fillText('All seven pieces placed!', WIDTH / 2, 260);
        ctx.fillText(`Moves: ${this.moves}`, WIDTH / 2, 295);
        ctx.fillText(`Time: ${this.formatTime(this.elapsedSeconds)}`, WIDTH / 2, 325);
        ctx.fillText(`Final Score: ${this.score}`, WIDTH / 2, 355);
      }
    }
  };
})();
