/**
 * Game 7: Drift Rush (Racing)
 * Top-down Circuit Drift Time Trial Racer
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['drift-rush'] = {
    id: 'drift-rush',
    title: 'Drift Rush',
    category: 'Racing',
    description: 'Tear through the neon circuit! Drift tight hairpins to rack up multiplier points and beat checkpoint timers.',
    instructions: '↑ or W: Accelerate | ↓ or S: Brake/Reverse | ←/→ or A/D: Steer | Space: Handbrake Drift',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    car: {
      x: 100,
      y: 450,
      angle: -Math.PI / 2,
      speed: 0,
      maxSpeed: 320,
      accel: 240,
      friction: 0.98,
      steerRate: 3.4,
      driftFactor: 0.94,
      isDrifting: false
    },

    skidmarks: [],
    particles: [],
    score: 0,
    driftScore: 0,
    timeRemaining: 30, // seconds
    laps: 0,
    keys: {},

    // Circuit Checkpoints
    checkpoints: [
      { x: 100, y: 300, w: 90, h: 20, reached: false },
      { x: 160, y: 120, w: 20, h: 90, reached: false },
      { x: 380, y: 150, w: 20, h: 90, reached: false },
      { x: 340, y: 350, w: 90, h: 20, reached: false },
      { x: 200, y: 470, w: 20, h: 90, isFinish: true, reached: false }
    ],
    currentCheckpoint: 0,

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 500;
      this.canvas.height = 550;

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
      this.car.x = 100;
      this.car.y = 450;
      this.car.angle = -Math.PI / 2;
      this.car.speed = 0;
      this.car.isDrifting = false;
      this.score = 0;
      this.driftScore = 0;
      this.timeRemaining = 30;
      this.laps = 0;
      this.currentCheckpoint = 0;
      this.skidmarks = [];
      this.particles = [];
      this.checkpoints.forEach(cp => cp.reached = false);
      this.callbacks.onScore(0);
      this.callbacks.onLives(Math.ceil(this.timeRemaining));
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
    },

    onKeyUp(e) {
      this.keys[e.key] = false;
    },

    handleInput(action, isDown) {
      if (!this.isRunning || this.isPaused) return;
      if (action === 'up') this.keys['ArrowUp'] = isDown;
      if (action === 'down') this.keys['ArrowDown'] = isDown;
      if (action === 'left') this.keys['ArrowLeft'] = isDown;
      if (action === 'right') this.keys['ArrowRight'] = isDown;
      if (action === 'actionA' || action === 'actionB') this.keys['Space'] = isDown;
    },

    createSmoke(x, y) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        radius: Math.random() * 4 + 3,
        color: '#00f0ff',
        life: 0.5
      });
    },

    update(dt) {
      const c = this.car;

      // Countdown timer
      this.timeRemaining -= dt;
      this.callbacks.onLives(Math.max(0, Math.ceil(this.timeRemaining)));

      if (this.timeRemaining <= 0) {
        window.ArcadeAudio.playGameOver();
        this.isRunning = false;
        this.callbacks.onGameOver(this.score);
        return;
      }

      // Throttle & Brake
      const wantGas = this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'];
      const wantBrake = this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'];
      const wantHandbrake = this.keys[' '] || this.keys['Space'];

      if (wantGas) {
        c.speed = Math.min(c.maxSpeed, c.speed + c.accel * dt);
      } else if (wantBrake) {
        c.speed = Math.max(-100, c.speed - c.accel * 1.5 * dt);
      } else {
        c.speed *= Math.pow(c.friction, dt * 60);
      }

      // Steering
      const isMoving = Math.abs(c.speed) > 10;
      const steerDir = c.speed >= 0 ? 1 : -1;

      let isTurning = false;
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
        if (isMoving) {
          c.angle -= c.steerRate * steerDir * dt;
          isTurning = true;
        }
      }
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
        if (isMoving) {
          c.angle += c.steerRate * steerDir * dt;
          isTurning = true;
        }
      }

      // Drift physics check
      c.isDrifting = (wantHandbrake || (isTurning && Math.abs(c.speed) > 180));
      if (c.isDrifting) {
        c.speed *= Math.pow(c.driftFactor, dt * 60);
        this.driftScore += 180 * dt;
        this.score = Math.floor(this.driftScore + this.laps * 1000);
        this.callbacks.onScore(this.score);

        // Record skidmarks
        const rearX1 = c.x - Math.cos(c.angle) * 14 - Math.sin(c.angle) * 8;
        const rearY1 = c.y - Math.sin(c.angle) * 14 + Math.cos(c.angle) * 8;
        const rearX2 = c.x - Math.cos(c.angle) * 14 + Math.sin(c.angle) * 8;
        const rearY2 = c.y - Math.sin(c.angle) * 14 - Math.cos(c.angle) * 8;

        this.skidmarks.push({ x: rearX1, y: rearY1, alpha: 0.8 });
        this.skidmarks.push({ x: rearX2, y: rearY2, alpha: 0.8 });
        if (this.skidmarks.length > 250) {
          this.skidmarks.splice(0, 2);
        }

        this.createSmoke(rearX1, rearY1);
        this.createSmoke(rearX2, rearY2);
      }

      // Move car
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;

      // Track boundary limits
      c.x = Math.max(20, Math.min(this.canvas.width - 20, c.x));
      c.y = Math.max(20, Math.min(this.canvas.height - 20, c.y));

      // Checkpoint verification
      const cp = this.checkpoints[this.currentCheckpoint];
      if (Math.abs(c.x - cp.x) < cp.w && Math.abs(c.y - cp.y) < cp.h) {
        window.ArcadeAudio.playCoin();
        this.timeRemaining += 6.0; // Bonus time
        this.currentCheckpoint = (this.currentCheckpoint + 1) % this.checkpoints.length;
        if (cp.isFinish) {
          this.laps += 1;
          this.score += 1000;
          this.callbacks.onScore(this.score);
          window.ArcadeAudio.playLevelUp();
        }
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt * 2.5;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    },

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark background terrain
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      // Race Track Outline (Closed Circuit)
      ctx.strokeStyle = '#181e33';
      ctx.lineWidth = 80;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(100, 450);
      ctx.lineTo(100, 180);
      ctx.arcTo(100, 90, 200, 90, 70);
      ctx.lineTo(380, 90);
      ctx.arcTo(450, 90, 450, 200, 70);
      ctx.lineTo(450, 360);
      ctx.arcTo(450, 470, 350, 470, 70);
      ctx.lineTo(100, 470);
      ctx.closePath();
      ctx.stroke();

      // Track Curbs / Borders
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Checkpoints
      const targetCp = this.checkpoints[this.currentCheckpoint];
      ctx.fillStyle = targetCp.isFinish ? '#ffe600' : '#00f0ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.fillRect(targetCp.x - targetCp.w / 2, targetCp.y - targetCp.h / 2, targetCp.w, targetCp.h);
      ctx.shadowBlur = 0;

      // Draw Skidmarks
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      for (const sm of this.skidmarks) {
        ctx.fillRect(sm.x - 2, sm.y - 2, 4, 4);
      }

      // Draw Smoke Particles
      for (const pt of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Player Car
      const c = this.car;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);

      // Chassis
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = c.isDrifting ? 16 : 8;
      ctx.beginPath();
      ctx.roundRect(-16, -10, 32, 20, 5);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#060a14';
      ctx.fillRect(-4, -8, 8, 16);

      // Headlights
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(14, -8, 3, 4);
      ctx.fillRect(14, 4, 3, 4);

      // Tail lights
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-16, -8, 2, 4);
      ctx.fillRect(-16, 4, 2, 4);

      ctx.restore();

      // HUD overlay: Time Remaining & Laps
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`TIME: ${Math.max(0, Math.ceil(this.timeRemaining))}s`, 20, 30);
      ctx.fillText(`LAPS: ${this.laps}`, 20, 48);
      ctx.fillText(`DRIFT: ${Math.floor(this.driftScore)}`, 20, 66);
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
