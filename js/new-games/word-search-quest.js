
(function () {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['word-search-quest'] = {
    id: 'word-search-quest',
    title: 'Word Search Quest',
    category: 'Puzzle',
    description: 'Find hidden words in a letter grid!',
    instructions: 'Select letters by dragging across the grid. Find all the hidden words.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    size: 8,
    grid: [],
    words: [],
    foundWords: [],
    selectedCells: [],
    wordPaths: {},
    remainingWordPool: [],

    selecting: false,
    elapsed: 0,
    score: 0,
    finished: false,
    message: 'FIND ALL HIDDEN WORDS!',
    messageTimer: 0,
    lastTime: 0,

    wordBank: [
      'APPLE', 'TIGER', 'OCEAN', 'PLANT',
      'BRAIN', 'SPACE', 'MUSIC', 'HOUSE',
      'ROBOT', 'MANGO', 'RIVER', 'CLOUD',
      'SMILE', 'TRAIN', 'WATER', 'EARTH',
      'LIGHT', 'DREAM', 'SNAKE', 'HORSE',
      'BREAD', 'GRAPE', 'FLAME', 'STONE',
      'BEACH', 'SUGAR', 'PANDA', 'HEART',
      'MOUSE', 'SHEEP', 'JUICE', 'LEMON'
    ],

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;

      this.canvas.width = 400;
      this.canvas.height = 540;

      this.boundPointerDown = this.onPointerDown.bind(this);
      this.boundPointerMove = this.onPointerMove.bind(this);
      this.boundPointerUp = this.onPointerUp.bind(this);

      this.canvas.addEventListener('pointerdown', this.boundPointerDown);
      this.canvas.addEventListener('pointermove', this.boundPointerMove);
      this.canvas.addEventListener('pointerup', this.boundPointerUp);
      this.canvas.addEventListener('pointercancel', this.boundPointerUp);

      this.canvas.style.touchAction = 'none';

      this.generatePuzzle();
    },

    shuffle(array) {
      const result = [...array];

      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      return result;
    },

    generatePuzzle() {
      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [-1, 1]
      ];

      this.foundWords = [];
      this.selectedCells = [];
      this.wordPaths = {};
      this.words = [];

      const shuffled = this.shuffle(this.wordBank);

      this.remainingWordPool = shuffled.slice(8);

      let puzzleCreated = false;

      for (let attempt = 0; attempt < 100 && !puzzleCreated; attempt++) {
        this.grid = Array.from({ length: this.size }, () =>
          Array(this.size).fill('')
        );

        this.wordPaths = {};
        this.words = [];

        const initialWords = this.shuffle(shuffled.slice(0, 8));
        let allPlaced = true;

        for (const word of initialWords) {
          if (this.placeWord(word, directions)) {
            this.words.push(word);
          } else {
            allPlaced = false;
            break;
          }
        }

        if (allPlaced) {
          puzzleCreated = true;
        }
      }

      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (!this.grid[r][c]) {
            this.grid[r][c] =
              letters[Math.floor(Math.random() * letters.length)];
          }
        }
      }

      if (!puzzleCreated) {
        this.words = [];
        this.remainingWordPool = [];
      }
    },

    placeWord(word, directions) {
      const placements = [];

      const reserved = {};

      // Protect existing active and found word paths
      Object.entries(this.wordPaths).forEach(([existingWord, path]) => {
        path.forEach((cell, index) => {
          const key = `${cell.row},${cell.col}`;

          reserved[key] = existingWord[index];
        });
      });

      for (const [dr, dc] of directions) {
        for (let row = 0; row < this.size; row++) {
          for (let col = 0; col < this.size; col++) {
            const endRow = row + dr * (word.length - 1);
            const endCol = col + dc * (word.length - 1);

            if (
              endRow < 0 || endRow >= this.size ||
              endCol < 0 || endCol >= this.size
            ) continue;

            let valid = true;

            for (let i = 0; i < word.length; i++) {
              const r = row + dr * i;
              const c = col + dc * i;
              const key = `${r},${c}`;

              if (
                reserved[key] &&
                reserved[key] !== word[i]
              ) {
                valid = false;
                break;
              }
            }

            if (valid) {
              placements.push({ row, col, dr, dc });
            }
          }
        }
      }

      if (placements.length === 0) return false;

      const chosen = placements[
        Math.floor(Math.random() * placements.length)
      ];

      const path = [];

      for (let i = 0; i < word.length; i++) {
        const r = chosen.row + chosen.dr * i;
        const c = chosen.col + chosen.dc * i;

        this.grid[r][c] = word[i];

        path.push({
          row: r,
          col: c
        });
      }

      this.wordPaths[word] = path;

      return true;
    },

    addNextWord() {
      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [-1, 1]
      ];

      while (this.remainingWordPool.length > 0) {
        const nextWord = this.remainingWordPool.shift();

        if (this.placeWord(nextWord, directions)) {
          this.words.push(nextWord);

          this.showMessage('NEW WORD: ' + nextWord);

          return true;
        }
      }

      return false;
    },

    start() {
      this.reset();

      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();

      this.loop();
    },

    reset() {
      this.generatePuzzle();

      this.elapsed = 0;
      this.score = 0;
      this.finished = false;
      this.selecting = false;
      this.selectedCells = [];

      this.message = 'FIND ALL HIDDEN WORDS!';
      this.messageTimer = 0;

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

      this.canvas.addEventListener('pointerdown', this.boundPointerDown);
      this.canvas.addEventListener('pointermove', this.boundPointerMove);
      this.canvas.addEventListener('pointerup', this.boundPointerUp);
      this.canvas.addEventListener('pointercancel', this.boundPointerUp);

      this.start();
    },

    destroy() {
      this.isRunning = false;
      this.selecting = false;

      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }

      if (this.canvas) {
        this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
        this.canvas.removeEventListener('pointermove', this.boundPointerMove);
        this.canvas.removeEventListener('pointerup', this.boundPointerUp);
        this.canvas.removeEventListener('pointercancel', this.boundPointerUp);
      }
    },

    showMessage(message) {
      this.message = message;
      this.messageTimer = 2;
    },

    getCellFromPointer(e) {
      const rect = this.canvas.getBoundingClientRect();

      const x = (e.clientX - rect.left) * (400 / rect.width);
      const y = (e.clientY - rect.top) * (540 / rect.height);

      const gridX = 32;
      const gridY = 105;
      const cellSize = 42;

      const col = Math.floor((x - gridX) / cellSize);
      const row = Math.floor((y - gridY) / cellSize);

      if (
        row < 0 || row >= this.size ||
        col < 0 || col >= this.size
      ) return null;

      return { row, col };
    },

    onPointerDown(e) {
      if (!this.isRunning || this.isPaused || this.finished) return;

      const cell = this.getCellFromPointer(e);
      if (!cell) return;

      this.selecting = true;
      this.selectedCells = [cell];

      if (this.canvas.setPointerCapture) {
        this.canvas.setPointerCapture(e.pointerId);
      }
    },

    onPointerMove(e) {
      if (!this.selecting || this.isPaused || this.finished) return;

      const cell = this.getCellFromPointer(e);
      if (!cell) return;

      const last = this.selectedCells[this.selectedCells.length - 1];

      if (last.row === cell.row && last.col === cell.col) return;

      this.selectedCells = this.getStraightSelection(
        this.selectedCells[0],
        cell
      );
    },

    onPointerUp() {
      if (!this.selecting) return;

      this.selecting = false;

      if (this.selectedCells.length > 1) {
        this.checkSelection();
      }

      this.selectedCells = [];
    },

    getStraightSelection(start, end) {
      const dr = end.row - start.row;
      const dc = end.col - start.col;

      if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
        return [start];
      }

      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const result = [];

      for (let i = 0; i <= steps; i++) {
        result.push({
          row: start.row + Math.sign(dr) * i,
          col: start.col + Math.sign(dc) * i
        });
      }

      return result;
    },

    checkSelection() {
      const selectedWord = this.selectedCells
        .map(cell => this.grid[cell.row][cell.col])
        .join('');

      const reverseWord = selectedWord.split('').reverse().join('');

      const match = this.words.find(word =>
        word === selectedWord || word === reverseWord
      );

      if (!match) {
        this.showMessage('NOT A HIDDEN WORD!');
        return;
      }

      if (this.foundWords.includes(match)) {
        this.showMessage('WORD ALREADY FOUND!');
        return;
      }

      // Mark word as found
      this.foundWords.push(match);

      this.score += 100;

      if (this.callbacks) {
        this.callbacks.onScore(this.score);
      }

      // Remove completed word from active list
      this.words = this.words.filter(word => word !== match);

      this.showMessage(`${match} FOUND! +100`);

      // Immediately introduce the next random word
      const added = this.addNextWord();

      // Finish only when all available words are completed
      if (this.words.length === 0 && !added) {
        this.winGame();
      }
    },

    winGame() {
      if (this.finished) return;

      this.finished = true;
      this.isRunning = false;

      this.score += Math.max(0, 300 - Math.floor(this.elapsed));

      if (this.callbacks) {
        this.callbacks.onScore(this.score);
      }

      this.showMessage('ALL WORDS FOUND!');

      setTimeout(() => {
        if (this.callbacks) {
          this.callbacks.onGameOver(this.score);
        }
      }, 1500);
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

      ctx.fillStyle = '#080d1c';
      ctx.fillRect(0, 0, 400, 540);

      ctx.textAlign = 'center';

      ctx.fillStyle = '#00eaff';
      ctx.font = 'bold 21px monospace';
      ctx.fillText('WORD SEARCH QUEST', 200, 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText('FIND THE HIDDEN WORDS', 200, 54);

      const gridX = 32;
      const gridY = 105;
      const cellSize = 42;

      // Draw grid
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          const x = gridX + c * cellSize;
          const y = gridY + r * cellSize;

          const isSelected = this.selectedCells.some(cell =>
            cell.row === r && cell.col === c
          );

          const isFound = this.foundWords.some(word =>
            this.isCellInFoundWord(r, c, word)
          );

          ctx.fillStyle = isSelected
            ? '#087f91'
            : isFound
              ? '#14532d'
              : '#17243a';

          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

          ctx.strokeStyle = '#334b68';
          ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px monospace';

          ctx.fillText(
            this.grid[r][c],
            x + cellSize / 2,
            y + 27
          );
        }
      }

      // Active word list
      ctx.fillStyle = '#00eaff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('FIND THESE WORDS', 200, 466);

      this.words.forEach((word, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);

        const x = 55 + col * 98;
        const y = 489 + row * 22;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 11px monospace';

        ctx.fillText(word, x, y);
      });

      // Progress and timer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';

      ctx.fillText(
        `FOUND ${this.foundWords.length}  |  REMAINING ${this.words.length}  |  TIME ${Math.floor(this.elapsed)}s`,
        200,
        535
      );

      // Messages
      if (this.messageTimer > 0 || this.finished) {
        ctx.fillStyle = '#ffe600';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(this.message, 200, 82);
      }
    },

    isCellInFoundWord(row, col, word) {
      if (!this.foundWords.includes(word)) return false;

      const path = this.wordPaths[word];

      if (!path) return false;

      return path.some(cell =>
        cell.row === row && cell.col === col
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
