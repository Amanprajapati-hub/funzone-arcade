/**
 * Game 5: Meteor Strike (Action)
 * 360° Space Physics Asteroid Blaster
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['meteor-strike'] = {
    id: 'meteor-strike',
    title: 'Meteor Strike',
    category: 'Action',
    description: 'Master inertia in deep space! Rotate 360°, blast fracture-prone meteors, and dodge alien scouts.',
    instructions: '←/→ or A/D: Rotate Ship | ↑ or W: Thrusters | Space: Fire Laser | ↓: Hyperspace Warp',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    ship: {
      x: 200,
      y: 250,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      rotationSpeed: 4.2,
      thrustPower: 260,
      radius: 14,
      shield: 100,
      isThrusting: false,
      shootCooldown: 0
    },

    meteors: [],
    bullets: [],
    particles: [],
    saucer: null,
    saucerTimer: 0,
    saucerBullets: [],
    score: 0,
    lives: 3,
    keys: {},

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 450;
      this.canvas.height = 500;

      this.boundKeyDown = this.onKeyDown.bind(this);
      this.boundKeyUp = this.onKeyUp.bind(this);
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
    },

    start() {
      this.reset();
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop();
    },

    reset() {
      this.ship.x = this.canvas.width / 2;
      this.ship.y = this.canvas.height / 2;
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.ship.angle = -Math.PI / 2;
      this.ship.shield = 100;
      this.score = 0;
      this.lives = 3;
      this.meteors = [];
      this.bullets = [];
      this.saucerBullets = [];
      this.saucer = null;
      this.saucerTimer = 0;
      this.particles = [];
      this.spawnInitialMeteors(4);
      this.callbacks.onScore(0);
      this.callbacks.onLives(3);
    },

    spawnInitialMeteors(count) {
      for (let i = 0; i < count; i++) {
        let x, y;
        do {
          x = Math.random() * this.canvas.width;
          y = Math.random() * this.canvas.height;
        } while (Math.hypot(x - this.ship.x, y - this.ship.y) < 120);

        this.spawnMeteor(x, y, 3); // size 3 = large
      }
    },

    spawnMeteor(x, y, size) {
      const radius = size === 3 ? 32 : (size === 2 ? 20 : 12);
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 40 + (4 - size) * 25;

      // Generate random polygon points for jagged asteroid look
      const numVerts = 8;
      const verts = [];
      for (let i = 0; i < numVerts; i++) {
        const a = (i / numVerts) * Math.PI * 2;
        const dist = radius * (0.75 + Math.random() * 0.45);
        verts.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist });
      }

      this.meteors.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        radius: radius,
        verts: verts,
        rot: 0,
        rotSpeed: (Math.random() - 0.5) * 2,
        color: size === 3 ? '#ff007f' : (size === 2 ? '#a855f7' : '#00f0ff')
      });
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
      window.removeEventListener('keyup', this.boundKeyUp);
      this.keys = {};
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;
      this.keys[e.key] = true;

      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        this.fireBullet();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.hyperspaceWarp();
      }
    },

    onKeyUp(e) {
      this.keys[e.key] = false;
    },

    handleInput(action, isDown) {
      if (!this.isRunning || this.isPaused) return;
      if (action === 'left') this.keys['ArrowLeft'] = isDown;
      if (action === 'right') this.keys['ArrowRight'] = isDown;
      if (action === 'up') this.keys['ArrowUp'] = isDown;
      if (action === 'actionA' && isDown) this.fireBullet();
      if (action === 'actionB' && isDown) this.hyperspaceWarp();
    },

    fireBullet() {
      if (this.ship.shootCooldown > 0) return;
      this.ship.shootCooldown = 0.18;
      window.ArcadeAudio.playLaser();

      const bx = this.ship.x + Math.cos(this.ship.angle) * 16;
      const by = this.ship.y + Math.sin(this.ship.angle) * 16;
      const bSpeed = 450;

      this.bullets.push({
        x: bx,
        y: by,
        vx: this.ship.vx + Math.cos(this.ship.angle) * bSpeed,
        vy: this.ship.vy + Math.sin(this.ship.angle) * bSpeed,
        life: 1.1
      });
    },

    hyperspaceWarp() {
      window.ArcadeAudio.playPowerup();
      this.createSparks(this.ship.x, this.ship.y, '#00f0ff', 16);
      this.ship.x = Math.random() * (this.canvas.width - 60) + 30;
      this.ship.y = Math.random() * (this.canvas.height - 60) + 30;
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.createSparks(this.ship.x, this.ship.y, '#ffe600', 16);
    },

    createSparks(x, y, color = '#00f0ff', count = 12) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 120 + 30;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          radius: Math.random() * 2.5 + 1,
          color: color,
          life: 0.8
        });
      }
    },

    wrap(obj) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      if (obj.x < 0) obj.x += w;
      if (obj.x > w) obj.x -= w;
      if (obj.y < 0) obj.y += h;
      if (obj.y > h) obj.y -= h;
    },

    update(dt) {
      const s = this.ship;

      // Rotation
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
        s.angle -= s.rotationSpeed * dt;
      }
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
        s.angle += s.rotationSpeed * dt;
      }

      // Thrust
      s.isThrusting = this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'];
      if (s.isThrusting) {
        s.vx += Math.cos(s.angle) * s.thrustPower * dt;
        s.vy += Math.sin(s.angle) * s.thrustPower * dt;
        // Thruster sparks
        if (Math.random() < 0.6) {
          const ex = s.x - Math.cos(s.angle) * 12;
          const ey = s.y - Math.sin(s.angle) * 12;
          this.createSparks(ex, ey, '#ffe600', 1);
        }
      }

      // Inertia & Friction
      s.vx *= Math.pow(0.98, dt * 60);
      s.vy *= Math.pow(0.98, dt * 60);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      this.wrap(s);

      // Shoot cooldown
      if (s.shootCooldown > 0) s.shootCooldown -= dt;

      // Update Bullets
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        this.wrap(b);
        b.life -= dt;

        // Meteor collision
        for (let j = this.meteors.length - 1; j >= 0; j--) {
          const m = this.meteors[j];
          if (Math.hypot(b.x - m.x, b.y - m.y) < m.radius) {
            // Hit!
            window.ArcadeAudio.playExplosion();
            this.createSparks(m.x, m.y, m.color, 16);
            this.bullets.splice(i, 1);

            this.score += (4 - m.size) * 50;
            this.callbacks.onScore(this.score);

            // Split into smaller meteors
            if (m.size > 1) {
              this.spawnMeteor(m.x, m.y, m.size - 1);
              this.spawnMeteor(m.x, m.y, m.size - 1);
            }
            this.meteors.splice(j, 1);
            break;
          }
        }

        if (b.life <= 0) {
          this.bullets.splice(i, 1);
        }
      }

      // Update Meteors
      for (const m of this.meteors) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.rot += m.rotSpeed * dt;
        this.wrap(m);

        // Ship collision
        if (Math.hypot(s.x - m.x, s.y - m.y) < s.radius + m.radius) {
          this.createSparks(s.x, s.y, '#ff0055', 20);
          window.ArcadeAudio.playHit(200);
          this.lives -= 1;
          this.callbacks.onLives(this.lives);

          if (this.lives <= 0) {
            window.ArcadeAudio.playGameOver();
            this.isRunning = false;
            this.callbacks.onGameOver(this.score);
            return;
          } else {
            this.hyperspaceWarp();
          }
        }
      }

      // Check wave clear
      if (this.meteors.length === 0) {
        window.ArcadeAudio.playLevelUp();
        this.score += 300;
        this.callbacks.onScore(this.score);
        this.spawnInitialMeteors(5);
      }

      // Update UFO Alien Saucer
      this.saucerTimer += dt;
      if (!this.saucer && this.saucerTimer > 12.0) {
        this.saucerTimer = 0;
        this.saucer = {
          x: 0,
          y: Math.random() * (this.canvas.height - 150) + 75,
          vx: 80,
          fireTimer: 1.5
        };
      }

      if (this.saucer) {
        const u = this.saucer;
        u.x += u.vx * dt;
        u.fireTimer -= dt;
        if (u.fireTimer <= 0) {
          u.fireTimer = 2.0;
          const angleToShip = Math.atan2(s.y - u.y, s.x - u.x);
          this.saucerBullets.push({
            x: u.x,
            y: u.y,
            vx: Math.cos(angleToShip) * 180,
            vy: Math.sin(angleToShip) * 180,
            life: 2.5
          });
          window.ArcadeAudio.playLaser();
        }

        // Bullets vs Saucer
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          if (Math.hypot(b.x - u.x, b.y - u.y) < 22) {
            this.bullets.splice(i, 1);
            this.createSparks(u.x, u.y, '#ffe600', 25);
            window.ArcadeAudio.playExplosion();
            this.score += 250;
            this.callbacks.onScore(this.score);
            this.saucer = null;
            break;
          }
        }

        if (u && u.x > this.canvas.width + 40) {
          this.saucer = null;
        }
      }

      // Update Saucer Bullets
      for (let i = this.saucerBullets.length - 1; i >= 0; i--) {
        const sb = this.saucerBullets[i];
        sb.x += sb.vx * dt;
        sb.y += sb.vy * dt;
        sb.life -= dt;

        if (Math.hypot(s.x - sb.x, s.y - sb.y) < s.radius + 4) {
          this.saucerBullets.splice(i, 1);
          this.lives -= 1;
          this.callbacks.onLives(this.lives);
          window.ArcadeAudio.playHit(220);
          if (this.lives <= 0) {
            window.ArcadeAudio.playGameOver();
            this.isRunning = false;
            this.callbacks.onGameOver(this.score);
            return;
          }
          continue;
        }

        if (sb.life <= 0) {
          this.saucerBullets.splice(i, 1);
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

      // Space backdrop
      ctx.fillStyle = '#05030f';
      ctx.fillRect(0, 0, w, h);

      // Draw Meteors
      for (const m of this.meteors) {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rot);
        ctx.strokeStyle = m.color;
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < m.verts.length; i++) {
          const v = m.verts[i];
          if (i === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Draw Bullets
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      for (const b of this.bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Saucer Bullets
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      for (const sb of this.saucerBullets) {
        ctx.beginPath();
        ctx.arc(sb.x, sb.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Saucer
      if (this.saucer) {
        ctx.save();
        ctx.translate(this.saucer.x, this.saucer.y);
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -4, 8, Math.PI, 0);
        ctx.fill();
        ctx.restore();
      }

      // Draw Player Ship
      const s = this.ship;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      // Ship body
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.stroke();

      // Thruster Flame
      if (s.isThrusting) {
        ctx.strokeStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-18 - Math.random() * 8, 0);
        ctx.lineTo(-6, 4);
        ctx.stroke();
      }
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
