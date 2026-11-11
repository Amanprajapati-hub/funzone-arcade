/* ============================================================
   FUNZONE ARCADE — BALLOON POP FRENZY
   Compatible with FunZone Arcade game engine
   ============================================================ */

(function () {
  'use strict';

  window.ArcadeGames = window.ArcadeGames || {};

  const game = {
    canvas: null,
    ctx: null,
    callbacks: null,

    animationId: null,
    running: false,

    balloons: [],
    particles: [],

    score: 0,
    lives: 5,
    highScore: 0,

    width: 800,
    height: 500,

    lastTime: 0,
    spawnTimer: 0,
    spawnInterval: 900,

    handlePointer: null,
    handleResize: null,

    colors: [
      '#ff3b81',
      '#00e5ff',
      '#ffd166',
      '#7cff6b',
      '#a855f7',
      '#ff8c42'
    ],

    instructions:
      'Pop colorful balloons before they float away! Tap or click balloons to score points. Do not let too many escape!',

    /* --------------------------------------------------------
       REQUIRED BY FUNZONE APP
    -------------------------------------------------------- */

    init(canvas, callbacks) {
      this.destroy();

      this.canvas = canvas;
      this.callbacks = callbacks || {};

      if (!this.canvas) {
        console.error('Balloon Pop Frenzy: Canvas not found.');
        return;
      }

      this.ctx = this.canvas.getContext('2d');

      this.highScore = Number(
        localStorage.getItem('funzone_high_balloon-pop-frenzy') || 0
      );

      this.handleResize = () => this.resize();
      window.addEventListener('resize', this.handleResize);

      this.handlePointer = (event) => this.popAt(event);
      this.canvas.addEventListener('pointerdown', this.handlePointer);

      this.resize();
    },

    start() {
      if (!this.canvas || !this.ctx) return;

      this.score = 0;
      this.lives = 5;
      this.balloons = [];
      this.particles = [];

      this.spawnTimer = 0;
      this.spawnInterval = 900;
      this.lastTime = performance.now();
      this.running = true;

      this.updateHUD();
      this.draw();
      this.animationId = requestAnimationFrame((time) => this.loop(time));
    },

    restart() {
      this.stop();
      this.start();
    },

    stop() {
      this.running = false;

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    },

    destroy() {
      this.stop();

      if (this.canvas && this.handlePointer) {
        this.canvas.removeEventListener(
          'pointerdown',
          this.handlePointer
        );
      }

      if (this.handleResize) {
        window.removeEventListener('resize', this.handleResize);
      }

      this.balloons = [];
      this.particles = [];

      this.handlePointer = null;
      this.handleResize = null;
      this.canvas = null;
      this.ctx = null;
    },

    /* --------------------------------------------------------
       CANVAS SETUP
    -------------------------------------------------------- */

    resize() {
      if (!this.canvas || !this.ctx) return;

      const rect = this.canvas.getBoundingClientRect();

      const width = Math.max(
        320,
        Math.floor(rect.width || 800)
      );

      const height = Math.max(
        400,
        Math.floor(rect.height || 500)
      );

      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;

      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      this.width = width;
      this.height = height;
    },

    /* --------------------------------------------------------
       GAMEPLAY
    -------------------------------------------------------- */

    createBalloon() {
      const radius = 25 + Math.random() * 14;

      const x =
        radius +
        Math.random() * Math.max(1, this.width - radius * 2);

      const bonus = Math.random() < 0.15;

      this.balloons.push({
        x: x,
        y: this.height + radius + Math.random() * 30,
        radius: radius,

        color:
          this.colors[
            Math.floor(Math.random() * this.colors.length)
          ],

        speed:
          0.75 +
          Math.random() * 0.8 +
          Math.min(this.score / 200, 1.5),

        drift: (Math.random() - 0.5) * 0.8,
        phase: Math.random() * Math.PI * 2,

        points: bonus ? 25 : 10
      });
    },

    popAt(event) {
      if (!this.running || !this.canvas) return;

      event.preventDefault();

      const rect = this.canvas.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      for (let i = this.balloons.length - 1; i >= 0; i--) {
        const balloon = this.balloons[i];

        const dx = x - balloon.x;
        const dy = y - balloon.y;

        if (
          dx * dx + dy * dy <=
          balloon.radius * balloon.radius
        ) {
          this.popBalloon(i);
          return;
        }
      }
    },

    popBalloon(index) {
      const balloon = this.balloons[index];

      if (!balloon) return;

      this.score += balloon.points;

      for (let i = 0; i < 16; i++) {
        const angle =
          (Math.PI * 2 * i) / 16;

        const speed =
          1.5 + Math.random() * 3.5;

        this.particles.push({
          x: balloon.x,
          y: balloon.y,

          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,

          life: 1,
          size: 2 + Math.random() * 3,
          color: balloon.color
        });
      }

      this.balloons.splice(index, 1);

      this.updateHUD();

      if (
        window.ArcadeAudio &&
        typeof window.ArcadeAudio.playCoin === 'function'
      ) {
        try {
          window.ArcadeAudio.playCoin();
        } catch (error) {
          // Audio is optional.
        }
      }
    },

    update(delta) {
      if (!this.running) return;

      this.spawnTimer += delta;

      const difficulty = Math.min(
        this.score / 100,
        5
      );

      this.spawnInterval = Math.max(
        300,
        900 - difficulty * 100
      );

      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.createBalloon();

        if (
          this.score >= 150 &&
          Math.random() < 0.25
        ) {
          this.createBalloon();
        }
      }

      for (
        let i = this.balloons.length - 1;
        i >= 0;
        i--
      ) {
        const balloon = this.balloons[i];

        balloon.y -=
          balloon.speed * (delta / 16.67);

        balloon.phase +=
          0.025 * (delta / 16.67);

        balloon.x +=
          Math.sin(balloon.phase) *
          balloon.drift *
          (delta / 16.67);

        // Keep balloons inside horizontal area
        balloon.x = Math.max(
          balloon.radius,
          Math.min(
            this.width - balloon.radius,
            balloon.x
          )
        );

        // Balloon escaped
        if (
          balloon.y + balloon.radius < 0
        ) {
          this.balloons.splice(i, 1);

          this.lives--;

          this.updateHUD();

          if (this.lives <= 0) {
            this.gameOver();
            return;
          }
        }
      }

      // Update particles
      for (
        let i = this.particles.length - 1;
        i >= 0;
        i--
      ) {
        const particle = this.particles[i];

        particle.x +=
          particle.vx * (delta / 16.67);

        particle.y +=
          particle.vy * (delta / 16.67);

        particle.vy +=
          0.08 * (delta / 16.67);

        particle.life -=
          0.035 * (delta / 16.67);

        if (particle.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    },

    /* --------------------------------------------------------
       DRAWING
    -------------------------------------------------------- */

    drawBackground() {
      const ctx = this.ctx;

      const gradient =
        ctx.createLinearGradient(
          0,
          0,
          0,
          this.height
        );

      gradient.addColorStop(
        0,
        '#16234a'
      );

      gradient.addColorStop(
        0.5,
        '#0d1530'
      );

      gradient.addColorStop(
        1,
        '#050812'
      );

      ctx.fillStyle = gradient;
      ctx.fillRect(
        0,
        0,
        this.width,
        this.height
      );

      // Neon grid
      ctx.strokeStyle =
        'rgba(0, 229, 255, 0.07)';

      ctx.lineWidth = 1;

      for (
        let y = 0;
        y < this.height;
        y += 40
      ) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }

      // Stars / particles
      ctx.fillStyle =
        'rgba(255, 255, 255, 0.25)';

      for (let i = 0; i < 25; i++) {
        const x =
          (i * 97) % this.width;

        const y =
          (i * 53) % this.height;

        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    drawBalloon(balloon) {
      const ctx = this.ctx;

      ctx.save();

      // Glow
      ctx.shadowColor = balloon.color;
      ctx.shadowBlur = 18;

      // Balloon body
      ctx.beginPath();

      ctx.ellipse(
        balloon.x,
        balloon.y,
        balloon.radius * 0.82,
        balloon.radius,
        0,
        0,
        Math.PI * 2
      );

      const gradient =
        ctx.createRadialGradient(
          balloon.x - balloon.radius * 0.3,
          balloon.y - balloon.radius * 0.35,
          2,
          balloon.x,
          balloon.y,
          balloon.radius
        );

      gradient.addColorStop(
        0,
        '#ffffff'
      );

      gradient.addColorStop(
        0.12,
        balloon.color
      );

      gradient.addColorStop(
        1,
        'rgba(0, 0, 0, 0.45)'
      );

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.shadowBlur = 0;

      // Balloon highlight
      ctx.fillStyle =
        'rgba(255,255,255,0.45)';

      ctx.beginPath();

      ctx.ellipse(
        balloon.x - balloon.radius * 0.28,
        balloon.y - balloon.radius * 0.3,
        balloon.radius * 0.16,
        balloon.radius * 0.28,
        -0.4,
        0,
        Math.PI * 2
      );

      ctx.fill();

      // Knot
      ctx.fillStyle = balloon.color;

      ctx.beginPath();

      ctx.moveTo(
        balloon.x - 6,
        balloon.y + balloon.radius * 0.86
      );

      ctx.lineTo(
        balloon.x + 6,
        balloon.y + balloon.radius * 0.86
      );

      ctx.lineTo(
        balloon.x,
        balloon.y + balloon.radius + 8
      );

      ctx.closePath();
      ctx.fill();

      // String
      ctx.strokeStyle =
        'rgba(255,255,255,0.55)';

      ctx.lineWidth = 1.2;

      ctx.beginPath();

      ctx.moveTo(
        balloon.x,
        balloon.y + balloon.radius + 6
      );

      ctx.quadraticCurveTo(
        balloon.x +
          Math.sin(balloon.phase) * 15,
        balloon.y + balloon.radius + 28,
        balloon.x,
        balloon.y + balloon.radius + 50
      );

      ctx.stroke();

      // Bonus balloon
      if (balloon.points === 25) {
        ctx.fillStyle = '#ffffff';

        ctx.font =
          'bold 14px Arial';

        ctx.textAlign = 'center';

        ctx.fillText(
          '+25',
          balloon.x,
          balloon.y + 5
        );
      }

      ctx.restore();
    },

    drawParticles() {
      const ctx = this.ctx;

      this.particles.forEach(
        (particle) => {
          ctx.save();

          ctx.globalAlpha =
            Math.max(0, particle.life);

          ctx.fillStyle =
            particle.color;

          ctx.shadowColor =
            particle.color;

          ctx.shadowBlur = 10;

          ctx.beginPath();

          ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
          );

          ctx.fill();

          ctx.restore();
        }
      );
    },

    drawMessage() {
      const ctx = this.ctx;

      if (
        this.balloons.length === 0 &&
        this.score === 0
      ) {
        ctx.save();

        ctx.fillStyle =
          'rgba(255,255,255,0.8)';

        ctx.font =
          'bold 18px Arial';

        ctx.textAlign =
          'center';

        ctx.fillText(
          'TAP OR CLICK THE BALLOONS!',
          this.width / 2,
          this.height / 2
        );

        ctx.font =
          '14px Arial';

        ctx.fillStyle =
          'rgba(0,229,255,0.75)';

        ctx.fillText(
          'Don’t let them escape!',
          this.width / 2,
          this.height / 2 + 30
        );

        ctx.restore();
      }
    },

    draw() {
      if (!this.ctx) return;

      this.drawBackground();

      this.balloons.forEach(
        (balloon) =>
          this.drawBalloon(balloon)
      );

      this.drawParticles();
      this.drawMessage();
    },

    /* --------------------------------------------------------
       GAME LOOP
    -------------------------------------------------------- */

    loop(timestamp) {
      if (!this.running) return;

      const delta = Math.min(
        timestamp - this.lastTime,
        40
      );

      this.lastTime = timestamp;

      this.update(delta);
      this.draw();

      if (this.running) {
        this.animationId =
          requestAnimationFrame(
            (time) => this.loop(time)
          );
      }
    },

    /* --------------------------------------------------------
       HUD AND GAME OVER
    -------------------------------------------------------- */

    updateHUD() {
      if (
        this.callbacks &&
        typeof this.callbacks.onScore ===
          'function'
      ) {
        this.callbacks.onScore(this.score);
      }

      if (
        this.callbacks &&
        typeof this.callbacks.onLives ===
          'function'
      ) {
        this.callbacks.onLives(this.lives);
      }
    },

    gameOver() {
      if (!this.running) return;

      this.running = false;

      if (this.animationId) {
        cancelAnimationFrame(
          this.animationId
        );

        this.animationId = null;
      }

      if (
        this.callbacks &&
        typeof this.callbacks.onGameOver ===
          'function'
      ) {
        this.callbacks.onGameOver(
          this.score
        );
      }
    }
  };

  window.ArcadeGames[
    'balloon-pop-frenzy'
  ] = game;
})();