
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['rhythm-reactor'] = {
    id: 'rhythm-reactor',
    title: 'Rhythm Reactor',
    category: 'Music',
    description: 'Hit falling neon notes in time, build combos, and power up the Rhythm Reactor!',
    instructions: 'Tap one of the four lanes when a note reaches the glowing target line. Use A, S, D, F keys on desktop or tap the lanes on mobile. Score points for accurate timing.',
    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,
    lastTime: 0,

    lanes: 4,
    laneKeys: ['A', 'S', 'D', 'F'],
    laneColors: ['#39f5c5', '#55aaff', '#b58cff', '#ff5f9e'],
    notes: [],
    particles: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    health: 100,
    elapsed: 0,
    duration: 60,
    spawnTimer: 0,
    spawnInterval: 0.75,
    targetY: 430,
    noteSpeed: 220,
    hitFlash: [0, 0, 0, 0],
    boundPointer: null,
    boundKeyDown: null,
    boundKeyUp: null,
    heldKeys: {},

    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        canvas.width = 400;
        canvas.height = 540;
        canvas.style.touchAction = 'none';

        this.boundPointer = e => this.handlePointer(e);
        this.boundKeyDown = e => this.handleKeyDown(e);
        this.boundKeyUp = e => this.handleKeyUp(e);

        canvas.addEventListener('pointerdown', this.boundPointer);
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);

        this.reset();
    },

    reset() {
        this.notes = [];
        this.particles = [];
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.health = 100;
        this.elapsed = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 0.75;
        this.hitFlash = [0, 0, 0, 0];
        this.heldKeys = {};
        this.finished = false;
        this.isPaused = false;
        this.isRunning = false;
        this.lastTime = 0;
        this.updateScore();
        this.draw();
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isPaused = false;
        this.finished = false;
        this.lastTime = 0;
        this.loop();
    },

    loop(timestamp = 0) {
        if (!this.isRunning || this.isPaused) return;

        const dt = this.lastTime ? Math.min((timestamp - this.lastTime) / 1000, 0.05) : 0;
        this.lastTime = timestamp;

        if (!this.finished) {
            this.update(dt);
        }

        this.draw();
        this.animationId = requestAnimationFrame(t => this.loop(t));
    },

    update(dt) {
        this.elapsed += dt;
        this.spawnTimer += dt;

        // Gradually increase difficulty
        this.spawnInterval = Math.max(0.42, 0.75 - this.elapsed * 0.004);
        this.noteSpeed = 220 + Math.min(100, this.elapsed * 1.5);

        while (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            this.spawnNote();
        }

        this.notes.forEach(note => {
            note.y += this.noteSpeed * dt;
        });

        // Missed notes
        this.notes = this.notes.filter(note => {
            if (note.y > this.targetY + 35) {
                this.health = Math.max(0, this.health - 12);
                this.combo = 0;
                this.updateScore();
                return false;
            }
            return true;
        });

        this.hitFlash = this.hitFlash.map(v => Math.max(0, v - dt * 3));
        this.updateParticles(dt);

        if (this.health <= 0 || this.elapsed >= this.duration) {
            this.finishGame();
        }
    },

    spawnNote() {
        const lane = Math.floor(Math.random() * this.lanes);
        this.notes.push({
            lane,
            y: 90,
            hit: false
        });
    },

    getLaneAt(x) {
        return Math.max(0, Math.min(3, Math.floor((x - 24) / 88)));
    },

    handlePointer(e) {
        if (!this.isRunning || this.isPaused || this.finished) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (400 / rect.width);
        const lane = this.getLaneAt(x);
        this.hitLane(lane);
    },

    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused || this.finished) return;
        const key = e.key.toLowerCase();
        const index = ['a', 's', 'd', 'f'].indexOf(key);
        if (index >= 0 && !this.heldKeys[key]) {
            this.heldKeys[key] = true;
            this.hitLane(index);
            e.preventDefault();
        }
    },

    handleKeyUp(e) {
        this.heldKeys[e.key.toLowerCase()] = false;
    },

    hitLane(lane) {
        if (this.finished || this.isPaused) return;

        let nearest = null;
        let nearestDistance = Infinity;

        this.notes.forEach(note => {
            if (note.lane !== lane) return;
            const distance = Math.abs(note.y - this.targetY);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = note;
            }
        });

        if (!nearest) return;

        if (nearestDistance <= 45) {
            this.notes.splice(this.notes.indexOf(nearest), 1);

            let points = 0;
            if (nearestDistance <= 14) points = 100;
            else if (nearestDistance <= 28) points = 70;
            else points = 40;

            this.combo++;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            this.score += points + Math.min(50, this.combo * 2);
            this.health = Math.min(100, this.health + 2);
            this.hitFlash[lane] = 1;
            this.addParticles(68 + lane * 88, this.targetY, this.laneColors[lane]);
            this.updateScore();
        } else {
            this.combo = 0;
            this.health = Math.max(0, this.health - 4);
            this.updateScore();
        }
    },

    addParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                life: 0.45,
                color
            });
        }
    },

    updateParticles(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            return p.life > 0;
        });
    },

    updateScore() {
        if (this.callbacks.onScore) this.callbacks.onScore(this.score);
        if (this.callbacks.onLives) this.callbacks.onLives(Math.ceil(this.health / 20));
    },

    finishGame() {
        if (this.finished) return;
        this.finished = true;
        this.isRunning = false;
        this.updateScore();
        if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
    },

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 400, 540);

        ctx.fillStyle = '#08091c';
        ctx.fillRect(0, 0, 400, 540);

        // Background grid
        ctx.strokeStyle = 'rgba(90,130,190,0.1)';
        ctx.lineWidth = 1;
        for (let x = 24; x <= 376; x += 22) {
            ctx.beginPath();
            ctx.moveTo(x, 75);
            ctx.lineTo(x, 485);
            ctx.stroke();
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#39f5c5';
        ctx.font = 'bold 23px Arial';
        ctx.fillText('RHYTHM REACTOR', 200, 34);

        ctx.fillStyle = '#b6c7df';
        ctx.font = '12px Arial';
        ctx.fillText(`SCORE: ${this.score}`, 85, 61);
        ctx.fillText(`COMBO: ${this.combo}`, 200, 61);
        ctx.fillText(`TIME: ${Math.max(0, Math.ceil(this.duration - this.elapsed))}s`, 315, 61);

        // Health bar
        ctx.fillStyle = '#1b2c40';
        ctx.beginPath();
        ctx.roundRect(30, 76, 340, 9, 5);
        ctx.fill();
        ctx.fillStyle = this.health > 35 ? '#39f5c5' : '#ff5f7e';
        ctx.beginPath();
        ctx.roundRect(30, 76, 340 * this.health / 100, 9, 5);
        ctx.fill();

        // Lanes
        for (let i = 0; i < this.lanes; i++) {
            const x = 24 + i * 88;
            ctx.fillStyle = this.hitFlash[i] > 0
                ? `rgba(255,255,255,${this.hitFlash[i] * 0.18})`
                : 'rgba(20,35,60,0.6)';
            ctx.fillRect(x, 95, 80, 390);

            ctx.strokeStyle = this.laneColors[i];
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, 95, 80, 390);
            ctx.globalAlpha = 1;

            ctx.fillStyle = this.laneColors[i];
            ctx.font = 'bold 15px Arial';
            ctx.fillText(this.laneKeys[i], x + 40, 510);
        }

        // Target line
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#39f5c5';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(24, this.targetY);
        ctx.lineTo(376, this.targetY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Notes
        this.notes.forEach(note => {
            const x = 64 + note.lane * 88;
            const color = this.laneColors[note.lane];

            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.roundRect(x - 17, note.y - 12, 34, 24, 7);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#08121b';
            ctx.beginPath();
            ctx.arc(x, note.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / 0.45);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#aab8cc';
        ctx.font = '11px Arial';
        ctx.fillText('TAP THE LANES WHEN NOTES REACH THE LINE', 200, 530);

        if (this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.9)';
            ctx.fillRect(0, 0, 400, 540);
            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('SESSION COMPLETE!', 200, 225);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText(`Final score: ${this.score}`, 200, 265);
            ctx.fillText(`Best combo: ${this.bestCombo}`, 200, 295);
            ctx.fillText(`Accuracy challenge: ${this.health}% energy`, 200, 325);
        }
    },

    pause() {
        this.isPaused = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    },

    resume() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;
        this.lastTime = 0;
        this.loop();
    },

    restart() {
        this.destroy();
        this.init(this.canvas, this.callbacks);
        this.start();
    },

    destroy() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);

        if (this.canvas) {
            this.canvas.removeEventListener('pointerdown', this.boundPointer);
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.boundKeyDown);
            window.removeEventListener('keyup', this.boundKeyUp);
        }

        this.boundPointer = null;
        this.boundKeyDown = null;
        this.boundKeyUp = null;
        this.animationId = null;
        this.heldKeys = {};
    }
};
