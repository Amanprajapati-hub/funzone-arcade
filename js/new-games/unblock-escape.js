/**
 * Game: Unblock Escape
 * Move the target car through the exit.
 */
(function () {
  'use strict';

  const WIDTH = 400;
  const HEIGHT = 540;
  const SIZE = 6;
  const CELL = 50;
  const GRID_X = 50;
  const GRID_Y = 105;

  const COLORS = {
    background: '#090d18',
    panel: '#111a2b',
    grid: '#26364c',
    text: '#e8f4ff',
    muted: '#8294ad',
    accent: '#00e5ff',
    target: '#ff386b',
    success: '#16c784',
    cars: ['#8b5cf6', '#16c7b7', '#f59e0b', '#438cff', '#e879f9']
  };

  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['unblock-escape'] = {
    id: 'unblock-escape',
    title: 'Unblock Escape',
    category: 'Puzzle',
    description: 'Slide the cars and clear a path to escape!',
    instructions: 'Select a car, then drag it in its direction or use the arrow buttons. Move the red car through the exit!',

    canvas: null,
    ctx: null,
    callbacks: null,
    animationId: null,

    isRunning: false,
    isPaused: false,
    finished: false,

    selectedCar: null,
    moves: 0,
    score: 0,
    cars: [],

    startTime: 0,
    pointerStart: null,
    gameOverTimer: null,

    initialCars: [
      // Target car
      { id: 'target', row: 2, col: 0, length: 2, horizontal: true },

      // Blocking cars
      { id: 'car1', row: 0, col: 0, length: 2, horizontal: true },
      { id: 'car2', row: 0, col: 2, length: 3, horizontal: false },
      { id: 'car3', row: 1, col: 3, length: 2, horizontal: true },
      { id: 'car4', row: 3, col: 0, length: 3, horizontal: false },
      { id: 'car5', row: 3, col: 4, length: 3, horizontal: false },
      { id: 'car6', row: 5, col: 1, length: 3, horizontal: true }
    ],

    init(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;

      this.canvas.width = WIDTH;
      this.canvas.height = HEIGHT;
      this.canvas.style.touchAction = 'none';

      this.pointerDownHandler = this.onPointerDown.bind(this);
      this.pointerUpHandler = this.onPointerUp.bind(this);
      this.keyHandler = this.onKeyDown.bind(this);

      this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
      this.canvas.addEventListener('pointerup', this.pointerUpHandler);
      window.addEventListener('keydown', this.keyHandler);

      this.reset();
    },

    start() {
      this.isRunning = true;
      this.isPaused = false;
      this.startTime = Date.now();

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }

      this.loop();
    },

    loop() {
      if (!this.isRunning || this.isPaused) return;

      this.draw();
      this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    reset() {
      if (this.gameOverTimer) {
        clearTimeout(this.gameOverTimer);
        this.gameOverTimer = null;
      }

      this.cars = this.initialCars.map(car => ({ ...car }));
      this.selectedCar = null;
      this.moves = 0;
      this.score = 0;
      this.finished = false;
      this.isPaused = false;
      this.pointerStart = null;
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
        this.loop();
      }
    },

    restart() {
      this.destroy();

      if (this.canvas && this.pointerDownHandler) {
        this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
        this.canvas.addEventListener('pointerup', this.pointerUpHandler);
      }

      if (this.keyHandler) {
        window.addEventListener('keydown', this.keyHandler);
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

      if (this.canvas) {
        this.canvas.removeEventListener(
          'pointerdown',
          this.pointerDownHandler
        );

        this.canvas.removeEventListener(
          'pointerup',
          this.pointerUpHandler
        );
      }

      if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
      }

      this.pointerStart = null;
    },

    getCarById(id) {
      return this.cars.find(car => car.id === id);
    },

    getCarAt(row, col, ignoreId = null) {
      return this.cars.find(car => {
        if (car.id === ignoreId) return false;

        if (car.horizontal) {
          return (
            car.row === row &&
            col >= car.col &&
            col < car.col + car.length
          );
        }

        return (
          car.col === col &&
          row >= car.row &&
          row < car.row + car.length
        );
      });
    },

    /**
     * Check whether one single-cell movement is valid.
     */
    canMoveOneStep(car, direction) {
      if (!car || direction === 0) return false;

      if (car.horizontal) {
        // Moving left
        if (direction < 0) {
          const nextCol = car.col - 1;

          if (nextCol < 0) return false;

          return !this.getCarAt(
            car.row,
            nextCol,
            car.id
          );
        }

        // Moving right
        const nextCol = car.col + car.length;

        // Target car can move through the exit
        if (car.id === 'target' && car.row === 2) {
          if (nextCol >= SIZE) {
            return nextCol <= SIZE + 1;
          }
        }

        if (nextCol >= SIZE) return false;

        return !this.getCarAt(
          car.row,
          nextCol,
          car.id
        );
      }

      // Vertical car moving up
      if (direction < 0) {
        const nextRow = car.row - 1;

        if (nextRow < 0) return false;

        return !this.getCarAt(
          nextRow,
          car.col,
          car.id
        );
      }

      // Vertical car moving down
      const nextRow = car.row + car.length;

      if (nextRow >= SIZE) return false;

      return !this.getCarAt(
        nextRow,
        car.col,
        car.id
      );
    },

    /**
     * Move a car safely one cell at a time.
     * This prevents jumping through other cars.
     */
    moveCar(car, amount) {
      if (
        !this.isRunning ||
        this.isPaused ||
        this.finished ||
        !car ||
        amount === 0
      ) {
        return;
      }

      const direction = amount > 0 ? 1 : -1;
      const steps = Math.abs(amount);

      let moved = false;

      for (let i = 0; i < steps; i++) {
        if (!this.canMoveOneStep(car, direction)) {
          break;
        }

        if (car.horizontal) {
          car.col += direction;
        } else {
          car.row += direction;
        }

        this.moves++;
        moved = true;

        // Target car has completely cleared the board
        if (
          car.id === 'target' &&
          car.row === 2 &&
          car.col >= SIZE
        ) {
          break;
        }
      }

      if (!moved) return;

      this.score = Math.max(
        0,
        500 - this.moves * 10
      );

      if (this.callbacks) {
        this.callbacks.onScore(this.score);
      }

      if (
        car.id === 'target' &&
        car.row === 2 &&
        car.col >= SIZE
      ) {
        this.winGame();
        return;
      }

      this.draw();
    },

    moveSelected(direction) {
      const car = this.getCarById(this.selectedCar);

      if (!car) return;

      this.moveCar(car, direction);
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

    getCellFromPosition(x, y) {
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
        return null;
      }

      return { row, col };
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

      // Reset puzzle button
      if (
        y >= 490 &&
        y <= 530 &&
        x >= 130 &&
        x <= 270
      ) {
        this.reset();
        return;
      }

      // Movement buttons
      if (y >= 445 && y <= 485) {
        if (x >= 25 && x <= 150) {
          this.moveSelected(-1);
          return;
        }

        if (x >= 250 && x <= 375) {
          this.moveSelected(1);
          return;
        }
      }

      const cell = this.getCellFromPosition(x, y);

      if (!cell) return;

      const car = this.getCarAt(
        cell.row,
        cell.col
      );

      if (!car) return;

      this.selectedCar = car.id;

      this.pointerStart = {
        x,
        y,
        carId: car.id
      };

      if (this.canvas.setPointerCapture) {
        this.canvas.setPointerCapture(e.pointerId);
      }

      this.draw();
    },

    onPointerUp(e) {
      if (
        !this.pointerStart ||
        !this.isRunning ||
        this.finished
      ) {
        this.pointerStart = null;
        return;
      }

      const position = this.getPointerPosition(e);

      const dx = position.x - this.pointerStart.x;
      const dy = position.y - this.pointerStart.y;

      const car = this.getCarById(
        this.pointerStart.carId
      );

      if (car) {
        const distance = car.horizontal ? dx : dy;

        if (Math.abs(distance) >= CELL * 0.35) {
          let amount = Math.round(
            distance / CELL
          );

          if (amount === 0) {
            amount = distance > 0 ? 1 : -1;
          }

          this.moveCar(car, amount);
        }
      }

      this.pointerStart = null;
    },

    onKeyDown(e) {
      if (
        !this.isRunning ||
        this.isPaused ||
        this.finished
      ) {
        return;
      }

      const car = this.getCarById(
        this.selectedCar
      );

      if (!car) return;

      let direction = 0;

      if (car.horizontal) {
        if (e.key === 'ArrowLeft') {
          direction = -1;
        } else if (e.key === 'ArrowRight') {
          direction = 1;
        }
      } else {
        if (e.key === 'ArrowUp') {
          direction = -1;
        } else if (e.key === 'ArrowDown') {
          direction = 1;
        }
      }

      if (direction !== 0) {
        e.preventDefault();
        this.moveCar(car, direction);
      }
    },

    winGame() {
      if (this.finished) return;

      this.finished = true;
      this.isRunning = false;

      const elapsedSeconds = Math.floor(
        (Date.now() - this.startTime) / 1000
      );

      const timeBonus = Math.max(
        0,
        200 - elapsedSeconds
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

    draw() {
      const ctx = this.ctx;

      if (!ctx) return;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Header
      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'UNBLOCK ESCAPE',
        WIDTH / 2,
        36
      );

      ctx.fillStyle = COLORS.muted;
      ctx.font = '12px Arial';
      ctx.fillText(
        'Move the red car to the exit!',
        WIDTH / 2,
        58
      );

      // Stats
      this.drawRoundedRect(
        35,
        68,
        150,
        27,
        8,
        COLORS.panel
      );

      this.drawRoundedRect(
        215,
        68,
        150,
        27,
        8,
        COLORS.panel
      );

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 12px Arial';

      ctx.fillText(
        `MOVES: ${this.moves}`,
        110,
        86
      );

      ctx.fillText(
        `SCORE: ${this.score}`,
        290,
        86
      );

      // Grid
      this.drawRoundedRect(
        GRID_X - 4,
        GRID_Y - 4,
        CELL * SIZE + 8,
        CELL * SIZE + 8,
        10,
        COLORS.panel
      );

      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;

      for (let i = 0; i <= SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(
          GRID_X + i * CELL,
          GRID_Y
        );
        ctx.lineTo(
          GRID_X + i * CELL,
          GRID_Y + SIZE * CELL
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(
          GRID_X,
          GRID_Y + i * CELL
        );
        ctx.lineTo(
          GRID_X + SIZE * CELL,
          GRID_Y + i * CELL
        );
        ctx.stroke();
      }

      // Exit
      ctx.fillStyle = COLORS.success;
      ctx.fillRect(
        GRID_X + SIZE * CELL,
        GRID_Y + CELL * 2 + 8,
        8,
        CELL - 16
      );

      ctx.fillStyle = COLORS.success;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        'EXIT',
        GRID_X + SIZE * CELL + 10,
        GRID_Y + CELL * 2 + 29
      );

      // Cars
      this.cars.forEach((car, index) => {
        const x =
          GRID_X + car.col * CELL + 4;

        const y =
          GRID_Y + car.row * CELL + 4;

        const width = car.horizontal
          ? car.length * CELL - 8
          : CELL - 8;

        const height = car.horizontal
          ? CELL - 8
          : car.length * CELL - 8;

        const color =
          car.id === 'target'
            ? COLORS.target
            : COLORS.cars[
                index % COLORS.cars.length
              ];

        this.drawRoundedRect(
          x,
          y,
          width,
          height,
          9,
          color
        );

        if (car.id === this.selectedCar) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;

          ctx.strokeRect(
            x + 2,
            y + 2,
            width - 4,
            height - 4
          );
        }

        // Car window
        ctx.fillStyle =
          'rgba(255,255,255,0.22)';

        if (car.horizontal) {
          ctx.fillRect(
            x + width * 0.25,
            y + 9,
            width * 0.5,
            height - 18
          );
        } else {
          ctx.fillRect(
            x + 9,
            y + height * 0.25,
            width - 18,
            height * 0.5
          );
        }

        if (car.id === 'target') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';

          ctx.fillText(
            'YOU',
            x + width / 2,
            y + height / 2 + 4
          );
        }
      });

      // Instructions
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 13px Arial';

      ctx.fillText(
        'SELECT A CAR AND MOVE IT',
        WIDTH / 2,
        420
      );

      ctx.fillStyle = COLORS.muted;
      ctx.font = '11px Arial';

      ctx.fillText(
        'Drag a car or use the arrow buttons',
        WIDTH / 2,
        438
      );

      // Movement buttons
      this.drawRoundedRect(
        25,
        445,
        125,
        38,
        8,
        '#26364c'
      );

      this.drawRoundedRect(
        250,
        445,
        125,
        38,
        8,
        '#26364c'
      );

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';

      ctx.fillText(
        '← BACK',
        87,
        470
      );

      ctx.fillText(
        'FORWARD →',
        312,
        470
      );

      // Reset button
      this.drawRoundedRect(
        130,
        490,
        140,
        35,
        8,
        '#17394a'
      );

      ctx.fillStyle = COLORS.accent;
      ctx.font = 'bold 13px Arial';

      ctx.fillText(
        'RESET PUZZLE',
        WIDTH / 2,
        512
      );

      // Win screen
      if (this.finished) {
        ctx.fillStyle =
          'rgba(5,10,20,0.88)';

        ctx.fillRect(
          0,
          0,
          WIDTH,
          HEIGHT
        );

        ctx.fillStyle = COLORS.success;
        ctx.font = 'bold 26px Arial';
        ctx.textAlign = 'center';

        ctx.fillText(
          'ESCAPE SUCCESSFUL!',
          WIDTH / 2,
          235
        );

        ctx.fillStyle = COLORS.text;
        ctx.font = '16px Arial';

        ctx.fillText(
          `Moves: ${this.moves}`,
          WIDTH / 2,
          275
        );

        ctx.fillText(
          `Final Score: ${this.score}`,
          WIDTH / 2,
          305
        );
      }
    }
  };
})();