
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['pinball-galaxy'] = {
    id: 'pinball-galaxy',
    title: 'Pinball Galaxy',
    category: 'Arcade',
    description: 'Launch the ball into a neon galaxy, hit glowing bumpers, and chase a high score!',
    instructions: 'Tap LAUNCH to start. Hold the left or right side near the bottom to activate the flippers. Keep the ball in play and hit the bumpers.',
    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,
    lastTime: 0,

    ball: { x: 200, y: 465, vx: 0, vy: 0, r: 8 },
    bumpers: [
        { x: 105, y: 170, r: 25, points: 100 },
        { x: 200, y: 125, r: 29, points: 150 },
        { x: 295, y: 170, r: 25, points: 100 },
        { x: 145, y: 270, r: 20, points: 75 },
        { x: 255, y: 270, r: 20, points: 75 }
    ],
    leftHeld: false,
    rightHeld: false,
    leftFlipper: 0,
    rightFlipper: 0,
    score: 0,
    lives: 3,
    launched: false,
    launchPower: 0,
    launchHeld: false,
    particles: [],
    stars: [],
    boundDown: null,
    boundMove: null,
    boundUp: null,
    buttons: [],

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
    this.score = 0;
    this.lives = 3;
    this.launched = false;
    this.launchPower = 0;
    this.launchHeld = false;
    this.leftHeld = false;
    this.rightHeld = false;
    this.leftFlipper = 0;
    this.rightFlipper = 0;
    this.particles = [];

    // Generate a fresh random bumper layout
    const positions = [
        { x: 85, y: 145 },
        { x: 200, y: 120 },
        { x: 315, y: 145 },
        { x: 115, y: 255 },
        { x: 285, y: 255 },
        { x: 155, y: 195 },
        { x: 245, y: 195 },
        { x: 200, y: 300 },
        { x: 95, y: 320 },
        { x: 305, y: 320 }
    ];

    // Shuffle possible bumper positions
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    const colors = ['#39f5c5', '#a78bfa', '#ff5f9e', '#55aaff', '#ffd166'];

    this.bumpers = positions.slice(0, 5).map((pos, i) => ({
        x: pos.x,
        y: pos.y,
        r: 19 + Math.floor(Math.random() * 12),
        points: [75, 100, 125, 150, 200][Math.floor(Math.random() * 5)],
        color: colors[i]
    }));

    this.stars = Array.from({ length: 45 }, () => ({
        x: Math.random() * 400,
        y: Math.random() * 540,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.6 + 0.2
    }));

    this.finished = false;
    this.isPaused = false;
    this.isRunning = false;
    this.lastTime = 0;

    this.resetBall();
    this.updateScore();
    this.draw();
},


    resetBall() {
        this.ball = { x: 350, y: 465, vx: 0, vy: 0, r: 8 };
        this.launched = false;
        this.launchPower = 0;
        this.launchHeld = false;
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

        if (this.launched && !this.finished) this.update(dt);
        this.updateFlippers(dt);
        this.updateParticles(dt);
        this.draw();

        this.animationId = requestAnimationFrame(t => this.loop(t));
    },

    pointerDown(e) {
        if (this.finished || this.isPaused || !this.isRunning) return;
        const p = this.getPointer(e);

        if (!this.launched && p.x > 300 && p.y > 400) {
            this.launchHeld = true;
            this.launchPower = 0;
            this.canvas.setPointerCapture?.(e.pointerId);
            return;
        }

        if (p.y > 390) {
            if (p.x < 200) this.leftHeld = true;
            else this.rightHeld = true;
            this.canvas.setPointerCapture?.(e.pointerId);
        }

        if (!this.launched && p.y > 450) {
            this.launch();
        }
    },

    pointerMove(e) {
        if (this.launchHeld) {
            this.launchPower = Math.min(100, this.launchPower + 1.5);
        }
    },

    pointerUp() {
        if (this.launchHeld) {
            this.launchHeld = false;
            this.launch();
        }
        this.leftHeld = false;
        this.rightHeld = false;
    },

    getPointer(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (400 / rect.width),
            y: (e.clientY - rect.top) * (540 / rect.height)
        };
    },

    launch() {
        if (this.launched || this.finished) return;
        this.launched = true;
        this.ball.x = 350;
        this.ball.y = 465;
        this.ball.vx = -2.5;
        this.ball.vy = -(8 + this.launchPower * 0.07);
        this.launchPower = 0;
    },

    update(dt) {
        const b = this.ball;
        b.vy += 0.16 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Side walls
        if (b.x < 28 + b.r) {
            b.x = 28 + b.r;
            b.vx = Math.abs(b.vx) * 0.85;
        }
        if (b.x > 372 - b.r) {
            b.x = 372 - b.r;
            b.vx = -Math.abs(b.vx) * 0.85;
        }
        if (b.y < 75 + b.r) {
            b.y = 75 + b.r;
            b.vy = Math.abs(b.vy) * 0.8;
        }

        // Bumper collisions
        this.bumpers.forEach(bumper => {
            const dx = b.x - bumper.x;
            const dy = b.y - bumper.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b.r + bumper.r;

            if (dist < minDist && dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                b.x = bumper.x + nx * minDist;
                b.y = bumper.y + ny * minDist;

                const dot = b.vx * nx + b.vy * ny;
                if (dot < 0) {
                    b.vx -= 2 * dot * nx;
                    b.vy -= 2 * dot * ny;
                }

                b.vx += nx * 2.5;
                b.vy += ny * 2.5;
                this.score += bumper.points;
                this.updateScore();
                this.addParticles(bumper.x, bumper.y, '#39f5c5');
            }
        });

        // Flipper zones
        if (b.y > 420 && b.y < 500) {
            if (b.x < 190 && this.leftHeld && b.vy > 0) {
                b.vy = -Math.max(7, Math.abs(b.vy) + 4);
                b.vx += 2.5;
                this.score += 25;
                this.updateScore();
            } else if (b.x > 210 && this.rightHeld && b.vy > 0) {
                b.vy = -Math.max(7, Math.abs(b.vy) + 4);
                b.vx -= 2.5;
                this.score += 25;
                this.updateScore();
            }
        }

        // Drain
        if (b.y > 535) {
            this.lives--;
            if (this.callbacks.onLives) this.callbacks.onLives(this.lives);

            if (this.lives <= 0) {
                this.finished = true;
                this.isRunning = false;
                if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
            } else {
                this.resetBall();
            }
        }

        // Limit extreme speed
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > 13) {
            b.vx = b.vx / speed * 13;
            b.vy = b.vy / speed * 13;
        }

        b.vx *= Math.pow(0.998, dt);
        b.vy *= Math.pow(0.998, dt);
    },

    updateFlippers(dt) {
        this.leftFlipper += ((this.leftHeld ? 1 : 0) - this.leftFlipper) * Math.min(1, 0.35 * dt);
        this.rightFlipper += ((this.rightHeld ? 1 : 0) - this.rightFlipper) * Math.min(1, 0.35 * dt);
    },

    addParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 30,
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
        if (this.callbacks.onLives) this.callbacks.onLives(this.lives);
    },

    drawFlipper(ctx, x1, y1, x2, y2, active, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = active ? 18 : 7;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2 - active * 18);
        ctx.stroke();
        ctx.restore();
    },

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 400, 540);

        ctx.fillStyle = '#08091c';
        ctx.fillRect(0, 0, 400, 540);

        this.stars.forEach(s => {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = '#a9d7ff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#39f5c5';
        ctx.textAlign = 'center';
        ctx.font = 'bold 23px Arial';
        ctx.fillText('PINBALL GALAXY', 200, 34);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#b6c7df';
        ctx.fillText(`SCORE: ${this.score}`, 105, 58);
        ctx.fillText(`LIVES: ${this.lives}`, 295, 58);

        // Playfield
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#39f5c5';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(25, 70, 350, 450, 25);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Bumpers
        this.bumpers.forEach((bumper, i) => {
            const colors = ['#39f5c5', '#a78bfa', '#ff5f9e', '#55aaff', '#ffd166'];
            ctx.fillStyle = '#172b48';
            ctx.beginPath();
            ctx.arc(bumper.x, bumper.y, bumper.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 4;
            ctx.shadowColor = colors[i];
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(bumper.points, bumper.x, bumper.y + 4);
        });

        // Side guide rails
        ctx.strokeStyle = '#52769d';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(45, 350);
        ctx.lineTo(75, 420);
        ctx.moveTo(355, 350);
        ctx.lineTo(325, 420);
        ctx.stroke();

        // Flippers
        this.drawFlipper(ctx, 105, 460, 180, 475, this.leftFlipper, '#39f5c5');
        this.drawFlipper(ctx, 295, 460, 220, 475, this.rightFlipper, '#ff5f9e');

        // Ball
        ctx.fillStyle = '#f4f8ff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        if (!this.launched && !this.finished) {
            ctx.fillStyle = '#ffd166';
            ctx.font = 'bold 15px Arial';
            ctx.fillText('TAP TO LAUNCH', 200, 405);
            if (this.launchHeld) {
                ctx.fillStyle = '#39f5c5';
                ctx.fillText(`POWER ${Math.round(this.launchPower)}%`, 200, 430);
            }
        }

        if (this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.88)';
            ctx.fillRect(0, 0, 400, 540);
            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 30px Arial';
            ctx.fillText('GAME OVER', 200, 240);
            ctx.fillStyle = '#ffffff';
            ctx.font = '17px Arial';
            ctx.fillText(`Final score: ${this.score}`, 200, 280);
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
