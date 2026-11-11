window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['precision-archery'] = {
    id: 'precision-archery',
    title: 'Precision Archery',
    category: 'Skill',
    description: 'Aim carefully, track moving targets, and test your archery precision!',
    instructions: 'Aim by moving or dragging your pointer. Tap or click to shoot. Use arrow keys to aim and Space to shoot.',
    
    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,

    score: 0,
    arrows: 10,
    round: 1,
    maxRounds: 10,

    aimX: 330,
    aimY: 250,

    target: null,
    projectiles: [],
    particles: [],

    wind: 0,
    windTimer: 0,
    lastTime: 0,
    shotsTaken: 0,

    boundPointerMove: null,
    boundPointerDown: null,
    boundKeyDown: null,

    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        canvas.width = 400;
        canvas.height = 540;
        canvas.style.touchAction = 'none';

        this.boundPointerMove = e => this.handlePointerMove(e);
        this.boundPointerDown = e => this.handlePointerDown(e);
        this.boundKeyDown = e => this.handleKeyDown(e);

        canvas.addEventListener('pointermove', this.boundPointerMove);
        canvas.addEventListener('pointerdown', this.boundPointerDown);
        window.addEventListener('keydown', this.boundKeyDown);

        this.reset();
    },

    reset() {
        this.score = 0;
        this.arrows = 10;
        this.round = 1;
        this.shotsTaken = 0;

        this.aimX = 330;
        this.aimY = 250;

        this.projectiles = [];
        this.particles = [];

        this.wind = 0;
        this.windTimer = 0;

        this.finished = false;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;

        this.createTarget();
        this.updateScore();
        this.draw();
    },

    createTarget() {
        const minY = 155;
        const maxY = 355;

        this.target = {
            x: 315 + Math.random() * 35,
            y: minY + Math.random() * (maxY - minY),
            radius: 45,
            direction: Math.random() > 0.5 ? 1 : -1,
            speed: 12 + this.round * 3 + Math.random() * 8,
            minY,
            maxY,
            moving: this.round >= 2,
            phase: Math.random() * Math.PI * 2
        };
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

        const dt = this.lastTime
            ? Math.min((timestamp - this.lastTime) / 1000, 0.05)
            : 0;

        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        if (this.isRunning && !this.isPaused) {
            this.animationId = requestAnimationFrame(t => this.loop(t));
        }
    },

    update(dt) {
        if (this.target && this.target.moving) {
            this.target.phase += dt * 1.5;

            this.target.y +=
                this.target.direction * this.target.speed * dt;

            if (this.target.y >= this.target.maxY) {
                this.target.y = this.target.maxY;
                this.target.direction = -1;
            }

            if (this.target.y <= this.target.minY) {
                this.target.y = this.target.minY;
                this.target.direction = 1;
            }
        }

        this.windTimer += dt;

        if (this.windTimer >= 3.5) {
            this.windTimer = 0;
            this.wind = (Math.random() - 0.5) * 1.2;
        }

        this.projectiles = this.projectiles.filter(arrow => {
            if (arrow.resolved) return false;

            const previousX = arrow.x;
            const previousY = arrow.y;

            arrow.x += arrow.vx * dt;
            arrow.y += arrow.vy * dt;

            arrow.vy += 310 * dt;
            arrow.vx += this.wind * 22 * dt;

            arrow.rotation = Math.atan2(arrow.vy, arrow.vx);

            // Check when arrow crosses the target's vertical position.
            if (arrow.x >= this.target.x) {
                const travel = arrow.x - previousX;
                const progress = travel > 0
                    ? Math.max(0, Math.min(1, (this.target.x - previousX) / travel))
                    : 1;

                const hitY = previousY + (arrow.y - previousY) * progress;
                const distance = Math.abs(hitY - this.target.y);

                this.resolveShot(distance, this.target.x, hitY);
                arrow.resolved = true;
                return false;
            }

            return arrow.x < 450 && arrow.y < 580 && arrow.y > -80;
        });

        this.updateParticles(dt);
    },

    handlePointerMove(e) {
        if (!this.isRunning || this.isPaused || this.finished) return;

        const rect = this.canvas.getBoundingClientRect();

        this.aimX = (e.clientX - rect.left) * (400 / rect.width);
        this.aimY = (e.clientY - rect.top) * (540 / rect.height);

        this.clampAim();
    },

    handlePointerDown(e) {
        if (!this.isRunning || this.isPaused || this.finished) return;

        const rect = this.canvas.getBoundingClientRect();

        this.aimX = (e.clientX - rect.left) * (400 / rect.width);
        this.aimY = (e.clientY - rect.top) * (540 / rect.height);

        this.clampAim();
        this.shoot();
    },

    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused || this.finished) return;

        const step = 10;
        let handled = true;

        switch (e.key) {
            case 'ArrowLeft':
                this.aimX -= step;
                break;

            case 'ArrowRight':
                this.aimX += step;
                break;

            case 'ArrowUp':
                this.aimY -= step;
                break;

            case 'ArrowDown':
                this.aimY += step;
                break;

            case ' ':
                this.shoot();
                break;

            default:
                handled = false;
        }

        if (handled) {
            e.preventDefault();
            this.clampAim();
        }
    },

    clampAim() {
        this.aimX = Math.max(145, Math.min(395, this.aimX));
        this.aimY = Math.max(75, Math.min(420, this.aimY));
    },

    shoot() {
        if (
            this.arrows <= 0 ||
            this.finished ||
            this.projectiles.length > 0
        ) return;

        const startX = 88;
        const startY = 414;

        const dx = this.aimX - startX;
        const dy = this.aimY - startY;

        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 480;

        this.projectiles.push({
            x: startX,
            y: startY,
            vx: (dx / length) * speed,
            vy: (dy / length) * speed,
            rotation: Math.atan2(dy, dx),
            resolved: false
        });

        this.arrows--;
        this.shotsTaken++;

        this.addParticles(startX, startY, '#39f5c5', 5);
        this.updateScore();
    },

    resolveShot(distance, x, y) {
        let points = 0;
        let message = 'MISS!';

        if (distance <= 8) {
            points = 100;
            message = 'BULLSEYE!';
        } else if (distance <= 17) {
            points = 75;
            message = 'EXCELLENT!';
        } else if (distance <= 28) {
            points = 50;
            message = 'GREAT SHOT!';
        } else if (distance <= 45) {
            points = 25;
            message = 'GOOD SHOT!';
        }

        if (points > 0) {
            this.score += points;
            this.addParticles(x, y, '#39f5c5', 22);
            this.addParticles(x, y, '#ffd45e', 10);
        } else {
            this.addParticles(x, y, '#ff647c', 9);
        }

        this.lastMessage = message;
        this.messageTimer = 1.2;

        this.updateScore();

        if (this.arrows <= 0) {
            this.finishGame();
            return;
        }

        this.round = Math.min(this.shotsTaken + 1, this.maxRounds);
        this.createTarget();
    },

    addParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 35 + Math.random() * 170;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.35 + Math.random() * 0.4,
                maxLife: 0.75,
                size: 2 + Math.random() * 3,
                color
            });
        }
    },

    updateParticles(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= dt;

            return p.life > 0;
        });

        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
        }
    },

    updateScore() {
        if (this.callbacks.onScore) {
            this.callbacks.onScore(this.score);
        }

        if (this.callbacks.onLives) {
            this.callbacks.onLives(this.arrows);
        }
    },

    finishGame() {
        if (this.finished) return;

        this.finished = true;
        this.isRunning = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.updateScore();

        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(this.score);
        }

        this.draw();
    },

    // --------------------------------------------------
    // DRAWING
    // --------------------------------------------------

    draw() {
        if (!this.ctx || !this.target) return;

        const ctx = this.ctx;

        ctx.clearRect(0, 0, 400, 540);

        // Background
        const bg = ctx.createLinearGradient(0, 0, 400, 540);
        bg.addColorStop(0, '#101d38');
        bg.addColorStop(0.55, '#0c1428');
        bg.addColorStop(1, '#080b19');

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 400, 540);

        this.drawBackground(ctx);
        this.drawHUD(ctx);
        this.drawTarget(ctx);
        this.drawWind(ctx);
        this.drawArcher(ctx);
        this.drawAimGuide(ctx);
        this.drawProjectiles(ctx);
        this.drawParticles(ctx);
        this.drawInstructions(ctx);

        if (this.finished) {
            this.drawGameOver(ctx);
        }
    },

    drawBackground(ctx) {
        // Distant mountains
        ctx.fillStyle = '#14223a';
        ctx.beginPath();
        ctx.moveTo(0, 285);
        ctx.lineTo(65, 190);
        ctx.lineTo(125, 285);
        ctx.lineTo(190, 205);
        ctx.lineTo(255, 285);
        ctx.lineTo(330, 190);
        ctx.lineTo(400, 285);
        ctx.lineTo(400, 485);
        ctx.lineTo(0, 485);
        ctx.closePath();
        ctx.fill();

        // Ground
        const ground = ctx.createLinearGradient(0, 450, 0, 540);
        ground.addColorStop(0, '#20354a');
        ground.addColorStop(1, '#101c2c');

        ctx.fillStyle = ground;
        ctx.fillRect(0, 460, 400, 80);

        ctx.strokeStyle = 'rgba(57,245,197,0.12)';
        ctx.lineWidth = 1;

        for (let x = 0; x < 400; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 460);
            ctx.lineTo(x - 25, 540);
            ctx.stroke();
        }

        // Horizon
        ctx.strokeStyle = 'rgba(57,245,197,0.25)';
        ctx.beginPath();
        ctx.moveTo(0, 460);
        ctx.lineTo(400, 460);
        ctx.stroke();
    },

    drawHUD(ctx) {
        ctx.fillStyle = '#39f5c5';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PRECISION ARCHERY', 200, 32);

        ctx.fillStyle = '#d1def2';
        ctx.font = '12px Arial';

        ctx.fillText(`SCORE ${this.score}`, 72, 60);
        ctx.fillText(`ROUND ${this.round}/${this.maxRounds}`, 200, 60);
        ctx.fillText(`ARROWS ${this.arrows}`, 330, 60);

        // HUD separator
        ctx.strokeStyle = 'rgba(57,245,197,0.22)';
        ctx.beginPath();
        ctx.moveTo(20, 75);
        ctx.lineTo(380, 75);
        ctx.stroke();
    },

    drawTarget(ctx) {
        const t = this.target;

        // Target stand
        ctx.strokeStyle = '#849bb4';
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(t.x, t.y + 42);
        ctx.lineTo(t.x, 462);
        ctx.stroke();

        // Stand support
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(t.x - 23, 462);
        ctx.lineTo(t.x + 23, 462);
        ctx.stroke();

        // Target shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(t.x + 7, t.y + 5, 48, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        const rings = [
            { r: 45, color: '#f1f4f8' },
            { r: 36, color: '#f04e68' },
            { r: 27, color: '#f1f4f8' },
            { r: 18, color: '#398eea' },
            { r: 9, color: '#ffd45e' }
        ];

        rings.forEach(ring => {
            ctx.fillStyle = ring.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, ring.r, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(t.x, t.y, 45, 0, Math.PI * 2);
        ctx.stroke();
    },

    drawWind(ctx) {
        ctx.textAlign = 'center';
        ctx.font = '12px Arial';
        ctx.fillStyle = '#b9c9df';

        const arrow = this.wind >= 0 ? '→' : '←';

        ctx.fillText(
            `WIND ${arrow} ${Math.abs(this.wind).toFixed(1)}`,
            315,
            100
        );
    },

    drawArcher(ctx) {
        ctx.save();

        // Archer shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(85, 466, 36, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(79, 400);
        ctx.lineTo(69, 455);
        ctx.lineTo(55, 462);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(91, 400);
        ctx.lineTo(101, 455);
        ctx.lineTo(113, 462);
        ctx.stroke();

        // Body
        ctx.fillStyle = '#176b68';
        ctx.beginPath();
        ctx.moveTo(68, 330);
        ctx.lineTo(101, 330);
        ctx.lineTo(103, 405);
        ctx.lineTo(68, 405);
        ctx.closePath();
        ctx.fill();

        // Chest armor
        ctx.fillStyle = '#39f5c5';
        ctx.beginPath();
        ctx.moveTo(76, 338);
        ctx.lineTo(94, 338);
        ctx.lineTo(97, 388);
        ctx.lineTo(73, 388);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#e7b88e';
        ctx.beginPath();
        ctx.arc(84, 310, 15, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#17263a';
        ctx.beginPath();
        ctx.arc(84, 305, 15, Math.PI, Math.PI * 2);
        ctx.fill();

        // Face direction
        ctx.fillStyle = '#25384b';
        ctx.beginPath();
        ctx.arc(96, 311, 2, 0, Math.PI * 2);
        ctx.fill();

        // Back arm
        ctx.strokeStyle = '#e7b88e';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(76, 345);
        ctx.lineTo(55, 370);
        ctx.stroke();

        // Bow-holding arm
        ctx.beginPath();
        ctx.moveTo(97, 347);
        ctx.lineTo(119, 337);
        ctx.stroke();

        // Bow
        ctx.strokeStyle = '#d8a75c';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(122, 285);
        ctx.quadraticCurveTo(155, 350, 122, 415);
        ctx.stroke();

        // Bow string
        ctx.strokeStyle = '#f1e5c8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(122, 285);
        ctx.lineTo(122, 415);
        ctx.stroke();

        // Bow grip
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(122, 342);
        ctx.lineTo(122, 359);
        ctx.stroke();

        // Quiver
        ctx.fillStyle = '#8b5e36';
        ctx.save();
        ctx.translate(63, 355);
        ctx.rotate(-0.18);
        ctx.fillRect(-5, 0, 12, 53);
        ctx.restore();

        // Arrows in quiver
        ctx.strokeStyle = '#f6d58b';
        ctx.lineWidth = 2;

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(59 + i * 4, 355);
            ctx.lineTo(53 + i * 4, 315);
            ctx.stroke();
        }

        ctx.restore();
    },

    drawAimGuide(ctx) {
        if (this.finished || this.projectiles.length > 0) return;

        const startX = 122;
        const startY = 350;

        const dx = this.aimX - startX;
        const dy = this.aimY - startY;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;

        const vx = (dx / length) * 650;
        const vy = (dy / length) * 650;

        // Predicted arrow arc
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(57,245,197,0.55)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        let px = startX;
        let py = startY;

        for (let time = 0; time <= 0.5; time += 0.035) {
            px = startX + vx * time + 0.5 * this.wind * 22 * time * time;
            py = startY + vy * time + 155 * time * time;

            if (px > 400 || py > 460 || py < 75) break;

            ctx.lineTo(px, py);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Aim crosshair
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(this.aimX, this.aimY, 9, 0, Math.PI * 2);
        ctx.moveTo(this.aimX - 14, this.aimY);
        ctx.lineTo(this.aimX + 14, this.aimY);
        ctx.moveTo(this.aimX, this.aimY - 14);
        ctx.lineTo(this.aimX, this.aimY + 14);
        ctx.stroke();

        ctx.restore();
    },

    drawProjectiles(ctx) {
        this.projectiles.forEach(arrow => {
            ctx.save();

            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.rotation);

            // Arrow shaft
            ctx.strokeStyle = '#f6d58b';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(-22, 0);
            ctx.lineTo(13, 0);
            ctx.stroke();

            // Arrow tip
            ctx.fillStyle = '#e9edf5';
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(10, -5);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.fill();

            // Feathers
            ctx.strokeStyle = '#39f5c5';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(-25, -5);
            ctx.moveTo(-20, 0);
            ctx.lineTo(-25, 5);
            ctx.stroke();

            ctx.restore();
        });
    },

    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        if (this.messageTimer > 0 && this.lastMessage) {
            ctx.textAlign = 'center';
            ctx.font = 'bold 19px Arial';
            ctx.fillStyle = '#ffd45e';
            ctx.fillText(this.lastMessage, 200, 135);
        }
    },

    drawInstructions(ctx) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#b5c6dc';
        ctx.font = '11px Arial';

        ctx.fillText(
            this.projectiles.length > 0
                ? 'ARROW IN FLIGHT...'
                : 'DRAG TO AIM  •  TAP TO SHOOT',
            200,
            515
        );
    },

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(3,8,18,0.88)';
        ctx.fillRect(0, 0, 400, 540);

        ctx.textAlign = 'center';

        ctx.fillStyle = '#39f5c5';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('CHALLENGE COMPLETE!', 200, 215);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`FINAL SCORE: ${this.score}`, 200, 265);

        ctx.fillStyle = '#ffd45e';
        ctx.font = '15px Arial';

        const rating = this.score >= 750
            ? 'MASTER ARCHER!'
            : this.score >= 500
                ? 'EXPERT ARCHER!'
                : this.score >= 250
                    ? 'GOOD EFFORT!'
                    : 'KEEP PRACTICING!';

        ctx.fillText(rating, 200, 305);

        ctx.fillStyle = '#b5c6dc';
        ctx.font = '13px Arial';
        ctx.fillText(`Arrows used: ${this.shotsTaken}/10`, 200, 340);
    },

    pause() {
        this.isPaused = true;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
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

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.canvas) {
            this.canvas.removeEventListener(
                'pointermove',
                this.boundPointerMove
            );

            this.canvas.removeEventListener(
                'pointerdown',
                this.boundPointerDown
            );
        }

        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.boundKeyDown);
        }

        this.boundPointerMove = null;
        this.boundPointerDown = null;
        this.boundKeyDown = null;
        this.animationId = null;
    }
};