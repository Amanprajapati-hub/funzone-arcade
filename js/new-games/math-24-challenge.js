
(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['math-24-challenge'] = {
    id: 'math-24-challenge',
    title: 'Math 24 Challenge',
    category: 'Puzzle',
    description: 'Use four numbers and arithmetic operations to reach the target!',
    instructions: 'Select a number, choose an operation, then select another number to reach the target.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    numbers: [],
    used: [],
    selected: null,
    operation: null,
    result: null,
    expression: '',
    target: 24,
    lastTarget: null,
    lastPuzzleKey: '',

    elapsed: 0,
    score: 0,
    rounds: 0,
    finished: false,
    message: 'MAKE THE TARGET NUMBER!',
    messageTimer: 0,
    lastTime: 0,

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

      this.newPuzzle();
    },

    shuffle(array) {
      const result = [...array];

      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      return result;
    },

    generateRandomPuzzle() {
      const operations = ['+', '-', '×', '÷'];

      for (let attempt = 0; attempt < 1000; attempt++) {
        const values = Array.from(
          { length: 4 },
          () => Math.floor(Math.random() * 9) + 1
        );

        const shuffled = this.shuffle(values);
        const selectedOperations = this.shuffle(operations).slice(0, 3);

        let result = shuffled[0];

        for (let i = 0; i < 3; i++) {
          const next = shuffled[i + 1];
          const op = selectedOperations[i];

          switch (op) {
            case '+':
              result += next;
              break;

            case '-':
              result -= next;
              break;

            case '×':
              result *= next;
              break;

            case '÷':
              if (next === 0) {
                result = NaN;
              } else {
                result /= next;
              }
              break;
          }
        }

        if (
          !Number.isFinite(result) ||
          result <= 0 ||
          result > 99 ||
          Math.abs(result - Math.round(result)) > 0.000001
        ) {
          continue;
        }

        const target = Math.round(result);
        const puzzleKey = [...values].sort((a, b) => a - b).join(',');

        if (
          target === this.lastTarget ||
          puzzleKey === this.lastPuzzleKey
        ) {
          continue;
        }

        this.lastTarget = target;
        this.lastPuzzleKey = puzzleKey;

        return {
          numbers: values,
          target
        };
      }

      // Guaranteed solvable fallback using addition
      let values;
      let target;

      do {
        values = Array.from(
          { length: 4 },
          () => Math.floor(Math.random() * 9) + 1
        );

        target = values.reduce((sum, value) => sum + value, 0);
      } while (
        target === this.lastTarget ||
        [...values].sort((a, b) => a - b).join(',') === this.lastPuzzleKey
      );

      this.lastTarget = target;
      this.lastPuzzleKey = [...values].sort((a, b) => a - b).join(',');

      return {
        numbers: values,
        target
      };
    },

    newPuzzle() {
      const puzzle = this.generateRandomPuzzle();

      this.target = puzzle.target;

      this.numbers = puzzle.numbers.map((value, index) => ({
        id: index,
        value,
        used: false
      }));

      this.used = [];
      this.selected = null;
      this.operation = null;
      this.result = null;
      this.expression = '';
      this.finished = false;

      this.message = 'MAKE ' + this.target + '!';
      this.messageTimer = 2;
    },

    start() {
      this.reset();

      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();

      this.loop();
    },

    reset() {
      this.score = 0;
      this.elapsed = 0;
      this.rounds = 0;

      this.lastTarget = null;
      this.lastPuzzleKey = '';

      this.newPuzzle();

      if (this.callbacks) {
        this.callbacks.onScore(0);
        this.callbacks.onLives(3);
      }
    },

    pause() {
      this.isPaused = true;
    },

    resume() {
      if (!this.isRunning || !this.isPaused) return;

      this.isPaused = false;
      this.lastTime = performance.now();

      this.loop();
    },

    restart() {
      this.destroy();

      this.canvas.addEventListener('pointerdown', this.boundPointer);
      window.addEventListener('keydown', this.boundKey);

      this.start();
    },

    destroy() {
      this.isRunning = false;

      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
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
      if (!this.isRunning || this.isPaused || this.finished) return;

      const rect = this.canvas.getBoundingClientRect();

      const x = (e.clientX - rect.left) * (400 / rect.width);
      const y = (e.clientY - rect.top) * (540 / rect.height);

      // Number cards
      if (y >= 185 && y <= 263) {
        const activeNumbers = this.numbers.filter(n => !n.used);

        for (let i = 0; i < activeNumbers.length; i++) {
          const cardX = 20 + i * 95;

          if (x >= cardX && x <= cardX + 78) {
            this.selectNumber(i);
            return;
          }
        }
      }

      // Operations
      if (y >= 310 && y <= 360) {
        const operations = ['+', '-', '×', '÷'];

        for (let i = 0; i < operations.length; i++) {
          const buttonX = 20 + i * 95;

          if (x >= buttonX && x <= buttonX + 78) {
            this.selectOperation(operations[i]);
            return;
          }
        }
      }

      // Actions
      if (y >= 435 && y <= 475) {
        if (x >= 25 && x <= 135) {
          this.undo();
        } else if (x >= 145 && x <= 255) {
          this.submit();
        } else if (x >= 265 && x <= 375) {
          this.newPuzzle();
        }
      }
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused || this.finished) return;

      if (e.key === 'Escape' || e.key === 'Backspace') {
        this.undo();
      } else if (e.key === 'Enter') {
        this.submit();
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        const map = { '*': '×', '/': '÷' };
        this.selectOperation(map[e.key] || e.key);
      }
    },

    selectNumber(index) {
      const activeNumbers = this.numbers.filter(n => !n.used);
      const item = activeNumbers[index];

      if (!item) return;

      if (this.selected === null) {
        this.selected = item.id;
        this.showMessage(
          'SELECTED ' + this.formatNumber(item.value)
        );
        return;
      }

      if (!this.operation) {
        this.selected = item.id;
        this.showMessage('CHOOSE AN OPERATION');
        return;
      }

      this.calculate(item.id);
    },

    selectOperation(operation) {
      if (this.selected === null) {
        this.showMessage('SELECT A NUMBER FIRST');
        return;
      }

      if (this.operation) {
        this.showMessage('COMPLETE YOUR CURRENT STEP');
        return;
      }

      this.operation = operation;
      this.showMessage('NOW SELECT ANOTHER NUMBER');
    },

    calculate(secondId) {
      const first = this.numbers.find(n => n.id === this.selected);
      const second = this.numbers.find(n => n.id === secondId);

      if (
        !first ||
        !second ||
        first.used ||
        second.used ||
        first.id === second.id
      ) {
        return;
      }

      let value;

      switch (this.operation) {
        case '+':
          value = first.value + second.value;
          break;

        case '-':
          value = first.value - second.value;
          break;

        case '×':
          value = first.value * second.value;
          break;

        case '÷':
          if (second.value === 0) {
            this.showMessage('CANNOT DIVIDE BY ZERO');
            return;
          }

          value = first.value / second.value;
          break;

        default:
          return;
      }

      if (!Number.isFinite(value)) return;

      first.used = true;
      second.used = true;

      this.numbers.push({
        id: Math.max(...this.numbers.map(n => n.id)) + 1,
        value,
        used: false
      });

      this.expression =
        `${this.formatNumber(first.value)} ${this.operation} ${this.formatNumber(second.value)}`;

      this.selected = null;
      this.operation = null;

      this.showMessage(
        'RESULT: ' + this.formatNumber(value)
      );

      const remaining = this.numbers.filter(n => !n.used);

      if (remaining.length === 1) {
        this.result = remaining[0].value;

        if (Math.abs(this.result - this.target) < 0.000001) {
          this.winRound();
        } else {
          this.showMessage(
            'NOT ' + this.target + '! RESET AND TRY AGAIN'
          );
        }
      }
    },

    formatNumber(value) {
      return Number.isInteger(value)
        ? String(value)
        : Number(value.toFixed(3)).toString();
    },

    undo() {
      if (!this.used.length && !this.expression) {
        this.showMessage('NOTHING TO UNDO');
        return;
      }

      this.newPuzzle();
      this.showMessage('NEW PUZZLE GENERATED!');
    },

    submit() {
      const remaining = this.numbers.filter(n => !n.used);

      if (remaining.length !== 1) {
        this.showMessage('USE ALL FOUR NUMBERS FIRST');
        return;
      }

      if (Math.abs(remaining[0].value - this.target) < 0.000001) {
        this.winRound();
      } else {
        this.showMessage('NOT ' + this.target + '! TRY AGAIN');
      }
    },

    winRound() {
      if (this.finished) return;

      this.finished = true;
      this.rounds++;

      const bonus = Math.max(0, 200 - Math.floor(this.elapsed));

      this.score += 100 + bonus;

      this.callbacks.onScore(this.score);

      this.showMessage('AMAZING! TARGET REACHED!');

      setTimeout(() => {
        if (!this.callbacks || !this.isRunning) return;

        if (this.rounds >= 5) {
          this.isRunning = false;
          this.callbacks.onGameOver(this.score);
        } else {
          this.newPuzzle();
        }
      }, 1300);
    },

    update(dt) {
      if (this.finished) return;

      this.elapsed += dt;

      if (this.messageTimer > 0) {
        this.messageTimer -= dt;
      }
    },

    draw() {
      const ctx = this.ctx;

      ctx.fillStyle = '#090d1b';
      ctx.fillRect(0, 0, 400, 540);

      ctx.textAlign = 'center';

      // Header
      ctx.fillStyle = '#00eaff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('MATH 24 CHALLENGE', 200, 32);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText('REACH THE RANDOM TARGET', 200, 56);

      // Dynamic Target
      ctx.fillStyle = '#172a40';
      ctx.fillRect(125, 75, 150, 65);

      ctx.strokeStyle = '#00eaff';
      ctx.lineWidth = 2;
      ctx.strokeRect(125, 75, 150, 65);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('TARGET', 200, 97);

      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(String(this.target), 200, 128);

      // Numbers
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('SELECT A NUMBER', 200, 165);

      const activeNumbers = this.numbers.filter(n => !n.used);

      activeNumbers.forEach((item, index) => {
        const x = 20 + index * 95;
        const y = 185;

        ctx.fillStyle = this.selected === item.id
          ? '#087f91'
          : '#172a40';

        ctx.fillRect(x, y, 78, 78);

        ctx.strokeStyle = this.selected === item.id
          ? '#00ff88'
          : '#00eaff';

        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 78, 78);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';

        ctx.fillText(
          this.formatNumber(item.value),
          x + 39,
          y + 47
        );
      });

      // Operations
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('CHOOSE OPERATION', 200, 292);

      const operations = ['+', '-', '×', '÷'];

      operations.forEach((op, index) => {
        const x = 20 + index * 95;
        const y = 310;

        ctx.fillStyle = this.operation === op
          ? '#087f91'
          : '#172a40';

        ctx.fillRect(x, y, 78, 50);

        ctx.strokeStyle = '#00eaff';
        ctx.strokeRect(x, y, 78, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(op, x + 39, y + 33);
      });

      // Expression
      ctx.fillStyle = '#172a40';
      ctx.fillRect(25, 380, 350, 32);

      ctx.fillStyle = '#00ff88';
      ctx.font = '12px monospace';

      ctx.fillText(
        this.expression || 'YOUR CALCULATION WILL APPEAR HERE',
        200,
        401
      );

      // Actions
      const actions = [
        { x: 25, text: 'UNDO' },
        { x: 145, text: 'CHECK' },
        { x: 265, text: 'NEW' }
      ];

      actions.forEach(action => {
        ctx.fillStyle = '#172a40';
        ctx.fillRect(action.x, 435, 110, 40);

        ctx.strokeStyle = '#00eaff';
        ctx.strokeRect(action.x, 435, 110, 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';

        ctx.fillText(
          action.text,
          action.x + 55,
          460
        );
      });

      // Status
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';

      ctx.fillText(
        `ROUNDS ${this.rounds}/5  |  TIME ${Math.floor(this.elapsed)}s`,
        200,
        500
      );

      // Message
      ctx.fillStyle = '#ffe600';
      ctx.font = 'bold 11px monospace';

      ctx.fillText(
        this.messageTimer > 0 || this.finished
          ? this.message
          : 'USE EACH ORIGINAL NUMBER ONCE',
        200,
        525
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
