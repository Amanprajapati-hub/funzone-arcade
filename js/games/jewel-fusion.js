/**
 * Game 8: Jewel Fusion (Puzzle)
 * Match-3 Cascade Grid Puzzle
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['jewel-fusion'] = {
    id: 'jewel-fusion',
    title: 'Jewel Fusion',
    category: 'Puzzle',
    description: 'Swap and match luminous cyber gems! Trigger cascading chain reactions and unleash bomb gems.',
    instructions: 'Click two adjacent gems to swap and form rows or columns of 3 or more matching colors.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    cols: 7,
    rows: 7,
    tileSize: 54,
    offsetX: 11,
    offsetY: 60,

    grid: [],
    selectedTile: null,
    isSwapping: false,
    particles: [],
    score: 0,
    timeRemaining: 60,
    comboCount: 1,

    gemTypes: [
      { id: 0, name: 'Ruby', color: '#ff0055', shape: 'diamond' },
      { id: 1, name: 'Sapphire', color: '#00f0ff', shape: 'circle' },
      { id: 2, name: 'Emerald', color: '#00ff88', shape: 'square' },
      { id: 3, name: 'Citrine', color: '#ffe600', shape: 'triangle' },
      { id: 4, name: 'Amethyst', color: '#a855f7', shape: 'hex' }
    ],

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 400;
      this.canvas.height = 460;

      this.boundMouseDown = this.onMouseDown.bind(this);
      this.canvas.addEventListener('mousedown', this.boundMouseDown);
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
      this.timeRemaining = 60;
      this.comboCount = 1;
      this.selectedTile = null;
      this.isSwapping = false;
      this.particles = [];
      this.createBoard();
      this.callbacks.onScore(0);
      this.callbacks.onLives(60);
    },

    createBoard() {
      this.grid = [];
      for (let r = 0; r < this.rows; r++) {
        this.grid[r] = [];
        for (let c = 0; c < this.cols; c++) {
          let type;
          do {
            type = Math.floor(Math.random() * this.gemTypes.length);
          } while (
            (c >= 2 && this.grid[r][c - 1]?.type === type && this.grid[r][c - 2]?.type === type) ||
            (r >= 2 && this.grid[r - 1][c]?.type === type && this.grid[r - 2][c]?.type === type)
          );
          this.grid[r][c] = {
            type: type,
            r: r,
            c: c,
            isBomb: false
          };
        }
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

      if (this.canvas && this.boundMouseDown) {
        this.canvas.addEventListener('mousedown', this.boundMouseDown);
      }

      this.start();
    },

    destroy() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.canvas) {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      }
    },

    onMouseDown(e) {
      if (!this.isRunning || this.isPaused || this.isSwapping) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const c = Math.floor((mx - this.offsetX) / this.tileSize);
      const r = Math.floor((my - this.offsetY) / this.tileSize);

      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        this.handleClickTile(r, c);
      }
    },

    handleInput(action, isDown) {
      // Mobile / keyboard helper
      if (action === 'actionA' && isDown && this.selectedTile) {
        this.selectedTile = null;
      }
    },

    handleClickTile(r, c) {
      window.ArcadeAudio.playClick();
      if (!this.selectedTile) {
        this.selectedTile = { r, c };
      } else {
        const prev = this.selectedTile;
        const isAdj = (Math.abs(prev.r - r) + Math.abs(prev.c - c)) === 1;

        if (isAdj) {
          this.swapTiles(prev.r, prev.c, r, c);
          this.selectedTile = null;
        } else {
          this.selectedTile = { r, c };
        }
      }
    },

    swapTiles(r1, c1, r2, c2) {
      const t1 = this.grid[r1][c1];
      const t2 = this.grid[r2][c2];

      // Swap
      this.grid[r1][c1] = t2;
      this.grid[r2][c2] = t1;
      t2.r = r1; t2.c = c1;
      t1.r = r2; t1.c = c2;

      // Check matches
      const matches = this.checkMatches();
      if (matches.length > 0) {
        this.comboCount = 1;
        this.processMatches(matches);
      } else {
        // Swap back
        setTimeout(() => {
          this.grid[r1][c1] = t1;
          this.grid[r2][c2] = t2;
          t1.r = r1; t1.c = c1;
          t2.r = r2; t2.c = c2;
          window.ArcadeAudio.playHit(200);
        }, 180);
      }
    },

    checkMatches() {
      const matched = new Set();

      // Check rows
      for (let r = 0; r < this.rows; r++) {
        let matchLength = 1;
        for (let c = 0; c < this.cols; c++) {
          const current = this.grid[r][c];
          const next = c < this.cols - 1 ? this.grid[r][c + 1] : null;

          if (next && current && next.type === current.type) {
            matchLength++;
          } else {
            if (matchLength >= 3) {
              for (let k = 0; k < matchLength; k++) {
                matched.add(`${r},${c - k}`);
              }
            }
            matchLength = 1;
          }
        }
      }

      // Check columns
      for (let c = 0; c < this.cols; c++) {
        let matchLength = 1;
        for (let r = 0; r < this.rows; r++) {
          const current = this.grid[r][c];
          const next = r < this.rows - 1 ? this.grid[r + 1][c] : null;

          if (next && current && next.type === current.type) {
            matchLength++;
          } else {
            if (matchLength >= 3) {
              for (let k = 0; k < matchLength; k++) {
                matched.add(`${r - k},${c}`);
              }
            }
            matchLength = 1;
          }
        }
      }

      return Array.from(matched).map(coord => {
        const [r, c] = coord.split(',').map(Number);
        return { r, c };
      });
    },

    processMatches(matches) {
      if (matches.length === 0) {
        this.isSwapping = false;
        return;
      }

      this.isSwapping = true;
      window.ArcadeAudio.playCombo(this.comboCount);

      // Remove matched gems and spawn sparks
      matches.forEach(m => {
        const gem = this.grid[m.r][m.c];
        if (gem) {
          const x = this.offsetX + m.c * this.tileSize + this.tileSize / 2;
          const y = this.offsetY + m.r * this.tileSize + this.tileSize / 2;
          this.createSparks(x, y, this.gemTypes[gem.type]?.color || '#ffffff', 8);
          this.grid[m.r][m.c] = null;
        }
      });

      this.score += matches.length * 30 * this.comboCount;
      this.timeRemaining = Math.min(60, this.timeRemaining + matches.length * 0.4);
      this.callbacks.onScore(this.score);

      // Cascade drop after short delay
      setTimeout(() => {
        this.dropGems();
        const nextMatches = this.checkMatches();
        if (nextMatches.length > 0) {
          this.comboCount++;
          this.processMatches(nextMatches);
        } else {
          this.isSwapping = false;
        }
      }, 220);
    },

    dropGems() {
      for (let c = 0; c < this.cols; c++) {
        let emptyRow = this.rows - 1;
        for (let r = this.rows - 1; r >= 0; r--) {
          if (this.grid[r][c] !== null) {
            if (emptyRow !== r) {
              this.grid[emptyRow][c] = this.grid[r][c];
              this.grid[emptyRow][c].r = emptyRow;
              this.grid[r][c] = null;
            }
            emptyRow--;
          }
        }
        // Fill tops with new gems
        for (let r = emptyRow; r >= 0; r--) {
          const type = Math.floor(Math.random() * this.gemTypes.length);
          this.grid[r][c] = {
            type: type,
            r: r,
            c: c,
            isBomb: false
          };
        }
      }
    },

    createSparks(x, y, color = '#ff0055', count = 8) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          radius: Math.random() * 2.5 + 1.5,
          color: color,
          life: 0.7
        });
      }
    },

    update(dt) {
      this.timeRemaining -= dt;
      this.callbacks.onLives(Math.max(0, Math.ceil(this.timeRemaining)));

      if (this.timeRemaining <= 0) {
        window.ArcadeAudio.playGameOver();
        this.isRunning = false;
        this.callbacks.onGameOver(this.score);
        return;
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt * 2;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    },

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark futuristic puzzle surface
      ctx.fillStyle = '#080614';
      ctx.fillRect(0, 0, w, h);

      // Top info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`TIME: ${Math.max(0, Math.ceil(this.timeRemaining))}s`, 20, 30);
      if (this.comboCount > 1) {
        ctx.fillStyle = '#ffe600';
        ctx.fillText(`${this.comboCount}X CASCADE!`, w - 120, 30);
      }

      // Draw Grid Slots
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const x = this.offsetX + c * this.tileSize;
          const y = this.offsetY + r * this.tileSize;

          ctx.fillStyle = '#110d24';
          ctx.strokeStyle = '#221940';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 8);
          ctx.fill();
          ctx.stroke();

          // Selected tile border
          if (this.selectedTile && this.selectedTile.r === r && this.selectedTile.c === c) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }

          // Draw Gem
          const gem = this.grid[r][c];
          if (gem) {
            const gemDef = this.gemTypes[gem.type];
            const cx = x + this.tileSize / 2;
            const cy = y + this.tileSize / 2;

            ctx.save();
            ctx.fillStyle = gemDef.color;
            ctx.shadowColor = gemDef.color;
            ctx.shadowBlur = 10;

            if (gemDef.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(cx, cy, 15, 0, Math.PI * 2);
              ctx.fill();
            } else if (gemDef.shape === 'diamond') {
              ctx.beginPath();
              ctx.moveTo(cx, cy - 16);
              ctx.lineTo(cx + 16, cy);
              ctx.lineTo(cx, cy + 16);
              ctx.lineTo(cx - 16, cy);
              ctx.closePath();
              ctx.fill();
            } else if (gemDef.shape === 'square') {
              ctx.beginPath();
              ctx.roundRect(cx - 13, cy - 13, 26, 26, 4);
              ctx.fill();
            } else if (gemDef.shape === 'triangle') {
              ctx.beginPath();
              ctx.moveTo(cx, cy - 16);
              ctx.lineTo(cx + 15, cy + 13);
              ctx.lineTo(cx - 15, cy + 13);
              ctx.closePath();
              ctx.fill();
            } else {
              // Hexagon
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const px = cx + Math.cos(angle) * 15;
                const py = cy + Math.sin(angle) * 15;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.fill();
            }
            ctx.restore();
          }
        }
      }

      // Draw Particles
      for (const pt of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
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
