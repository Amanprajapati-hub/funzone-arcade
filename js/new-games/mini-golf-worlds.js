
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['mini-golf-worlds'] = {
    id: 'mini-golf-worlds',
    title: 'Mini Golf Worlds',
    category: 'Sports',
    description: 'Master tricky mini-golf courses, avoid obstacles, and sink the ball in as few shots as possible.',
    instructions: 'Drag from the ball backwards to aim and set power, then release to shoot. Complete all 5 holes with the lowest score possible.',
    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,
    lastTime: 0,

    holes: [
        { start: [65, 270], cup: [340, 270], walls: [], obstacles: [] },
        { start: [55, 270], cup: [350, 270], walls: [{x:150,y:170,w:18,h:200}], obstacles: [{x:240,y:220,r:24}] },
        { start: [60, 420], cup: [340, 120], walls: [{x:120,y:260,w:190,h:16}], obstacles: [{x:210,y:190,r:22}] },
        { start: [60, 100], cup: [340, 420], walls: [{x:150,y:100,w:16,h:240},{x:260,y:200,w:16,h:240}], obstacles: [{x:210,y:350,r:25}] },
        { start: [60, 270], cup: [340, 270], walls: [{x:115,y:170,w:16,h:200},{x:270,y:170,w:16,h:200}], obstacles: [{x:195,y:270,r:30},{x:340,y:170,r:18}] }
    ],

    holeIndex: 0,
    ball: { x: 65, y: 270, vx: 0, vy: 0, r: 9 },
    strokes: 0,
    totalStrokes: 0,
    holePar: 3,
    holeScores: [],
    aiming: false,
    aimX: 0,
    aimY: 0,
    pointerX: 0,
    pointerY: 0,
    power: 0,
    friction: 0.985,
    buttons: [],
    boundDown: null,
    boundMove: null,
    boundUp: null,

    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        canvas.width = 400;
        canvas.height = 540;
        canvas.style.touchAction = 'none';

        this.boundDown = e => this.pointerDown(e);
        this.boundMove = e => this.pointerMove(e);
        this.boundUp = e => this.pointerUp(e);

        canvas.addEventListener('pointerdown', this.boundDown);
        canvas.addEventListener('pointermove', this.boundMove);
        canvas.addEventListener('pointerup', this.boundUp);
        canvas.addEventListener('pointercancel', this.boundUp);

        this.reset();
    },

    
reset() {
    // Shuffle all 5 golf courses for every new game
    this.holes = [
        { start: [65, 270], cup: [340, 270], walls: [], obstacles: [] },
        { start: [55, 270], cup: [350, 270], walls: [{x:150,y:170,w:18,h:200}], obstacles: [{x:240,y:220,r:24}] },
        { start: [60, 420], cup: [340, 120], walls: [{x:120,y:260,w:190,h:16}], obstacles: [{x:210,y:190,r:22}] },
        { start: [60, 100], cup: [340, 420], walls: [{x:150,y:100,w:16,h:240},{x:260,y:200,w:16,h:240}], obstacles: [{x:210,y:350,r:25}] },
        { start: [60, 270], cup: [340, 270], walls: [{x:115,y:170,w:16,h:200},{x:270,y:170,w:16,h:200}], obstacles: [{x:195,y:270,r:30},{x:340,y:170,r:18}] }
    ];

    // Random course order
    for (let i = this.holes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.holes[i], this.holes[j]] = [this.holes[j], this.holes[i]];
    }

    this.holeIndex = 0;
    this.strokes = 0;
    this.totalStrokes = 0;
    this.holeScores = [];
    this.finished = false;
    this.isPaused = false;
    this.isRunning = false;
    this.lastTime = 0;
    this.aiming = false;
    this.power = 0;

    this.loadHole();
    this.updateScore();
    this.draw();
},


    loadHole() {
        const h = this.holes[this.holeIndex];
        this.ball = { x: h.start[0], y: h.start[1], vx: 0, vy: 0, r: 9 };
        this.strokes = 0;
        this.aiming = false;
        this.power = 0;
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

        const dt = this.lastTime ? Math.min((timestamp - this.lastTime) / 16.67, 2) : 1;
        this.lastTime = timestamp;

        if (!this.finished) this.update(dt);
        this.draw();

        this.animationId = requestAnimationFrame(t => this.loop(t));
    },

    update(dt) {
        const b = this.ball;
        if (Math.abs(b.vx) < 0.025) b.vx = 0;
        if (Math.abs(b.vy) < 0.025) b.vy = 0;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.vx *= Math.pow(this.friction, dt);
        b.vy *= Math.pow(this.friction, dt);

        // Course boundaries
        if (b.x < 28 + b.r) { b.x = 28 + b.r; b.vx *= -0.65; }
        if (b.x > 372 - b.r) { b.x = 372 - b.r; b.vx *= -0.65; }
        if (b.y < 92 + b.r) { b.y = 92 + b.r; b.vy *= -0.65; }
        if (b.y > 448 - b.r) { b.y = 448 - b.r; b.vy *= -0.65; }

        const hole = this.holes[this.holeIndex];

        // Rectangular obstacles
        hole.walls.forEach(w => {
            if (b.x + b.r > w.x && b.x - b.r < w.x + w.w &&
                b.y + b.r > w.y && b.y - b.r < w.y + w.h) {
                const left = Math.abs((b.x + b.r) - w.x);
                const right = Math.abs((w.x + w.w) - (b.x - b.r));
                const top = Math.abs((b.y + b.r) - w.y);
                const bottom = Math.abs((w.y + w.h) - (b.y - b.r));
                const m = Math.min(left, right, top, bottom);

                if (m === left) { b.x = w.x - b.r; b.vx = -Math.abs(b.vx) * 0.7; }
                else if (m === right) { b.x = w.x + w.w + b.r; b.vx = Math.abs(b.vx) * 0.7; }
                else if (m === top) { b.y = w.y - b.r; b.vy = -Math.abs(b.vy) * 0.7; }
                else { b.y = w.y + w.h + b.r; b.vy = Math.abs(b.vy) * 0.7; }
            }
        });

        // Circular bumpers
        hole.obstacles.forEach(o => {
            const dx = b.x - o.x;
            const dy = b.y - o.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b.r + o.r;
            if (dist < minDist && dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                b.x = o.x + nx * minDist;
                b.y = o.y + ny * minDist;
                const dot = b.vx * nx + b.vy * ny;
                if (dot < 0) {
                    b.vx -= 1.6 * dot * nx;
                    b.vy -= 1.6 * dot * ny;
                }
            }
        });

        // Cup detection
        const cup = hole.cup;
        const distance = Math.hypot(b.x - cup[0], b.y - cup[1]);
        if (distance < 15 && Math.hypot(b.vx, b.vy) < 3.5) {
            b.x = cup[0];
            b.y = cup[1];
            b.vx = 0;
            b.vy = 0;
            this.finishHole();
        }
    },

    getPointer(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (400 / rect.width),
            y: (e.clientY - rect.top) * (540 / rect.height)
        };
    },

    pointerDown(e) {
        if (this.finished || this.isPaused || !this.isRunning) return;
        if (Math.hypot(this.ball.vx, this.ball.vy) > 0.15) return;

        const p = this.getPointer(e);
        if (Math.hypot(p.x - this.ball.x, p.y - this.ball.y) <= 35) {
            this.aiming = true;
            this.aimX = p.x;
            this.aimY = p.y;
            this.pointerX = p.x;
            this.pointerY = p.y;
            this.canvas.setPointerCapture?.(e.pointerId);
        }
    },

    pointerMove(e) {
        if (!this.aiming) return;
        const p = this.getPointer(e);
        this.pointerX = p.x;
        this.pointerY = p.y;
        this.power = Math.min(100, Math.hypot(this.ball.x - p.x, this.ball.y - p.y));
        this.draw();
    },

    pointerUp() {
        if (!this.aiming) return;
        this.aiming = false;

        const dx = this.ball.x - this.pointerX;
        const dy = this.ball.y - this.pointerY;
        const distance = Math.hypot(dx, dy);

        if (distance > 8) {
            const force = Math.min(distance, 100) * 0.13;
            this.ball.vx = (dx / distance) * force;
            this.ball.vy = (dy / distance) * force;
            this.strokes++;
            this.totalStrokes++;
            this.updateScore();
        }
        this.power = 0;
    },

    finishHole() {
        this.holeScores.push(this.strokes);
        this.totalStrokes += 0;
        this.updateScore();

        if (this.holeIndex >= this.holes.length - 1) {
            this.finished = true;
            this.isRunning = false;
            this.updateScore();
            if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
        } else {
            this.holeIndex++;
            this.loadHole();
        }
    },

    get score() {
        return this.holeScores.reduce((sum, s) => sum + s, 0);
    },

    updateScore() {
        if (this.callbacks.onScore) this.callbacks.onScore(this.score);
    },

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const hole = this.holes[this.holeIndex];
        ctx.clearRect(0, 0, 400, 540);

        ctx.fillStyle = '#08121b';
        ctx.fillRect(0, 0, 400, 540);

        // Course
        ctx.fillStyle = '#143b35';
        ctx.beginPath();
        ctx.roundRect(18, 82, 364, 380, 18);
        ctx.fill();
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Grass stripes
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(22, 86, 356, 372, 14);
        ctx.clip();
        ctx.strokeStyle = 'rgba(80,220,160,0.08)';
        ctx.lineWidth = 14;
        for (let y = 90; y < 460; y += 32) {
            ctx.beginPath();
            ctx.moveTo(20, y);
            ctx.lineTo(380, y);
            ctx.stroke();
        }
        ctx.restore();

        // Obstacles
        hole.walls.forEach(w => {
            ctx.fillStyle = '#526b83';
            ctx.beginPath();
            ctx.roundRect(w.x, w.y, w.w, w.h, 5);
            ctx.fill();
            ctx.strokeStyle = '#8da8c2';
            ctx.stroke();
        });

        hole.obstacles.forEach(o => {
            ctx.fillStyle = '#e09b44';
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 3;
            ctx.stroke();
        });

        // Cup
        ctx.fillStyle = '#050a10';
        ctx.beginPath();
        ctx.arc(hole.cup[0], hole.cup[1], 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Flag
        ctx.strokeStyle = '#e7edf5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hole.cup[0], hole.cup[1] - 10);
        ctx.lineTo(hole.cup[0], hole.cup[1] - 48);
        ctx.stroke();
        ctx.fillStyle = '#ff5f7e';
        ctx.beginPath();
        ctx.moveTo(hole.cup[0], hole.cup[1] - 48);
        ctx.lineTo(hole.cup[0] + 23, hole.cup[1] - 40);
        ctx.lineTo(hole.cup[0], hole.cup[1] - 32);
        ctx.closePath();
        ctx.fill();

        // Ball
        ctx.fillStyle = '#f5f8ff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a8c8e8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Aim guide
        if (this.aiming) {
            const dx = this.ball.x - this.pointerX;
            const dy = this.ball.y - this.pointerY;
            const d = Math.hypot(dx, dy);
            if (d > 0) {
                const length = Math.min(d, 100);
                ctx.strokeStyle = '#39f5c5';
                ctx.lineWidth = 3;
                ctx.setLineDash([7, 5]);
                ctx.beginPath();
                ctx.moveTo(this.ball.x, this.ball.y);
                ctx.lineTo(this.ball.x + dx / d * length, this.ball.y + dy / d * length);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // HUD
        ctx.fillStyle = '#39f5c5';
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('MINI GOLF WORLDS', 200, 32);

        ctx.fillStyle = '#d5e4ef';
        ctx.font = '13px Arial';
        ctx.fillText(`HOLE ${this.holeIndex + 1} / ${this.holes.length}`, 100, 61);
        ctx.fillText(`STROKES: ${this.strokes}`, 200, 61);
        ctx.fillText(`TOTAL: ${this.totalStrokes}`, 305, 61);

        ctx.fillStyle = '#aab8cc';
        ctx.font = '12px Arial';
        ctx.fillText('DRAG BACK FROM THE BALL TO AIM', 200, 490);

        if (this.aiming) {
            ctx.fillStyle = '#ffd166';
            ctx.fillText(`POWER: ${Math.round(this.power)}%`, 200, 515);
        } else if (Math.hypot(this.ball.vx, this.ball.vy) > 0.15) {
            ctx.fillStyle = '#7db8ff';
            ctx.fillText('BALL IN MOTION...', 200, 515);
        } else {
            ctx.fillStyle = '#7db8ff';
            ctx.fillText('PULL BACK AND RELEASE TO SHOOT', 200, 515);
        }

        if (this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.88)';
            ctx.fillRect(0, 0, 400, 540);
            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('COURSE COMPLETE!', 200, 230);
            ctx.fillStyle = '#ffffff';
            ctx.font = '17px Arial';
            ctx.fillText(`Total strokes: ${this.totalStrokes}`, 200, 270);
            ctx.fillText('All 5 holes completed!', 200, 302);
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
            this.canvas.removeEventListener('pointerdown', this.boundDown);
            this.canvas.removeEventListener('pointermove', this.boundMove);
            this.canvas.removeEventListener('pointerup', this.boundUp);
            this.canvas.removeEventListener('pointercancel', this.boundUp);
        }
        this.boundDown = null;
        this.boundMove = null;
        this.boundUp = null;
        this.animationId = null;
    }
};
