/**
 * Game 10: Tower Stack (Casual)
 * Timing-based Harmonic Cyber Skyscraper Stacker
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['tower-stack'] = {
    id: 'tower-stack',
    title: 'Tower Stack',
    category: 'Casual',
    description: 'Precision timing stacker! Slice overhangs, align perfect combos, and construct a neon cyber tower into space.',
    instructions: 'Space / Click / Tap: Drop the sliding block onto the tower stack with precision timing.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    stack: [],
    fallingPieces: [],
    particles: [],
    currentBlock: null,
    blockHeight: 28,
    cameraY: 0,
    targetCameraY: 0,
    score: 0,
    combo: 0,
    speed: 200,

    notes: [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3, 587.3, 659.3],

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 400;
      this.canvas.height = 550;

      this.boundKeyDown = this.onKeyDown.bind(this);
      this.boundMouseDown = this.onMouseDown.bind(this);

      window.addEventListener('keydown', this.boundKeyDown);
      this.canvas.addEventListener('mousedown', this.boundMouseDown);
    },

    start() {
      this.reset();
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop();
    },

    getColor(index) {
      const hue = (index * 26) % 360;
      return `hsl(${hue}, 85%, 60%)`;
    },

    reset() {
      this.stack = [];
      this.fallingPieces = [];
      this.particles = [];
      this.score = 0;
      this.combo = 0;
      this.cameraY = 0;
      this.targetCameraY = 0;
      this.speed = 200;

      // Base foundation block
      const baseWidth = 220;
      const baseX = (this.canvas.width - baseWidth) / 2;
      const baseY = this.canvas.height - 70;

      this.stack.push({
        x: baseX,
        y: baseY,
        w: baseWidth,
        h: this.blockHeight,
        color: this.getColor(0)
      });

      this.spawnNextBlock();
      this.callbacks.onScore(0);
      this.callbacks.onLives(1);
    },

    spawnNextBlock() {
      const topBlock = this.stack[this.stack.length - 1];
      const index = this.stack.length;
      const y = topBlock.y - this.blockHeight;

      this.currentBlock = {
        x: 0,
        y: y,
        w: topBlock.w,
        h: this.blockHeight,
        dir: 1,
        color: this.getColor(index)
      };

      // Camera follow target
      if (this.stack.length > 5) {
        this.targetCameraY = (this.stack.length - 5) * this.blockHeight;
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
      this.start();
    },

    destroy() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      window.removeEventListener('keydown', this.boundKeyDown);
      if (this.canvas) {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      }
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        this.placeBlock();
      }
    },

    onMouseDown(e) {
      if (!this.isRunning || this.isPaused) return;
      this.placeBlock();
    },

    handleInput(action, isDown) {
      if (!this.isRunning || this.isPaused || !isDown) return;
      if (action === 'actionA' || action === 'actionB' || action === 'up') {
        this.placeBlock();
      }
    },

    placeBlock() {
      if (!this.currentBlock) return;
      const cur = this.currentBlock;
      const top = this.stack[this.stack.length - 1];

      const diff = cur.x - top.x;
      const absDiff = Math.abs(diff);

      // Check complete miss
      if (absDiff >= top.w) {
        // Falling full block
        this.fallingPieces.push({
          x: cur.x,
          y: cur.y,
          w: cur.w,
          h: cur.h,
          color: cur.color,
          vx: cur.dir * 60,
          vy: 0,
          rot: 0,
          rotSpeed: 0.05 * cur.dir
        });
        window.ArcadeAudio.playGameOver();
        this.isRunning = false;
        this.callbacks.onGameOver(this.score);
        return;
      }

      // Check perfect placement (within 4 pixels)
      if (absDiff <= 4) {
        cur.x = top.x; // Snaps to perfect
        this.combo++;
        const noteIdx = Math.min(this.combo - 1, this.notes.length - 1);
        window.ArcadeAudio.playNote(this.notes[noteIdx], 0.25, 'triangle');
        this.createSparks(cur.x + cur.w / 2, cur.y, '#ffffff', 16);

        // Expand block if combo streak >= 5
        if (this.combo >= 5) {
          cur.w = Math.min(220, cur.w + 10);
        }
      } else {
        this.combo = 0;
        window.ArcadeAudio.playHit(350);

        // Slice overhang
        let newX, newW, cutX, cutW;
        if (diff > 0) {
          // Overhang on the right
          newX = cur.x;
          newW = top.w - diff;
          cutX = cur.x + newW;
          cutW = diff;
        } else {
          // Overhang on the left
          newX = top.x;
          newW = top.w + diff;
          cutX = cur.x;
          cutW = -diff;
        }

        cur.x = newX;
        cur.w = newW;

        // Create falling sliced piece
        this.fallingPieces.push({
          x: cutX,
          y: cur.y,
          w: cutW,
          h: cur.h,
          color: cur.color,
          vx: diff > 0 ? 50 : -50,
          vy: 0,
          rot: 0,
          rotSpeed: diff > 0 ? 0.05 : -0.05
        });
        this.createSparks(cutX + cutW / 2, cur.y, cur.color, 8);
      }

      this.stack.push({
        x: cur.x,
        y: cur.y,
        w: cur.w,
        h: cur.h,
        color: cur.color
      });

      this.score++;
      this.callbacks.onScore(this.score);
      this.speed = Math.min(360, 200 + this.score * 5);
      this.spawnNextBlock();
    },

    createSparks(x, y, color = '#00f0ff', count = 10) {
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
      // Smooth camera interpolation
      this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

      // Update current moving block
      if (this.currentBlock) {
        const cur = this.currentBlock;
        cur.x += cur.dir * this.speed * dt;

        if (cur.x + cur.w > this.canvas.width) {
          cur.x = this.canvas.width - cur.w;
          cur.dir = -1;
        } else if (cur.x < 0) {
          cur.x = 0;
          cur.dir = 1;
        }
      }

      // Update falling sliced pieces
      for (let i = this.fallingPieces.length - 1; i >= 0; i--) {
        const fp = this.fallingPieces[i];
        fp.vy += 800 * dt;
        fp.x += fp.vx * dt;
        fp.y += fp.vy * dt;
        fp.rot += fp.rotSpeed;

        if (fp.y - this.cameraY > this.canvas.height + 100) {
          this.fallingPieces.splice(i, 1);
        }
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

      // Cyber sky gradient
      ctx.fillStyle = '#070617';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(0, this.cameraY);

      // Draw Tower Stack Blocks
      for (const b of this.stack) {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Highlight top rim
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(b.x, b.y, b.w, 3);
        ctx.restore();
      }

      // Draw Moving Block
      if (this.currentBlock) {
        const cur = this.currentBlock;
        ctx.save();
        ctx.fillStyle = cur.color;
        ctx.shadowColor = cur.color;
        ctx.shadowBlur = 14;
        ctx.fillRect(cur.x, cur.y, cur.w, cur.h);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cur.x, cur.y, cur.w, 3);
        ctx.restore();
      }

      // Draw Falling Pieces
      for (const fp of this.fallingPieces) {
        ctx.save();
        ctx.translate(fp.x + fp.w / 2, fp.y + fp.h / 2);
        ctx.rotate(fp.rot);
        ctx.fillStyle = fp.color;
        ctx.fillRect(-fp.w / 2, -fp.h / 2, fp.w, fp.h);
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

      ctx.restore();

      // Combo Display
      if (this.combo > 1) {
        ctx.fillStyle = '#ffe600';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`PERFECT x${this.combo}!`, w - 20, 35);
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
