/**
 * Game 13: Codebreaker
 * Crack the secret four-digit code.
 */
(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['codebreaker'] = {
    id: 'codebreaker',
    title: 'Codebreaker',
    category: 'Puzzle',
    description: 'Crack the secret code using logic, deduction and clever guesses!',
    instructions: 'Guess the four-digit secret code. Green means correct digit and position. Yellow means correct digit but wrong position.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    secret: [],
    currentGuess: '',
    attempts: [],
    maxAttempts: 10,
    score: 0,
    elapsed: 0,
    difficulty: 'Easy',
    message: 'CRACK THE SECRET CODE',
    messageTimer: 0,
    finished: false,
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

      this.generateSecret();
    },

    generateSecret() {
      const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      for (let i = digits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digits[i], digits[j]] = [digits[j], digits[i]];
      }

      this.secret = digits.slice(0, 4);
    },

    start() {
      this.reset();
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop();
    },

    reset() {
      this.generateSecret();
      this.currentGuess = '';
      this.attempts = [];
      this.score = 0;
      this.elapsed = 0;
      this.finished = false;
      this.message = 'CRACK THE SECRET CODE';
      this.messageTimer = 0;

      this.maxAttempts = this.difficulty === 'Easy' ? 10 :
        this.difficulty === 'Medium' ? 8 : 6;

      if (this.callbacks) {
  this.callbacks.onScore(0);
  this.callbacks.onLives(this.maxAttempts);
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
  const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

  // Difficulty buttons
  if (y >= 78 && y <= 106) {
    if (x >= 15 && x <= 125) this.changeDifficulty('Easy');
    else if (x >= 145 && x <= 255) this.changeDifficulty('Medium');
    else if (x >= 275 && x <= 385) this.changeDifficulty('Hard');
    return;
  }

  // Number keypad: 1 to 9
  if (y >= 315 && y <= 423) {
    for (let n = 1; n <= 9; n++) {
      const col = (n - 1) % 3;
      const row = Math.floor((n - 1) / 3);
      const keyX = 90 + col * 75;
      const keyY = 315 + row * 38;

      if (
        x >= keyX && x <= keyX + 65 &&
        y >= keyY && y <= keyY + 32
      ) {
        this.addDigit(n);
        return;
      }
    }
  }

  // Zero button
  if (x >= 165 && x <= 230 && y >= 429 && y <= 459) {
    this.addDigit(0);
    return;
  }

  // Action buttons
  if (y >= 470 && y <= 502) {
    if (x >= 25 && x <= 115) {
      this.deleteDigit();
    } else if (x >= 155 && x <= 245) {
      this.submitGuess();
    } else if (x >= 285 && x <= 375) {
      this.newGame();
    }
  }
},


    onKeyDown(e) {
      if (!this.isRunning || this.isPaused || this.finished) return;

      if (/^\d$/.test(e.key)) {
        this.addDigit(Number(e.key));
      } else if (e.key === 'Backspace') {
        this.deleteDigit();
      } else if (e.key === 'Enter') {
        this.submitGuess();
      }
    },

    addDigit(number) {
      if (this.currentGuess.length >= 4) return;
      if (this.currentGuess.includes(String(number))) {
        this.showMessage('NO REPEATED DIGITS!');
        return;
      }

      this.currentGuess += String(number);
    },

    deleteDigit() {
      this.currentGuess = this.currentGuess.slice(0, -1);
    },

    submitGuess() {
      if (this.currentGuess.length !== 4) {
        this.showMessage('ENTER FOUR UNIQUE DIGITS');
        return;
      }

      const guess = this.currentGuess.split('').map(Number);

      let exact = 0;
      let misplaced = 0;

      guess.forEach((digit, i) => {
        if (digit === this.secret[i]) {
          exact++;
        } else if (this.secret.includes(digit)) {
          misplaced++;
        }
      });

      this.attempts.push({
        guess: [...guess],
        exact,
        misplaced
      });

      this.currentGuess = '';

      this.callbacks.onLives(this.maxAttempts - this.attempts.length);

      if (exact === 4) {
        this.winGame();
        return;
      }

      this.score = Math.max(0, this.score + exact * 20 + misplaced * 10);
      this.callbacks.onScore(this.score);

      this.showMessage(`${exact} EXACT • ${misplaced} MISPLACED`);

      if (this.attempts.length >= this.maxAttempts) {
        this.endGame();
      }
    },

    changeDifficulty(level) {
      if (this.difficulty === level) return;
      this.difficulty = level;
      this.newGame();
    },

    newGame() {
      this.reset();
      this.showMessage('NEW CODE GENERATED!');
    },

    
winGame() {
  if (this.finished) return;

  this.finished = true;
  this.isRunning = false;

  const bonus = Math.max(0, 300 - this.elapsed * 2);
  this.score += Math.floor(bonus);

  this.callbacks.onScore(this.score);
  this.showMessage('CODE CRACKED! ACCESS GRANTED!');

  setTimeout(() => {
    if (this.callbacks && this.finished) {
      this.callbacks.onGameOver(this.score);
    }
  }, 1500);
},


    
endGame() {
  if (this.finished) return;

  this.finished = true;
  this.isRunning = false;

  this.showMessage(`CODE LOST! ${this.secret.join('')}`);

  setTimeout(() => {
    if (this.callbacks && this.finished) {
      this.callbacks.onGameOver(this.score);
    }
  }, 1500);
},


    update(dt) {
      if (this.finished) return;

      this.elapsed += dt;
      if (this.messageTimer > 0) this.messageTimer -= dt;
    },

    
draw() {
  const ctx = this.ctx;

  ctx.fillStyle = '#070b18';
  ctx.fillRect(0, 0, 400, 540);
  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('CODEBREAKER', 200, 27);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('CRACK THE 4-DIGIT SECRET CODE', 200, 58);

  // Difficulty buttons
  const levels = ['Easy', 'Medium', 'Hard'];
  const positions = [15, 145, 275];

  levels.forEach((level, i) => {
    ctx.fillStyle = this.difficulty === level ? '#087f91' : '#172338';
    ctx.fillRect(positions[i], 78, 110, 28);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(positions[i], 78, 110, 28);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText(level.toUpperCase(), positions[i] + 55, 96);
  });

  // Current guess
  ctx.fillStyle = '#14233a';
  ctx.fillRect(30, 120, 340, 55);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 120, 340, 55);

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(
    (this.currentGuess + '____').slice(0, 4).split('').join('  '),
    200,
    155
  );

  // Attempt history
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('ATTEMPT HISTORY', 200, 198);

  this.attempts.slice(-3).forEach((attempt, index) => {
    const y = 220 + index * 27;

    ctx.fillStyle = '#132139';
    ctx.fillRect(35, y - 15, 330, 23);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(attempt.guess.join(' '), 48, y + 1);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff88';
    ctx.font = '10px monospace';
    ctx.fillText(`EXACT ${attempt.exact}`, 235, y + 1);

    ctx.fillStyle = '#ffe600';
    ctx.fillText(`NEAR ${attempt.misplaced}`, 350, y + 1);
  });

  // Message
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00f0ff';
  ctx.font = '10px monospace';
  ctx.fillText(
    this.messageTimer > 0 || this.finished
      ? this.message
      : 'GREEN = EXACT  •  YELLOW = MISPLACED',
    200,
    302
  );

  // Number keypad: 1 to 9
  for (let n = 1; n <= 9; n++) {
    const col = (n - 1) % 3;
    const row = Math.floor((n - 1) / 3);
    const x = 90 + col * 75;
    const y = 315 + row * 38;

    ctx.fillStyle = '#172a40';
    ctx.fillRect(x, y, 65, 32);

    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(x, y, 65, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(n, x + 32, y + 22);
  }

  // Zero button
  ctx.fillStyle = '#172a40';
  ctx.fillRect(165, 429, 65, 30);
  ctx.strokeStyle = '#00f0ff';
  ctx.strokeRect(165, 429, 65, 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('0', 197, 449);

  // Action buttons
  const actions = [
    { x: 25, text: 'DELETE' },
    { x: 155, text: 'SUBMIT' },
    { x: 285, text: 'RESET' }
  ];

  actions.forEach(action => {
    ctx.fillStyle = '#172a40';
    ctx.fillRect(action.x, 470, 90, 32);

    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(action.x, 470, 90, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(action.text, action.x + 45, 490);
  });

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(
    `ATTEMPTS LEFT: ${this.maxAttempts - this.attempts.length}  |  TIME: ${Math.floor(this.elapsed)}s`,
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