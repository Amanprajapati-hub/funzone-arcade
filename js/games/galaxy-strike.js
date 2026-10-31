/**
 * Game 2: Galaxy Strike (Action)
 * Vertical Scrolling Retro Space Arcade Shooter
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['galaxy-strike'] = {
    id: 'galaxy-strike',
    title: 'Galaxy Strike',
    category: 'Action',
    description: 'Defend the galaxy against alien invaders! Upgrade blasters, trigger nova bombs, and defeat bosses.',
    instructions: '←/→/↑/↓ or WASD: Move Starfighter | Space / Click: Shoot Plasma Blasters',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    // Player state
    player: {
      x: 200,
      y: 500,
      w: 38,
      h: 42,
      speed: 260,
      lives: 3,
      weaponLevel: 1, // 1: single, 2: double, 3: triple
      shield: 0, // shield timer
      invincible: 0,
      shootCooldown: 0
    },

    score: 0,
    bossSpawned: false,
    boss: null,
    bullets: [],
    enemyBullets: [],
    enemies: [],
    powerups: [],
    particles: [],
    stars: [],
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
      this.boundMouseUp = this.onMouseUp.bind(this);

      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
      this.canvas.addEventListener('mousemove', this.boundMouseMove);
      this.canvas.addEventListener('mousedown', this.boundMouseDown);
      window.addEventListener('mouseup', this.boundMouseUp);

      // Mobile Touch Listeners on Canvas
      this.boundTouchStart = (e) => {
        if (!this.isRunning || this.isPaused) return;
        e.preventDefault();
        this.keys['Mouse'] = true;
        this.handleCanvasTouch(e);
      };
      this.boundTouchMove = (e) => {
        if (!this.isRunning || this.isPaused) return;
        e.preventDefault();
        this.handleCanvasTouch(e);
      };
      this.boundTouchEnd = (e) => {
        this.keys['Mouse'] = false;
      };
      this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
      this.canvas.addEventListener('touchcancel', this.boundTouchEnd, { passive: false });

      // Starfield initialization
      this.stars = [];
      for (let i = 0; i < 80; i++) {
        this.stars.push({
          x: Math.random() * 400,
          y: Math.random() * 600,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 80 + 30,
          color: Math.random() < 0.2 ? '#00f0ff' : (Math.random() < 0.4 ? '#ff007f' : '#ffffff')
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
      this.player.x = 200;
      this.player.y = 510;
      this.player.lives = 3;
      this.player.weaponLevel = 1;
      this.player.shield = 0;
      this.player.invincible = 0;
      this.player.shootCooldown = 0;
      this.score = 0;
      this.bossSpawned = false;
      this.boss = null;
      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];
      this.powerups = [];
      this.particles = [];
      this.spawnTimer = 0;
      this.callbacks.onScore(0);
      this.callbacks.onLives(3);
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
      if (this.canvas) {
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
        this.canvas.removeEventListener('touchstart', this.boundTouchStart);
        this.canvas.removeEventListener('touchmove', this.boundTouchMove);
        this.canvas.removeEventListener('touchend', this.boundTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.boundTouchEnd);
      }
      window.removeEventListener('mouseup', this.boundMouseUp);
      this.keys = {};
      this.joystickVector = { vx: 0, vy: 0 };
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;
      this.keys[e.key] = true;
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
      }
    },

    onKeyUp(e) {
      this.keys[e.key] = false;
    },

    onMouseMove(e) {
      if (!this.isRunning || this.isPaused) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      this.player.x = Math.max(25, Math.min(375, mouseX));
      this.player.y = Math.max(50, Math.min(560, mouseY));
    },

    handleCanvasTouch(e) {
      if (!this.isRunning || this.isPaused) return;
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const touchX = (t.clientX - rect.left) * scaleX;
        const touchY = (t.clientY - rect.top) * scaleY;
        this.player.x = Math.max(25, Math.min(375, touchX));
        this.player.y = Math.max(50, Math.min(560, touchY));
      }
    },

    onMouseDown(e) {
      this.keys['Mouse'] = true;
    },

    onMouseUp(e) {
      this.keys['Mouse'] = false;
    },

    joystickVector: { vx: 0, vy: 0 },

    handleInput(action, isDown, data) {
      if (!this.isRunning || this.isPaused) return;
      if (action === 'vector') {
        this.joystickVector = isDown ? (data || { vx: 0, vy: 0 }) : { vx: 0, vy: 0 };
        return;
      }
      if (action === 'left') this.keys['ArrowLeft'] = isDown;
      if (action === 'right') this.keys['ArrowRight'] = isDown;
      if (action === 'up') this.keys['ArrowUp'] = isDown;
      if (action === 'down') this.keys['ArrowDown'] = isDown;
      if (action === 'actionA') this.keys['Space'] = isDown;
      if (action === 'actionB' && isDown) {
        // Trigger Bomb screen clear
        if (this.enemies.length > 0) {
          window.ArcadeAudio.playExplosion();
          this.enemies.forEach(en => this.createExplosion(en.x, en.y, en.color, 12));
          this.enemies = [];
          this.enemyBullets = [];
          this.score += 150;
          this.callbacks.onScore(this.score);
        }
      }
    },

    shoot() {
      const p = this.player;
      window.ArcadeAudio.playLaser();
      if (p.weaponLevel === 1) {
        this.bullets.push({ x: p.x, y: p.y - 18, vx: 0, vy: -650 });
      } else if (p.weaponLevel === 2) {
        this.bullets.push({ x: p.x - 12, y: p.y - 14, vx: 0, vy: -650 });
        this.bullets.push({ x: p.x + 12, y: p.y - 14, vx: 0, vy: -650 });
      } else {
        this.bullets.push({ x: p.x, y: p.y - 18, vx: 0, vy: -650 });
        this.bullets.push({ x: p.x - 14, y: p.y - 12, vx: -120, vy: -620 });
        this.bullets.push({ x: p.x + 14, y: p.y - 12, vx: 120, vy: -620 });
      }
    },

    spawnEnemy() {
      const typeRand = Math.random();
      let enemy;
      if (typeRand < 0.6) {
        // Scout drone
        enemy = {
          type: 'drone',
          x: Math.random() * 320 + 40,
          y: -30,
          w: 28,
          h: 24,
          hp: 1,
          maxHp: 1,
          vx: (Math.random() - 0.5) * 80,
          vy: Math.random() * 60 + 90,
          color: '#ff007f',
          fireTimer: Math.random() * 2 + 1
        };
      } else if (typeRand < 0.9) {
        // Crimson Interceptor
        enemy = {
          type: 'interceptor',
          x: Math.random() * 320 + 40,
          y: -40,
          w: 36,
          h: 32,
          hp: 2,
          maxHp: 2,
          vx: (Math.random() - 0.5) * 110,
          vy: Math.random() * 40 + 70,
          color: '#ff5500',
          fireTimer: 1.2
        };
      } else {
        // Armored Dreadnought
        enemy = {
          type: 'dreadnought',
          x: Math.random() * 280 + 60,
          y: -60,
          w: 52,
          h: 46,
          hp: 6,
          maxHp: 6,
          vx: (Math.random() - 0.5) * 40,
          vy: 45,
          color: '#a855f7',
          fireTimer: 1.5
        };
      }
      this.enemies.push(enemy);
    },

    spawnBoss() {
      this.bossSpawned = true;
      this.boss = {
        x: 200,
        y: -100,
        targetY: 90,
        w: 90,
        h: 70,
        hp: 40,
        maxHp: 40,
        vx: 80,
        fireTimer: 1.0,
        specialTimer: 4.0
      };
      window.ArcadeAudio.playPowerup();
    },

    createExplosion(x, y, color = '#ff007f', count = 18) {
      window.ArcadeAudio.playExplosion();
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 140 + 40;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          radius: Math.random() * 3.5 + 1.5,
          color: color,
          life: 1
        });
      }
    },

    update(dt) {
      const p = this.player;

      // Update stars background
      for (const s of this.stars) {
        s.y += s.speed * dt;
        if (s.y > 600) {
          s.y = 0;
          s.x = Math.random() * 400;
        }
      }

      // Keyboard & Joystick movement
      let dx = 0;
      let dy = 0;
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx -= 1;
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx += 1;
      if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy -= 1;
      if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy += 1;

      if (this.joystickVector && (this.joystickVector.vx !== 0 || this.joystickVector.vy !== 0)) {
        dx += this.joystickVector.vx;
        dy += this.joystickVector.vy;
      }

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        p.x = Math.max(20, Math.min(380, p.x + (dx / len) * p.speed * dt));
        p.y = Math.max(40, Math.min(560, p.y + (dy / len) * p.speed * dt));
      }

      // Shooting
      p.shootCooldown -= dt;
      const wantShoot = this.keys[' '] || this.keys['Space'] || this.keys['Mouse'];
      if (wantShoot && p.shootCooldown <= 0) {
        this.shoot();
        p.shootCooldown = 0.17;
      }

      // Shield & invincibility countdowns
      if (p.shield > 0) p.shield -= dt;
      if (p.invincible > 0) p.invincible -= dt;

      // Update player bullets
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -20 || b.x < -20 || b.x > 420) {
          this.bullets.splice(i, 1);
        }
      }

      // Update enemy bullets
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const eb = this.enemyBullets[i];
        eb.x += eb.vx * dt;
        eb.y += eb.vy * dt;

        // Player collision
        if (p.invincible <= 0) {
          const dist = Math.hypot(p.x - eb.x, p.y - eb.y);
          if (dist < 20) {
            this.enemyBullets.splice(i, 1);
            if (p.shield > 0) {
              p.shield = 0;
              window.ArcadeAudio.playHit(400);
            } else {
              this.hitPlayer();
            }
            continue;
          }
        }

        if (eb.y > 620) {
          this.enemyBullets.splice(i, 1);
        }
      }

      // Spawn normal enemies
      if (!this.boss) {
        this.spawnTimer += dt;
        if (this.spawnTimer > 1.3) {
          this.spawnTimer = 0;
          this.spawnEnemy();
        }
        // Boss trigger check at 800 points
        if (this.score >= 800 && !this.bossSpawned) {
          this.spawnBoss();
        }
      }

      // Update Boss
      if (this.boss) {
        const b = this.boss;
        if (b.y < b.targetY) {
          b.y += 60 * dt;
        } else {
          b.x += b.vx * dt;
          if (b.x > 330) { b.x = 330; b.vx = -Math.abs(b.vx); }
          if (b.x < 70) { b.x = 70; b.vx = Math.abs(b.vx); }

          b.fireTimer -= dt;
          if (b.fireTimer <= 0) {
            b.fireTimer = 0.9;
            // Dual laser blast
            this.enemyBullets.push({ x: b.x - 25, y: b.y + 30, vx: -30, vy: 240 });
            this.enemyBullets.push({ x: b.x + 25, y: b.y + 30, vx: 30, vy: 240 });
            this.enemyBullets.push({ x: b.x, y: b.y + 35, vx: 0, vy: 260 });
            window.ArcadeAudio.playLaser();
          }
        }

        // Check player bullets against boss
        for (let j = this.bullets.length - 1; j >= 0; j--) {
          const pb = this.bullets[j];
          if (Math.abs(pb.x - b.x) < b.w * 0.5 && Math.abs(pb.y - b.y) < b.h * 0.5) {
            this.bullets.splice(j, 1);
            b.hp -= 1;
            window.ArcadeAudio.playHit(500);
            if (b.hp <= 0) {
              this.createExplosion(b.x, b.y, '#ff0055', 40);
              this.score += 500;
              this.callbacks.onScore(this.score);
              window.ArcadeAudio.playLevelUp();
              this.boss = null;
              break;
            }
          }
        }
      }

      // Update Enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // Bounce left/right screen edges
        if (e.x < 25) { e.x = 25; e.vx = Math.abs(e.vx); }
        if (e.x > 375) { e.x = 375; e.vx = -Math.abs(e.vx); }

        // Firing
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          e.fireTimer = Math.random() * 2 + 1.5;
          this.enemyBullets.push({ x: e.x, y: e.y + e.h * 0.5, vx: 0, vy: 220 });
        }

        // Bullets vs Enemy
        let enemyDied = false;
        for (let j = this.bullets.length - 1; j >= 0; j--) {
          const b = this.bullets[j];
          if (Math.abs(b.x - e.x) < e.w * 0.55 && Math.abs(b.y - e.y) < e.h * 0.55) {
            this.bullets.splice(j, 1);
            e.hp -= 1;
            window.ArcadeAudio.playHit(420);
            if (e.hp <= 0) {
              enemyDied = true;
              this.createExplosion(e.x, e.y, e.color, 16);
              this.score += e.maxHp * 25;
              this.callbacks.onScore(this.score);

              // Chance to drop power-up
              if (Math.random() < 0.28) {
                const pType = Math.random() < 0.5 ? 'weapon' : (Math.random() < 0.75 ? 'shield' : 'bomb');
                this.powerups.push({ x: e.x, y: e.y, type: pType, vy: 100 });
              }
              break;
            }
          }
        }

        if (enemyDied) {
          this.enemies.splice(i, 1);
          continue;
        }

        // Player collision with enemy ship
        if (p.invincible <= 0) {
          if (Math.abs(p.x - e.x) < (p.w + e.w) * 0.4 && Math.abs(p.y - e.y) < (p.h + e.h) * 0.4) {
            this.createExplosion(e.x, e.y, e.color, 14);
            this.enemies.splice(i, 1);
            if (p.shield > 0) {
              p.shield = 0;
            } else {
              this.hitPlayer();
            }
            continue;
          }
        }

        // Offscreen removal
        if (e.y > 640) {
          this.enemies.splice(i, 1);
        }
      }

      // Update Powerups
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const pu = this.powerups[i];
        pu.y += pu.vy * dt;

        if (Math.hypot(p.x - pu.x, p.y - pu.y) < 32) {
          window.ArcadeAudio.playPowerup();
          if (pu.type === 'weapon') {
            p.weaponLevel = Math.min(3, p.weaponLevel + 1);
          } else if (pu.type === 'shield') {
            p.shield = 6.0;
          } else if (pu.type === 'bomb') {
            // Screen clear bomb
            this.enemies.forEach(en => this.createExplosion(en.x, en.y, en.color, 10));
            this.enemies = [];
            this.enemyBullets = [];
            this.score += 200;
            this.callbacks.onScore(this.score);
          }
          this.powerups.splice(i, 1);
          continue;
        }

        if (pu.y > 640) {
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

    hitPlayer() {
      const p = this.player;
      p.lives -= 1;
      this.callbacks.onLives(p.lives);
      p.invincible = 2.0;
      p.weaponLevel = Math.max(1, p.weaponLevel - 1);
      this.createExplosion(p.x, p.y, '#ff0055', 25);

      if (p.lives <= 0) {
        window.ArcadeAudio.playGameOver();
        this.isRunning = false;
        this.callbacks.onGameOver(this.score);
      }
    },

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Space background
      ctx.fillStyle = '#050410';
      ctx.fillRect(0, 0, w, h);

      // Starfield
      for (const s of this.stars) {
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // Draw Powerups
      for (const pu of this.powerups) {
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.fillStyle = pu.type === 'weapon' ? '#00f0ff' : (pu.type === 'shield' ? '#ffe600' : '#ff007f');
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type === 'weapon' ? 'W' : (pu.type === 'shield' ? 'S' : 'B'), 0, 1);
        ctx.restore();
      }

      // Draw Player Bullets
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      for (const b of this.bullets) {
        ctx.fillRect(b.x - 3, b.y - 10, 6, 16);
      }
      ctx.shadowBlur = 0;

      // Draw Enemy Bullets
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      for (const eb of this.enemyBullets) {
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw Enemies
      for (const e of this.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;

        if (e.type === 'drone') {
          ctx.beginPath();
          ctx.moveTo(0, e.h * 0.5);
          ctx.lineTo(-e.w * 0.5, -e.h * 0.5);
          ctx.lineTo(e.w * 0.5, -e.h * 0.5);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === 'interceptor') {
          ctx.beginPath();
          ctx.moveTo(0, e.h * 0.5);
          ctx.lineTo(e.w * 0.5, 0);
          ctx.lineTo(e.w * 0.3, -e.h * 0.5);
          ctx.lineTo(-e.w * 0.3, -e.h * 0.5);
          ctx.lineTo(-e.w * 0.5, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // Dreadnought
          ctx.beginPath();
          ctx.roundRect(-e.w * 0.5, -e.h * 0.5, e.w, e.h, 6);
          ctx.fill();
          // Health bar
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(-e.w * 0.4, -e.h * 0.7, (e.hp / e.maxHp) * e.w * 0.8, 4);
        }
        ctx.restore();
      }

      // Draw Boss
      if (this.boss) {
        const b = this.boss;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(0, b.h * 0.5);
        ctx.lineTo(b.w * 0.5, -b.h * 0.2);
        ctx.lineTo(b.w * 0.3, -b.h * 0.5);
        ctx.lineTo(-b.w * 0.3, -b.h * 0.5);
        ctx.lineTo(-b.w * 0.5, -b.h * 0.2);
        ctx.closePath();
        ctx.fill();

        // Boss Core
        ctx.fillStyle = '#ffe600';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Boss Health Bar top
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(50, 16, 300, 14);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(52, 18, (b.hp / b.maxHp) * 296, 10);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(50, 16, 300, 14);
      }

      // Draw Player
      const p = this.player;
      if (p.invincible <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Shield aura
        if (p.shield > 0) {
          ctx.strokeStyle = '#ffe600';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#ffe600';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Starfighter body
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -p.h * 0.5);
        ctx.lineTo(p.w * 0.5, p.h * 0.4);
        ctx.lineTo(p.w * 0.25, p.h * 0.25);
        ctx.lineTo(-p.w * 0.25, p.h * 0.25);
        ctx.lineTo(-p.w * 0.5, p.h * 0.4);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, -2, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thruster flame
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.moveTo(-6, p.h * 0.25);
        ctx.lineTo(0, p.h * 0.25 + 12 + Math.random() * 8);
        ctx.lineTo(6, p.h * 0.25);
        ctx.fill();
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
