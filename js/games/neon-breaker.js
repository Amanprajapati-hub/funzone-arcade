/**
 * Game 3: Neon Breaker (Action)
 * High-Octane Cyberpunk Breakout
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['neon-breaker'] = {
    id: 'neon-breaker',
    title: 'Neon Breaker',
    category: 'Action',
    description: 'Smash through neon brick barricades! Unleash multi-balls, explosive bricks, and laser cannons.',
    instructions: '←/→ or Mouse/Touch: Move Paddle | Space / Click: Launch Ball & Fire Lasers',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    paddle: {
      x: 200,
      y: 550,
      w: 80,
      baseW: 80,
      h: 14,
      speed: 380,
      hasLaser: false,
      laserTimer: 0
    },

    balls: [],
    bricks: [],
    powerups: [],
    lasers: [],
    particles: [],
    score: 0,
    lives: 3,
    level: 1,
    ballLaunched: false,
    keys: {},

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 400;
      this.canvas.height = 600;

      this.boundKeyDown = this.onKeyDown.bind(this);
      this.boundKeyUp = this.onKeyUp.bind(this);
      this.boundMouseMove = this.onMouseMove.bind(this);
      this.boundMouseDown = this.onMouseDown.bind(this);

      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
      this.canvas.addEventListener('mousemove', this.boundMouseMove);
      this.canvas.addEventListener('mousedown', this.boundMouseDown);

      // Mobile Canvas Touch Support
      this.boundTouchStart = (e) => {
        if (!this.isRunning || this.isPaused) return;
        e.preventDefault();
        this.handleTouchPaddle(e);
        this.launchBall();
        this.fireLaser();
      };
      this.boundTouchMove = (e) => {
        if (!this.isRunning || this.isPaused) return;
        e.preventDefault();
        this.handleTouchPaddle(e);
      };
      this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
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
      this.lives = 3;
      this.level = 1;
      this.resetPaddle();
      this.buildLevel(this.level);
      this.resetBall();
      this.callbacks.onScore(0);
      this.callbacks.onLives(3);
    },

    resetPaddle() {
      this.paddle.x = 200;
      this.paddle.w = this.paddle.baseW;
      this.paddle.hasLaser = false;
      this.paddle.laserTimer = 0;
    },

    resetBall() {
      this.balls = [{
        x: this.paddle.x,
        y: this.paddle.y - 12,
        vx: 0,
        vy: 0,
        radius: 7,
        stuck: true,
        isFireball: false,
        fireTimer: 0
      }];
      this.ballLaunched = false;
    },

    launchBall() {
      if (!this.ballLaunched && this.balls.length > 0) {
        this.ballLaunched = true;
        const b = this.balls[0];
        b.stuck = false;
        b.vx = (Math.random() - 0.5) * 160;
        b.vy = -340;
        window.ArcadeAudio.playJump();
      }
    },

    buildLevel(lvl) {
      this.bricks = [];
      const rows = 5 + Math.min(lvl, 3);
      const cols = 7;
      const brickW = 46;
      const brickH = 20;
      const startX = 22;
      const startY = 70;
      const colors = ['#ff007f', '#00f0ff', '#ffe600', '#00ff88', '#a855f7'];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Layout patterns
          if ((lvl === 2 && (r + c) % 2 === 1) || (lvl === 3 && c % 2 === 1 && r % 2 === 1)) {
            // skip some bricks for interesting shape
          }
          const isExplosive = Math.random() < 0.12;
          const isTough = !isExplosive && (r < 2 && lvl > 1);
          this.bricks.push({
            x: startX + c * (brickW + 6),
            y: startY + r * (brickH + 8),
            w: brickW,
            h: brickH,
            hp: isTough ? 2 : 1,
            maxHp: isTough ? 2 : 1,
            color: isExplosive ? '#ff2200' : colors[r % colors.length],
            isExplosive: isExplosive,
            hasPowerup: Math.random() < 0.22
          });
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

      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);

      if (this.canvas) {
        this.canvas.addEventListener('mousemove', this.boundMouseMove);
        this.canvas.addEventListener('mousedown', this.boundMouseDown);

        this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      }

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
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
        this.canvas.removeEventListener('touchstart', this.boundTouchStart);
        this.canvas.removeEventListener('touchmove', this.boundTouchMove);
      }
      this.keys = {};
      this.joystickVector = null;
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;
      this.keys[e.key] = true;
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        this.launchBall();
        this.fireLaser();
      }
    },

    onKeyUp(e) {
      this.keys[e.key] = false;
    },

    onMouseMove(e) {
      if (!this.isRunning || this.isPaused) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      this.paddle.x = Math.max(this.paddle.w / 2, Math.min(this.canvas.width - this.paddle.w / 2, mouseX));
    },

    handleTouchPaddle(e) {
      if (!this.isRunning || this.isPaused) return;
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const touchX = (t.clientX - rect.left) * scaleX;
        this.paddle.x = Math.max(this.paddle.w / 2, Math.min(this.canvas.width - this.paddle.w / 2, touchX));
      }
    },

    onMouseDown(e) {
      this.launchBall();
      this.fireLaser();
    },

    joystickVector: null,

    handleInput(action, isDown, data) {
      if (!this.isRunning || this.isPaused) return;
      if (action === 'vector') {
        this.joystickVector = isDown ? data : null;
        return;
      }
      if (action === 'left') this.keys['ArrowLeft'] = isDown;
      if (action === 'right') this.keys['ArrowRight'] = isDown;
      if ((action === 'actionA' || action === 'actionB' || action === 'up') && isDown) {
        this.launchBall();
        this.fireLaser();
      }
    },

    fireLaser() {
      if (this.paddle.hasLaser) {
        window.ArcadeAudio.playLaser();
        this.lasers.push({ x: this.paddle.x - this.paddle.w * 0.4, y: this.paddle.y - 10, vy: -550 });
        this.lasers.push({ x: this.paddle.x + this.paddle.w * 0.4, y: this.paddle.y - 10, vy: -550 });
      }
    },

    createSparks(x, y, color = '#00f0ff', count = 12) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          radius: Math.random() * 2.5 + 1.5,
          color: color,
          life: 0.8
        });
      }
    },

    triggerExplosion(brickX, brickY) {
      window.ArcadeAudio.playExplosion();
      this.createSparks(brickX, brickY, '#ff3300', 25);
      // Detonate surrounding bricks
      for (let i = this.bricks.length - 1; i >= 0; i--) {
        const b = this.bricks[i];
        const dist = Math.hypot(b.x + b.w / 2 - brickX, b.y + b.h / 2 - brickY);
        if (dist < 75) {
          this.createSparks(b.x + b.w / 2, b.y + b.h / 2, b.color, 8);
          this.score += 50;
          this.bricks.splice(i, 1);
        }
      }
    },

    update(dt) {
      // Keyboard & Joystick paddle movement
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
        this.paddle.x = Math.max(this.paddle.w / 2, this.paddle.x - this.paddle.speed * dt);
      }
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
        this.paddle.x = Math.min(this.canvas.width - this.paddle.w / 2, this.paddle.x + this.paddle.speed * dt);
      }
      if (this.joystickVector && Math.abs(this.joystickVector.vx) > 0.05) {
        this.paddle.x = Math.max(this.paddle.w / 2, Math.min(this.canvas.width - this.paddle.w / 2, this.paddle.x + this.joystickVector.vx * this.paddle.speed * dt));
      }

      // Laser powerup timer
      if (this.paddle.hasLaser) {
        this.paddle.laserTimer -= dt;
        if (this.paddle.laserTimer <= 0) {
          this.paddle.hasLaser = false;
        }
      }

      // Update Lasers
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.y += l.vy * dt;

        // Hit bricks
        for (let j = this.bricks.length - 1; j >= 0; j--) {
          const br = this.bricks[j];
          if (l.x > br.x && l.x < br.x + br.w && l.y > br.y && l.y < br.y + br.h) {
            this.lasers.splice(i, 1);
            br.hp -= 1;
            window.ArcadeAudio.playHit(450);
            if (br.hp <= 0) {
              this.createSparks(br.x + br.w / 2, br.y + br.h / 2, br.color, 12);
              this.score += 60;
              this.bricks.splice(j, 1);
            }
            break;
          }
        }

        if (l.y < 0) {
          this.lasers.splice(i, 1);
        }
      }

      // Update Balls
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const b = this.balls[i];

        if (b.stuck) {
          b.x = this.paddle.x;
          b.y = this.paddle.y - 12;
          continue;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wall collisions
        if (b.x - b.radius < 0) {
          b.x = b.radius;
          b.vx = Math.abs(b.vx);
          window.ArcadeAudio.playHit(300);
        } else if (b.x + b.radius > this.canvas.width) {
          b.x = this.canvas.width - b.radius;
          b.vx = -Math.abs(b.vx);
          window.ArcadeAudio.playHit(300);
        }

        if (b.y - b.radius < 0) {
          b.y = b.radius;
          b.vy = Math.abs(b.vy);
          window.ArcadeAudio.playHit(300);
        }

        // Paddle Collision
        const p = this.paddle;
        if (b.y + b.radius >= p.y && b.y - b.radius <= p.y + p.h) {
          if (b.x >= p.x - p.w / 2 && b.x <= p.x + p.w / 2 && b.vy > 0) {
            // Angle based on hit offset
            const hitOffset = (b.x - p.x) / (p.w / 2);
            const speed = Math.hypot(b.vx, b.vy);
            const angle = hitOffset * (Math.PI / 3); // Max 60 deg angle
            b.vx = Math.sin(angle) * speed;
            b.vy = -Math.abs(Math.cos(angle) * speed);
            window.ArcadeAudio.playHit(500);
            this.createSparks(b.x, b.y, '#00f0ff', 6);
          }
        }

        // Brick Collisions
        for (let j = this.bricks.length - 1; j >= 0; j--) {
          const br = this.bricks[j];
          if (b.x + b.radius > br.x && b.x - b.radius < br.x + br.w &&
              b.y + b.radius > br.y && b.y - b.radius < br.y + br.h) {

            br.hp -= 1;
            window.ArcadeAudio.playHit(400);

            if (!b.isFireball) {
              // Bounce
              const prevX = b.x - b.vx * dt;
              if (prevX <= br.x || prevX >= br.x + br.w) {
                b.vx = -b.vx;
              } else {
                b.vy = -b.vy;
              }
            }

            if (br.hp <= 0) {
              if (br.isExplosive) {
                this.triggerExplosion(br.x + br.w / 2, br.y + br.h / 2);
              } else {
                this.createSparks(br.x + br.w / 2, br.y + br.h / 2, br.color, 14);
              }
              this.score += 100;
              this.callbacks.onScore(this.score);

              // Spawn powerup
              if (br.hasPowerup) {
                const types = ['multiball', 'wide', 'laser', 'fireball'];
                const pType = types[Math.floor(Math.random() * types.length)];
                this.powerups.push({ x: br.x + br.w / 2, y: br.y + br.h / 2, type: pType, vy: 140 });
              }

              this.bricks.splice(j, 1);
            }
            break;
          }
        }

        // Bottom pit fall
        if (b.y > this.canvas.height + 20) {
          this.balls.splice(i, 1);
        }
      }

      // Check if all balls lost
      if (this.balls.length === 0) {
        this.lives -= 1;
        this.callbacks.onLives(this.lives);
        window.ArcadeAudio.playHit(180);
        if (this.lives <= 0) {
          window.ArcadeAudio.playGameOver();
          this.isRunning = false;
          this.callbacks.onGameOver(this.score);
          return;
        } else {
          this.resetPaddle();
          this.resetBall();
        }
      }

      // Check level clear
      if (this.bricks.length === 0) {
        this.level += 1;
        window.ArcadeAudio.playLevelUp();
        this.score += 500;
        this.callbacks.onScore(this.score);
        this.buildLevel(this.level);
        this.resetBall();
      }

      // Update Powerups
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const pu = this.powerups[i];
        pu.y += pu.vy * dt;

        // Catch with paddle
        const p = this.paddle;
        if (pu.y >= p.y && pu.y <= p.y + p.h && Math.abs(pu.x - p.x) < p.w / 2) {
          window.ArcadeAudio.playPowerup();
          if (pu.type === 'multiball') {
            const currentB = this.balls[0] || { x: p.x, y: p.y - 12 };
            this.balls.push({ x: currentB.x, y: currentB.y, vx: 220, vy: -300, radius: 7, isFireball: false });
            this.balls.push({ x: currentB.x, y: currentB.y, vx: -220, vy: -300, radius: 7, isFireball: false });
          } else if (pu.type === 'wide') {
            this.paddle.w = Math.min(140, this.paddle.w + 30);
          } else if (pu.type === 'laser') {
            this.paddle.hasLaser = true;
            this.paddle.laserTimer = 8.0;
          } else if (pu.type === 'fireball') {
            this.balls.forEach(b => { b.isFireball = true; b.fireTimer = 8.0; });
          }
          this.powerups.splice(i, 1);
          continue;
        }

        if (pu.y > this.canvas.height) {
          this.powerups.splice(i, 1);
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

      // Clean arcade dark theme
      ctx.fillStyle = '#060914';
      ctx.fillRect(0, 0, w, h);

      // Subtle border glow
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, h - 2);

      // Draw Bricks
      for (const br of this.bricks) {
        ctx.save();
        ctx.fillStyle = br.color;
        ctx.shadowColor = br.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(br.x, br.y, br.w, br.h, 4);
        ctx.fill();

        // Tough brick indicator
        if (br.hp > 1) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Explosive icon
        if (br.isExplosive) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💣', br.x + br.w / 2, br.y + br.h * 0.75);
        }
        ctx.restore();
      }

      // Draw Powerups
      for (const pu of this.powerups) {
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type.slice(0, 2).toUpperCase(), 0, 1);
        ctx.restore();
      }

      // Draw Lasers
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      for (const l of this.lasers) {
        ctx.fillRect(l.x - 2, l.y - 8, 4, 16);
      }
      ctx.shadowBlur = 0;

      // Draw Balls
      for (const b of this.balls) {
        ctx.save();
        ctx.fillStyle = b.isFireball ? '#ff5500' : '#ffe600';
        ctx.shadowColor = b.isFireball ? '#ff2200' : '#ffe600';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Paddle
      const p = this.paddle;
      ctx.save();
      ctx.fillStyle = p.hasLaser ? '#ff007f' : '#00f0ff';
      ctx.shadowColor = p.hasLaser ? '#ff007f' : '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(p.x - p.w / 2, p.y, p.w, p.h, 7);
      ctx.fill();

      // Laser cannons on paddle sides
      if (p.hasLaser) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - p.w * 0.45, p.y - 6, 6, 8);
        ctx.fillRect(p.x + p.w * 0.45 - 6, p.y - 6, 6, 8);
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

      // Ready Prompt
      if (!this.ballLaunched) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CLICK OR PRESS SPACE TO LAUNCH', w / 2, 420);
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
