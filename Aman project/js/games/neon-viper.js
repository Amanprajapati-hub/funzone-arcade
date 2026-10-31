/**
 * Game 4: Neon Viper (Casual)
 * Cyberpunk High-Speed Snake
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['neon-viper'] = {
    id: 'neon-viper',
    title: 'Neon Viper',
    category: 'Casual',
    description: 'Guide the cyber viper across the data grid! Hunt data orbs, trigger combos, and dodge your own glowing tail.',
    instructions: '←/→/↑/↓ or WASD: Steer Viper | Space: Speed Boost',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    gridSize: 20,
    tileCount: 20, // 20x25 = 400x500

    snake: [],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 15, y: 12, type: 'normal' },
    specialFood: null,
    specialTimer: 0,
    score: 0,
    combo: 1,
    comboTimer: 0,
    moveTimer: 0,
    moveInterval: 0.11, // seconds per tile
    particles: [],

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 400;
      this.canvas.height = 500;

      this.boundKeyDown = this.onKeyDown.bind(this);
      window.addEventListener('keydown', this.boundKeyDown);
    },

    start() {
      this.reset();
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop();
    },

    reset() {
      this.snake = [
        { x: 8, y: 12 },
        { x: 7, y: 12 },
        { x: 6, y: 12 }
      ];
      this.dir = { x: 1, y: 0 };
      this.nextDir = { x: 1, y: 0 };
      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.moveTimer = 0;
      this.moveInterval = 0.11;
      this.specialFood = null;
      this.specialTimer = 0;
      this.particles = [];
      this.spawnFood();
      this.callbacks.onScore(0);
      this.callbacks.onLives(1);
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
      this.start();
    },

    destroy() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      window.removeEventListener('keydown', this.boundKeyDown);
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;

      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && this.dir.y === 0) {
        this.nextDir = { x: 0, y: -1 };
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && this.dir.y === 0) {
        this.nextDir = { x: 0, y: 1 };
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && this.dir.x === 0) {
        this.nextDir = { x: -1, y: 0 };
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && this.dir.x === 0) {
        this.nextDir = { x: 1, y: 0 };
      }
    },

    handleInput(action, isDown) {
      if (!this.isRunning || this.isPaused || !isDown) return;
      if (action === 'up' && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
      if (action === 'down' && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
      if (action === 'left' && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
      if (action === 'right' && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
    },

    spawnFood() {
      let valid = false;
      let x, y;
      while (!valid) {
        x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
        y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
        valid = !this.snake.some(segment => segment.x === x && segment.y === y);
      }
      this.food = { x, y, type: 'normal' };
    },

    spawnSpecialFood() {
      let valid = false;
      let x, y;
      while (!valid) {
        x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
        y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
        valid = !this.snake.some(segment => segment.x === x && segment.y === y) && (x !== this.food.x || y !== this.food.y);
      }
      const type = Math.random() < 0.6 ? 'gold' : 'freeze';
      this.specialFood = { x, y, type, life: 7.0 };
    },

    createSparks(x, y, color = '#00ff88', count = 10) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x * this.gridSize + this.gridSize / 2,
          y: y * this.gridSize + this.gridSize / 2,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          radius: Math.random() * 3 + 1.5,
          color: color,
          life: 0.7
        });
      }
    },

    update(dt) {
      // Combo decay
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      // Special food countdown
      if (this.specialFood) {
        this.specialFood.life -= dt;
        if (this.specialFood.life <= 0) {
          this.specialFood = null;
        }
      } else {
        this.specialTimer += dt;
        if (this.specialTimer > 8.0) {
          this.specialTimer = 0;
          this.spawnSpecialFood();
        }
      }

      // Movement step timer
      this.moveTimer += dt;
      if (this.moveTimer >= this.moveInterval) {
        this.moveTimer = 0;
        this.step();
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

    step() {
      this.dir = { ...this.nextDir };
      const head = {
        x: this.snake[0].x + this.dir.x,
        y: this.snake[0].y + this.dir.y
      };

      const cols = this.canvas.width / this.gridSize;
      const rows = this.canvas.height / this.gridSize;

      // Wall collision check
      if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        this.gameOver();
        return;
      }

      // Tail collision check
      for (let i = 0; i < this.snake.length - 1; i++) {
        if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
          this.gameOver();
          return;
        }
      }

      this.snake.unshift(head);

      // Eat Food check
      let ate = false;
      if (head.x === this.food.x && head.y === this.food.y) {
        ate = true;
        this.combo = Math.min(5, this.combo + 1);
        this.comboTimer = 4.0;
        this.score += 20 * this.combo;
        this.callbacks.onScore(this.score);
        window.ArcadeAudio.playCoin();
        this.createSparks(head.x, head.y, '#00f0ff', 12);
        this.spawnFood();

        // Speed up slightly as score rises
        this.moveInterval = Math.max(0.065, 0.11 - (this.score / 2000) * 0.04);
      }

      // Eat Special Food check
      if (this.specialFood && head.x === this.specialFood.x && head.y === this.specialFood.y) {
        ate = true;
        if (this.specialFood.type === 'gold') {
          this.score += 100 * this.combo;
          window.ArcadeAudio.playPowerup();
          this.createSparks(head.x, head.y, '#ffe600', 16);
        } else if (this.specialFood.type === 'freeze') {
          this.moveInterval = 0.14; // slow down for easier control
          window.ArcadeAudio.playPowerup();
          this.createSparks(head.x, head.y, '#a855f7', 16);
        }
        this.callbacks.onScore(this.score);
        this.specialFood = null;
      }

      if (!ate) {
        this.snake.pop();
      }
    },

    gameOver() {
      window.ArcadeAudio.playExplosion();
      this.createSparks(this.snake[0].x, this.snake[0].y, '#ff0055', 24);
      this.isRunning = false;
      this.callbacks.onGameOver(this.score);
    },

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const sz = this.gridSize;

      // Dark cyber background
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      // Grid mesh
      ctx.strokeStyle = '#0e172a';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += sz) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += sz) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw Normal Food (Data Orb)
      ctx.save();
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.food.x * sz + sz / 2, this.food.y * sz + sz / 2, sz * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Special Food
      if (this.specialFood) {
        ctx.save();
        const sf = this.specialFood;
        ctx.fillStyle = sf.type === 'gold' ? '#ffe600' : '#a855f7';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(sf.x * sz + sz / 2, sf.y * sz + sz / 2, sz * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Snake
      for (let i = 0; i < this.snake.length; i++) {
        const seg = this.snake[i];
        ctx.save();
        const isHead = i === 0;

        if (isHead) {
          ctx.fillStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 14;
        } else {
          // Color gradient towards tail
          const alpha = Math.max(0.3, 1 - (i / this.snake.length) * 0.7);
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 6;
        }

        ctx.beginPath();
        ctx.roundRect(seg.x * sz + 1, seg.y * sz + 1, sz - 2, sz - 2, isHead ? 6 : 4);
        ctx.fill();

        // Eyes on head
        if (isHead) {
          ctx.fillStyle = '#000000';
          const cx = seg.x * sz + sz / 2;
          const cy = seg.y * sz + sz / 2;
          ctx.beginPath();
          ctx.arc(cx + this.dir.y * 3 + this.dir.x * 3, cy + this.dir.x * 3 + this.dir.y * 3, 2, 0, Math.PI * 2);
          ctx.arc(cx - this.dir.y * 3 + this.dir.x * 3, cy - this.dir.x * 3 + this.dir.y * 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
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

      // Combo indicator
      if (this.combo > 1) {
        ctx.fillStyle = '#ffe600';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${this.combo}X COMBO!`, w - 15, 25);
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
