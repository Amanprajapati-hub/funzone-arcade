/**
 * Game 9: Memory Matrix (Puzzle)
 * Cyber Security Pattern Memory Sequence Trainer
 */
(function() {
  window.ArcadeGames = window.ArcadeGames || {};

  window.ArcadeGames['memory-matrix'] = {
    id: 'memory-matrix',
    title: 'Memory Matrix',
    category: 'Puzzle',
    description: 'Hack the cyber core! Memorize complex cryptographic node flashes and replay the sequences.',
    instructions: 'Observe the flashing cyber nodes and their harmonic audio, then click them in identical sequence.',

    canvas: null,
    ctx: null,
    callbacks: null,
    animId: null,
    isRunning: false,
    isPaused: false,

    gridSize: 3, // 3x3 = 9 nodes
    nodes: [],
    sequence: [],
    playerIndex: 0,
    round: 1,
    score: 0,
    lives: 3,
    state: 'idle', // 'displaying', 'waiting_input', 'success', 'failure'
    flashTimer: 0,
    displayIndex: 0,
    activeFlashNode: -1,
    statusText: 'INITIALIZING SYSTEM...',
    particles: [],

    nodeFrequencies: [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3, 587.3],
    nodeColors: ['#00f0ff', '#ff007f', '#ffe600', '#00ff88', '#a855f7', '#ff5500', '#3b82f6', '#14b8a6', '#ec4899'],

    init(canvas, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.callbacks = callbacks;
      this.canvas.width = 400;
      this.canvas.height = 480;

      this.boundMouseDown = this.onMouseDown.bind(this);
      this.canvas.addEventListener('mousedown', this.boundMouseDown);

      // Build 3x3 nodes geometry
      this.nodes = [];
      const nodeSize = 90;
      const spacing = 20;
      const startX = (400 - (3 * nodeSize + 2 * spacing)) / 2;
      const startY = 120;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          this.nodes.push({
            id: r * 3 + c,
            x: startX + c * (nodeSize + spacing),
            y: startY + r * (nodeSize + spacing),
            w: nodeSize,
            h: nodeSize,
            color: this.nodeColors[r * 3 + c],
            freq: this.nodeFrequencies[r * 3 + c],
            isLit: false,
            litAlpha: 0
          });
        }
      }
    },

    start() {
      this.reset();
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = performance.now();
      this.startNewRound();
      this.loop();
    },

    reset() {
      this.round = 1;
      this.score = 0;
      this.lives = 3;
      this.sequence = [];
      this.playerIndex = 0;
      this.activeFlashNode = -1;
      this.particles = [];
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
      if (!this.isRunning || this.isPaused || this.state !== 'waiting_input') return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      for (const node of this.nodes) {
        if (mx >= node.x && mx <= node.x + node.w && my >= node.y && my <= node.y + node.h) {
          this.handleNodeClick(node);
          break;
        }
      }
    },

    handleInput(action, isDown) {
      // Direct keyboard or button fallback for accessibility
      if (!isDown || this.state !== 'waiting_input') return;
      if (action === 'actionA') {
        // Quick trigger center node
        this.handleNodeClick(this.nodes[4]);
      }
    },

    startNewRound() {
      // Add random node to sequence
      const nextNode = Math.floor(Math.random() * 9);
      this.sequence.push(nextNode);
      this.playerIndex = 0;
      this.displayIndex = 0;
      this.state = 'displaying';
      this.flashTimer = 0.5;
      this.statusText = `ROUND ${this.round} — WATCH SEQUENCE`;
    },

    flashNode(id, duration = 0.35) {
      const node = this.nodes[id];
      if (!node) return;
      node.litAlpha = 1.0;
      window.ArcadeAudio.playNote(node.freq, duration, 'sine');
      this.createSparks(node.x + node.w / 2, node.y + node.h / 2, node.color, 8);
    },

    handleNodeClick(node) {
      this.flashNode(node.id, 0.2);

      // Check against current step in sequence
      const expected = this.sequence[this.playerIndex];
      if (node.id === expected) {
        this.playerIndex++;
        this.score += 50;
        this.callbacks.onScore(this.score);

        // Completed sequence?
        if (this.playerIndex >= this.sequence.length) {
          this.state = 'success';
          this.statusText = 'ACCESS GRANTED! +200 PTS';
          this.score += 200;
          this.callbacks.onScore(this.score);
          window.ArcadeAudio.playLevelUp();

          setTimeout(() => {
            if (!this.isRunning) return;
            this.round++;
            this.startNewRound();
          }, 1200);
        }
      } else {
        // Mistake!
        window.ArcadeAudio.playHit(150);
        this.lives -= 1;
        this.callbacks.onLives(this.lives);
        this.statusText = 'SECURITY BREACH DETECTED!';

        if (this.lives <= 0) {
          window.ArcadeAudio.playGameOver();
          this.isRunning = false;
          this.callbacks.onGameOver(this.score);
        } else {
          // Re-display sequence
          this.state = 'displaying';
          this.displayIndex = 0;
          this.playerIndex = 0;
          this.flashTimer = 1.0;
        }
      }
    },

    createSparks(x, y, color = '#00f0ff', count = 8) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          radius: Math.random() * 2.5 + 1.5,
          color: color,
          life: 0.6
        });
      }
    },

    update(dt) {
      // Sequence display state machine
      if (this.state === 'displaying') {
        this.flashTimer -= dt;
        if (this.flashTimer <= 0) {
          if (this.displayIndex < this.sequence.length) {
            const nodeId = this.sequence[this.displayIndex];
            this.flashNode(nodeId, 0.35);
            this.displayIndex++;
            this.flashTimer = Math.max(0.4, 0.7 - this.round * 0.02);
          } else {
            this.state = 'waiting_input';
            this.statusText = 'YOUR TURN — REPEAT PATTERN';
          }
        }
      }

      // Fade out node glow
      for (const n of this.nodes) {
        if (n.litAlpha > 0) {
          n.litAlpha = Math.max(0, n.litAlpha - dt * 3.5);
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

      // Dark cyber terminal
      ctx.fillStyle = '#060a15';
      ctx.fillRect(0, 0, w, h);

      // Terminal Header & Status
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.statusText, w / 2, 45);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`NODE LENGTH: ${this.sequence.length} | ATTEMPTS: ${this.lives}`, w / 2, 75);

      // Draw 3x3 Nodes
      for (const n of this.nodes) {
        ctx.save();
        const baseColor = n.litAlpha > 0 ? n.color : '#0f172a';
        ctx.fillStyle = baseColor;
        ctx.strokeStyle = n.color;
        ctx.lineWidth = n.litAlpha > 0 ? 3 : 1.5;

        if (n.litAlpha > 0) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 18 * n.litAlpha;
        }

        ctx.beginPath();
        ctx.roundRect(n.x, n.y, n.w, n.h, 14);
        ctx.fill();
        ctx.stroke();

        // Node center glyph / icon
        ctx.fillStyle = n.litAlpha > 0 ? '#ffffff' : n.color;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`0${n.id + 1}`, n.x + n.w / 2, n.y + n.h / 2);
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
