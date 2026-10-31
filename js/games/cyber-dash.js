/**
 * Game 1: Cyber Dash (Racing)
 * Synthwave 3-Lane High Speed Racer
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['cyber-dash'] = {
    id: 'cyber-dash',
    title: 'Cyber Dash',
    category: 'Racing',
    description: 'High-speed synthwave highway runner! Dodge traffic, grab fuel cells, and trigger nitro overdrive.',
    instructions: '←/→ or A/D: Change Lanes | ↑ or Space: Nitro Boost | ↓: Brake',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    // Game state
    score: 0,
    speed: 8,
    maxSpeed: 24,
    distance: 0,
    playerLane: 1, // 0: Left, 1: Center, 2: Right
    targetX: 200,
    playerX: 200,
    playerY: 480,
    playerW: 46,
    playerH: 76,
    nitro: 100,
    isBoosting: false,
    shield: false,
    shieldTimer: 0,

    lanes: [110, 200, 290],
    traffic: [],
    pickups: [],
    particles: [],
    roadOffset: 0,
    keys: {},

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 400;
      this.canvas.height = 600;

      this.boundKeyDown = this.onKeyDown.bind(this);
      this.boundKeyUp = this.onKeyUp.bind(this);
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);

      // Canvas Touch Support for Mobile
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.boundTouchStart = (e) => {
        if (!this.isRunning || this.isPaused) return;
        if (!e.touches || e.touches.length === 0) return;
        e.preventDefault();
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      };
      this.boundTouchEnd = (e) => {
        if (!this.isRunning || this.isPaused) return;
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        e.preventDefault();
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const threshold = 25;
        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) this.shiftLane(1);
            else this.shiftLane(-1);
          } else {
            if (dy < 0) {
              this.keys['Space'] = true;
              setTimeout(() => { this.keys['Space'] = false; }, 400);
            } else {
              this.keys['ArrowDown'] = true;
              setTimeout(() => { this.keys['ArrowDown'] = false; }, 350);
            }
          }
        }
      };
      this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
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
      this.distance = 0;
      this.speed = 8;
      this.playerLane = 1;
      this.targetX = this.lanes[1];
      this.playerX = this.lanes[1];
      this.playerY = 480;
      this.nitro = 100;
      this.isBoosting = false;
      this.shield = false;
      this.shieldTimer = 0;
      this.traffic = [];
      this.pickups = [];
      this.particles = [];
      this.roadOffset = 0;
      this.spawnTimer = 0;
      this.pickupTimer = 0;
      this.callbacks.onScore(0);
      this.callbacks.onLives(100); // 100% vehicle hull integrity
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
        this.canvas.removeEventListener('touchstart', this.boundTouchStart);
        this.canvas.removeEventListener('touchend', this.boundTouchEnd);
      }
      this.keys = {};
    },

    onKeyDown(e) {
      if (!this.isRunning || this.isPaused) return;
      this.keys[e.key] = true;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.shiftLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.shiftLane(1);
      }
    },

    onKeyUp(e) {
      this.keys[e.key] = false;
    },

    lastLaneShift: 0,
    handleInput(action, isDown) {
      if (!this.isRunning || this.isPaused) return;
      const now = performance.now();
      if (isDown) {
        if (action === 'left' && (now - this.lastLaneShift > 200)) {
          this.shiftLane(-1);
          this.lastLaneShift = now;
        } else if (action === 'right' && (now - this.lastLaneShift > 200)) {
          this.shiftLane(1);
          this.lastLaneShift = now;
        }
        if (action === 'up' || action === 'actionA') this.keys['Space'] = true;
        if (action === 'down' || action === 'actionB') this.keys['ArrowDown'] = true;
      } else {
        if (action === 'left' || action === 'right') {
          this.lastLaneShift = 0;
        }
        if (action === 'up' || action === 'actionA') this.keys['Space'] = false;
        if (action === 'down' || action === 'actionB') this.keys['ArrowDown'] = false;
      }
    },

    shiftLane(dir) {
      const nextLane = this.playerLane + dir;
      if (nextLane >= 0 && nextLane <= 2) {
        this.playerLane = nextLane;
        this.targetX = this.lanes[this.playerLane];
        window.ArcadeAudio.playHit(220);
      }
    },

    spawnTrafficCar() {
      const lane = Math.floor(Math.random() * 3);
      const isTruck = Math.random() < 0.25;
      const speedDiff = isTruck ? Math.random() * 2 + 3 : Math.random() * 3 + 4;
      const colors = ['#ff007f', '#ffe600', '#7928ca', '#ff5500'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.traffic.push({
        lane: lane,
        x: this.lanes[lane],
        y: -100,
        w: 42,
        h: isTruck ? 110 : 70,
        speed: speedDiff,
        isTruck: isTruck,
        color: color
      });
    },

    spawnPickup() {
      const lane = Math.floor(Math.random() * 3);
      const isNitro = Math.random() < 0.4;
      this.pickups.push({
        lane: lane,
        x: this.lanes[lane],
        y: -40,
        type: isNitro ? 'nitro' : 'battery',
        size: 16
      });
    },

    createSparks(x, y, color = '#00f0ff', count = 12) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          radius: Math.random() * 3 + 2,
          life: 1,
          color: color
        });
      }
    },

    update(dt) {
      // Smooth lane movement
      this.playerX += (this.targetX - this.playerX) * 0.2;

      // Handle Nitro & Brake
      const wantBoost = this.keys[' '] || this.keys['Space'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'];
      const wantBrake = this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'];

      if (wantBoost && this.nitro > 0) {
        this.isBoosting = true;
        this.speed = Math.min(this.speed + 12 * dt, this.maxSpeed);
        this.nitro = Math.max(0, this.nitro - 25 * dt);
        // Nitro exhaust particles
        if (Math.random() < 0.7) {
          this.createSparks(this.playerX - 12, this.playerY + 38, '#00f0ff', 2);
          this.createSparks(this.playerX + 12, this.playerY + 38, '#ff007f', 2);
        }
      } else {
        this.isBoosting = false;
        if (wantBrake) {
          this.speed = Math.max(this.speed - 15 * dt, 4);
        } else {
          // Normal cruising speed slowly increases with distance
          const targetCruise = Math.min(8 + Math.floor(this.score / 200), 16);
          this.speed += (targetCruise - this.speed) * dt * 2;
        }
      }

      // Shield timer
      if (this.shield) {
        this.shieldTimer -= dt;
        if (this.shieldTimer <= 0) {
          this.shield = false;
        }
      }

      // Distance and score
      this.distance += this.speed * dt * 10;
      this.score = Math.floor(this.distance / 10);
      this.callbacks.onScore(this.score);

      // Road animation
      this.roadOffset = (this.roadOffset + this.speed * dt * 40) % 60;

      // Spawning traffic
      this.spawnTimer += dt * (this.speed / 8);
      if (this.spawnTimer > 1.2) {
        this.spawnTimer = 0;
        this.spawnTrafficCar();
      }

      // Spawning pickups
      this.pickupTimer += dt;
      if (this.pickupTimer > 2.2) {
        this.pickupTimer = 0;
        this.spawnPickup();
      }

      // Update traffic
      for (let i = this.traffic.length - 1; i >= 0; i--) {
        const car = this.traffic[i];
        car.y += (this.speed - car.speed) * dt * 30;

        // Collision check
        const hitX = Math.abs(this.playerX - car.x) < (this.playerW + car.w) * 0.42;
        const hitY = Math.abs(this.playerY - car.y) < (this.playerH + car.h) * 0.42;

        if (hitX && hitY) {
          if (this.shield || this.isBoosting) {
            // Smash through traffic car!
            window.ArcadeAudio.playExplosion();
            this.createSparks(car.x, car.y, car.color, 20);
            this.traffic.splice(i, 1);
            this.distance += 250;
            continue;
          } else {
            // Crash!
            window.ArcadeAudio.playExplosion();
            this.createSparks(this.playerX, this.playerY, '#ff0055', 30);
            this.isRunning = false;
            this.callbacks.onGameOver(this.score);
            return;
          }
        }

        // Offscreen remove
        if (car.y > 700 || car.y < -300) {
          this.traffic.splice(i, 1);
        }
      }

      // Update pickups
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        p.y += this.speed * dt * 30;

        const hit = Math.abs(this.playerX - p.x) < 32 && Math.abs(this.playerY - p.y) < 35;
        if (hit) {
          if (p.type === 'nitro') {
            this.nitro = Math.min(100, this.nitro + 40);
            this.shield = true;
            this.shieldTimer = 3.5;
            window.ArcadeAudio.playPowerup();
            this.createSparks(p.x, p.y, '#00f0ff', 16);
          } else {
            this.distance += 300;
            window.ArcadeAudio.playCoin();
            this.createSparks(p.x, p.y, '#ffe600', 14);
          }
          this.pickups.splice(i, 1);
          continue;
        }

        if (p.y > 650) {
          this.pickups.splice(i, 1);
        }
      }

      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
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

      // Dark synthwave background
      ctx.fillStyle = '#060714';
      ctx.fillRect(0, 0, w, h);

      // Road asphalt
      ctx.fillStyle = '#0f1424';
      ctx.fillRect(50, 0, 300, h);

      // Road outer border lines
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(50, 0); ctx.lineTo(50, h);
      ctx.moveTo(350, 0); ctx.lineTo(350, h);
      ctx.stroke();

      // Lane dividers
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.setLineDash([25, 25]);
      ctx.lineDashOffset = -this.roadOffset;

      ctx.beginPath();
      ctx.moveTo(150, 0); ctx.lineTo(150, h);
      ctx.moveTo(250, 0); ctx.lineTo(250, h);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Road side speed lights
      for (let y = (this.roadOffset * 2) % 60; y < h; y += 60) {
        ctx.fillStyle = '#ffe600';
        ctx.fillRect(40, y, 6, 14);
        ctx.fillRect(354, y, 6, 14);
      }

      // Draw Pickups
      for (const p of this.pickups) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.type === 'nitro') {
          // Nitro canister
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('N₂O', 0, 1);
        } else {
          // Battery / Power Cell
          ctx.fillStyle = '#ffe600';
          ctx.shadowColor = '#ffe600';
          ctx.shadowBlur = 12;
          ctx.fillRect(-10, -14, 20, 28);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-5, -17, 10, 4);
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(-2, -6); ctx.lineTo(4, -1); ctx.lineTo(0, 1); ctx.lineTo(3, 7); ctx.lineTo(-4, 2); ctx.lineTo(-1, 0); ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Traffic Cars
      for (const car of this.traffic) {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.fillStyle = car.color;
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(-car.w / 2, -car.h / 2, car.w, car.h, 6);
        ctx.fill();

        // Windshields & tail lights
        ctx.fillStyle = '#0a0d18';
        ctx.fillRect(-car.w * 0.35, -car.h * 0.25, car.w * 0.7, car.h * 0.2);
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(-car.w * 0.4, car.h * 0.38, 8, 4);
        ctx.fillRect(car.w * 0.4 - 8, car.h * 0.38, 8, 4);
        ctx.restore();
      }

      // Draw Player Car
      ctx.save();
      ctx.translate(this.playerX, this.playerY);

      // Shield Aura
      if (this.shield) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, 46, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Player Car Body
      ctx.fillStyle = this.isBoosting ? '#00f0ff' : '#00a8ff';
      ctx.shadowColor = this.isBoosting ? '#00f0ff' : '#ff007f';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-this.playerW / 2, -this.playerH / 2, this.playerW, this.playerH, 8);
      ctx.fill();

      // Front windshield
      ctx.fillStyle = '#050711';
      ctx.fillRect(-this.playerW * 0.35, -this.playerH * 0.35, this.playerW * 0.7, 16);
      // Roof detail
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -this.playerH * 0.4, 6, this.playerH * 0.8);

      // Tail lights
      ctx.fillStyle = this.isBoosting ? '#00f0ff' : '#ff0055';
      ctx.fillRect(-this.playerW * 0.4, this.playerH * 0.42, 10, 4);
      ctx.fillRect(this.playerW * 0.4 - 10, this.playerH * 0.42, 10, 4);

      // Nitro exhaust flame
      if (this.isBoosting) {
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(-10, this.playerH / 2);
        ctx.lineTo(0, this.playerH / 2 + 25 + Math.random() * 10);
        ctx.lineTo(10, this.playerH / 2);
        ctx.fill();
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

      // HUD: Speedometer & Nitro Bar on canvas
      ctx.fillStyle = 'rgba(5, 7, 20, 0.75)';
      ctx.fillRect(10, 10, 140, 52);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 140, 52);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`SPEED: ${Math.round(this.speed * 8)} MPH`, 20, 28);

      // Nitro bar
      ctx.fillStyle = '#475569';
      ctx.fillRect(20, 36, 120, 14);
      ctx.fillStyle = this.nitro > 25 ? '#00f0ff' : '#ff0055';
      ctx.fillRect(20, 36, (this.nitro / 100) * 120, 14);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('NITRO BOOST', 46, 47);
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
