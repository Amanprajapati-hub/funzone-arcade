/**
 * Game 6: Cosmic Jetpack (Casual)
 * Side-scrolling Physics Flapper / Jetpack Dodger
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['cosmic-jetpack'] = {
    id: 'cosmic-jetpack',
    title: 'Cosmic Jetpack',
    category: 'Casual',
    description: 'Fly through space with your ion jetpack! Balance gravity, dodge laser gates, and collect nebula crystals.',
    instructions: 'Space / Click / Tap: Fire Jetpack Thrusters to Ascend | Release to Fall',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    player: {
      x: 90,
      y: 250,
      radius: 16,
      vy: 0,
      gravity: 820,
      thrust: -520,
      isThrusting: false
    },

    gates: [],
    crystals: [],
    particles: [],
    stars: [],
    score: 0,
    gateTimer: 0,
    speed: 180,

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 450;
      this.canvas.height = 550;

      this.boundKeyDown = this.onKeyDown.bind(this);
      this.boundKeyUp = this.onKeyUp.bind(this);
      this.boundMouseDown = this.onMouseDown.bind(this);
      this.boundMouseUp = this.onMouseUp.bind(this);

      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
      this.canvas.addEventListener('mousedown', this.boundMouseDown);
      window.addEventListener('mouseup', this.boundMouseUp);

      // Starfield background
      this.stars = [];
      for (let i = 0; i < 60; i++) {
        this.stars.push({
          x: Math.random() * 450,
          y: Math.random() * 550,
          speed: Math.random() * 60 + 20,
          size: Math.random() * 2 + 1
        });
      }
    },

    start() {
      this.reset();
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop();
    },

    reset() {
      this.player.x = 90;
      this.player.y = 250;
      this.player.vy = 0;
      this.player.isThrusting = false;
      this.gates = [];
      this.crystals = [];
      this.particles = [];
      this.score = 0;
      this.speed = 180;
      this.gateTimer = 0;
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

      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);

      if (this.canvas) {
        this.canvas.addEventListener('mousedown', this.boundMouseDown);
      }

      window.addEventListener('mouseup', this.boundMouseUp);

      this.start();
    },

    destroy() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      window.removeEventListener('keydown', this.boundKeyDown);
      window.removeEventListener('keyup', this.boundKeyUp);
      if (this.canvas) {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      }
      window.removeEventListener('mouseup', this.boundMouseUp);
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;
      if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.thrust();
      }
    },

    onKeyUp(e) {
      if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.player.isThrusting = false;
      }
    },

    onMouseDown(e) {
      this.thrust();
    },

    onMouseUp(e) {
      this.player.isThrusting = false;
    },

    handleInput(action, isDown) {
      if (!this.isRunning || this.isPaused) return;
      if (action === 'up' || action === 'actionA' || action === 'actionB') {
        if (isDown) this.thrust();
        else this.player.isThrusting = false;
      }
    },

    thrust() {
      this.player.vy = this.player.thrust;
      this.player.isThrusting = true;
      window.ArcadeAudio.playJump();
    },

    spawnGate() {
      const gap = 150;
      const minTop = 60;
      const maxTop = this.canvas.height - gap - 60;
      const topHeight = Math.random() * (maxTop - minTop) + minTop;

      this.gates.push({
        x: this.canvas.width + 20,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        width: 44,
        passed: false
      });

      // Spawn crystal in the gap
      this.crystals.push({
        x: this.canvas.width + 42,
        y: topHeight + gap / 2,
        radius: 12
      });
    },

    createSparks(x, y, color = '#00f0ff', count = 12) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          radius: Math.random() * 2.5 + 1.5,
          color: color,
          life: 0.8
        });
      }
    },

    update(dt) {
      const p = this.player;

      // Parallax starfield
      for (const s of this.stars) {
        s.x -= s.speed * dt;
        if (s.x < 0) {
          s.x = this.canvas.width;
          s.y = Math.random() * this.canvas.height;
        }
      }

      // Physics: Gravity & Velocity
      p.vy += p.gravity * dt;
      p.y += p.vy * dt;

      // Thruster exhaust particles
      if (p.isThrusting || p.vy < 0) {
        if (Math.random() < 0.8) {
          this.createSparks(p.x - 14, p.y + 12, '#00f0ff', 2);
          this.createSparks(p.x - 14, p.y + 14, '#ff007f', 1);
        }
      }

      // Floor & Ceiling Collision
      if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy = 0;
      } else if (p.y + p.radius > this.canvas.height) {
        this.gameOver();
        return;
      }

      // Spawning Gates
      this.gateTimer += dt;
      if (this.gateTimer > 2.0) {
        this.gateTimer = 0;
        this.spawnGate();
      }

      // Update Gates
      for (let i = this.gates.length - 1; i >= 0; i--) {
        const g = this.gates[i];
        g.x -= this.speed * dt;

        // Gate passing score
        if (!g.passed && g.x + g.width < p.x) {
          g.passed = true;
          this.score += 50;
          this.callbacks.onScore(this.score);
          window.ArcadeAudio.playCoin();
        }

        // Collision Check
        const inX = p.x + p.radius > g.x && p.x - p.radius < g.x + g.width;
        const hitTop = p.y - p.radius < g.topHeight;
        const hitBottom = p.y + p.radius > g.bottomY;

        if (inX && (hitTop || hitBottom)) {
          this.gameOver();
          return;
        }

        if (g.x < -60) {
          this.gates.splice(i, 1);
        }
      }

      // Update Crystals
      for (let i = this.crystals.length - 1; i >= 0; i--) {
        const c = this.crystals[i];
        c.x -= this.speed * dt;

        if (Math.hypot(p.x - c.x, p.y - c.y) < p.radius + c.radius) {
          window.ArcadeAudio.playPowerup();
          this.createSparks(c.x, c.y, '#ffe600', 16);
          this.score += 100;
          this.callbacks.onScore(this.score);
          this.crystals.splice(i, 1);
          continue;
        }

        if (c.x < -30) {
          this.crystals.splice(i, 1);
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

    gameOver() {
      window.ArcadeAudio.playExplosion();
      this.createSparks(this.player.x, this.player.y, '#ff0055', 25);
      this.isRunning = false;
      this.callbacks.onGameOver(this.score);
    },

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark space sky
      ctx.fillStyle = '#060616';
      ctx.fillRect(0, 0, w, h);

      // Starfield
      ctx.fillStyle = '#ffffff';
      for (const s of this.stars) {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // Draw Laser Gates
      for (const g of this.gates) {
        ctx.save();
        // Top Gate Post
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.fillRect(g.x, 0, g.width, g.topHeight);
        ctx.strokeRect(g.x, 0, g.width, g.topHeight);

        // Top emitter node
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(g.x + g.width / 2, g.topHeight, 8, 0, Math.PI * 2);
        ctx.fill();

        // Bottom Gate Post
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(g.x, g.bottomY, g.width, h - g.bottomY);
        ctx.strokeRect(g.x, g.bottomY, g.width, h - g.bottomY);

        // Bottom emitter node
        ctx.beginPath();
        ctx.arc(g.x + g.width / 2, g.bottomY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Draw Crystals
      for (const c of this.crystals) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -c.radius);
        ctx.lineTo(c.radius, 0);
        ctx.lineTo(0, c.radius);
        ctx.lineTo(-c.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw Player Astronaut
      const p = this.player;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Jetpack tank
      ctx.fillStyle = '#475569';
      ctx.fillRect(-18, -8, 8, 20);

      // Astronaut suit
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Visor
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.ellipse(5, -2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

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
