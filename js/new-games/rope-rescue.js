
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['rope-rescue'] = {
    id: 'rope-rescue',
    title: 'Rope Rescue',
    category: 'Puzzle',
    description: 'Cut ropes strategically to guide the trapped character safely to the rescue platform.',
    instructions: 'Tap or swipe across ropes to cut them. Use gravity and swinging movement to guide the character to the glowing rescue zone. Complete all 5 levels.',

    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,
    lastTime: 0,

    levels: [
        {
            player: [110, 175],
            ropes: [{x1:110,y1:175,x2:110,y2:285}],
            target: {x:300,y:420,r:48},
            platforms: [{x:30,y:475,w:340,h:18}]
        },
        {
            player: [200, 155],
            ropes: [
                {x1:200,y1:155,x2:115,y2:290},
                {x1:200,y1:155,x2:285,y2:290}
            ],
            target: {x:200,y:425,r:48},
            platforms: [{x:35,y:480,w:330,h:18}]
        },
        {
            player: [90, 160],
            ropes: [
                {x1:90,y1:160,x2:90,y2:300},
                {x1:90,y1:160,x2:220,y2:240}
            ],
            target: {x:315,y:425,r:45},
            platforms: [{x:25,y:480,w:350,h:18}]
        },
        {
            player: [310, 160],
            ropes: [
                {x1:310,y1:160,x2:310,y2:290},
                {x1:310,y1:160,x2:180,y2:245}
            ],
            target: {x:85,y:425,r:45},
            platforms: [{x:25,y:480,w:350,h:18}]
        },
        {
            player: [200, 145],
            ropes: [
                {x1:200,y1:145,x2:105,y2:280},
                {x1:200,y1:145,x2:295,y2:280},
                {x1:200,y1:145,x2:200,y2:310}
            ],
            target: {x:200,y:430,r:48},
            platforms: [{x:35,y:485,w:330,h:18}]
        }
    ],

    levelIndex: 0,
    player: { x:110, y:175, vx:0, vy:0, r:13 },
    ropes: [],
    target: { x:300, y:420, r:48 },
    platforms: [],

    cuts: 0,
    totalCuts: 0,
    levelComplete: false,
    failed: false,
    particles: [],
    actionButton: null,

    swipeStart: null,
    swipeLast: null,
    swipeMoved: false,

    boundPointer: null,
    boundMove: null,
    boundUp: null,

    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        canvas.width = 400;
        canvas.height = 540;
        canvas.style.touchAction = 'none';

        this.boundPointer = e => this.pointerDown(e);
        this.boundMove = e => this.pointerMove(e);
        this.boundUp = e => this.pointerUp(e);

        canvas.addEventListener('pointerdown', this.boundPointer);
        canvas.addEventListener('pointermove', this.boundMove);
        canvas.addEventListener('pointerup', this.boundUp);
        canvas.addEventListener('pointercancel', this.boundUp);

        this.reset();
    },

    reset() {
        // Randomize level order for every new game
        this.levels = [...this.levels];

        for (let i = this.levels.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.levels[i], this.levels[j]] =
                [this.levels[j], this.levels[i]];
        }

        this.levelIndex = 0;
        this.cuts = 0;
        this.totalCuts = 0;

        this.levelComplete = false;
        this.failed = false;
        this.finished = false;

        this.isPaused = false;
        this.isRunning = false;
        this.lastTime = 0;

        this.particles = [];
        this.actionButton = null;

        this.clearSwipe();
        this.loadLevel();
        this.updateScore();
        this.draw();
    },

    loadLevel() {
        const level = this.levels[this.levelIndex];

        this.player = {
            x: level.player[0],
            y: level.player[1],
            vx: 0,
            vy: 0,
            r: 13
        };

        this.ropes = level.ropes.map(r => ({
            ...r,
            active: true
        }));

        this.target = { ...level.target };
        this.platforms = level.platforms.map(p => ({ ...p }));

        this.cuts = 0;
        this.levelComplete = false;
        this.failed = false;
        this.particles = [];
        this.actionButton = null;

        this.clearSwipe();
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
            ? Math.min((timestamp - this.lastTime) / 16.67, 2)
            : 1;

        this.lastTime = timestamp;

        if (!this.finished && !this.levelComplete && !this.failed) {
            this.update(dt);
        }

        this.updateParticles(dt);
        this.draw();

        this.animationId = requestAnimationFrame(
            t => this.loop(t)
        );
    },

    getPointer(e) {
        const rect = this.canvas.getBoundingClientRect();

        return {
            x: (e.clientX - rect.left) * (400 / rect.width),
            y: (e.clientY - rect.top) * (540 / rect.height)
        };
    },

    clearSwipe() {
        this.swipeStart = null;
        this.swipeLast = null;
        this.swipeMoved = false;
    },

    pointerDown(e) {
        if (this.isPaused || this.finished) return;

        const p = this.getPointer(e);

        // Handle NEXT LEVEL and RETRY LEVEL buttons
        if (this.actionButton) {
            const b = this.actionButton;

            if (
                p.x >= b.x && p.x <= b.x + b.w &&
                p.y >= b.y && p.y <= b.y + b.h
            ) {
                const action = b.action;
                this.actionButton = null;
                action();
                return;
            }
        }

        if (!this.isRunning || this.levelComplete || this.failed) return;

        this.swipeStart = p;
        this.swipeLast = p;
        this.swipeMoved = false;

        this.canvas.setPointerCapture?.(e.pointerId);
    },

    pointerMove(e) {
        if (!this.swipeStart || !this.isRunning) return;
        if (this.isPaused || this.levelComplete || this.failed) return;

        const p = this.getPointer(e);

        const distance = Math.hypot(
            p.x - this.swipeLast.x,
            p.y - this.swipeLast.y
        );

        if (distance > 2) {
            this.swipeMoved = true;

            // Check every swipe segment for rope collision
            this.cutRopesAlongSwipe(
                this.swipeLast.x,
                this.swipeLast.y,
                p.x,
                p.y
            );
        }

        this.swipeLast = p;
    },

    pointerUp(e) {
        if (!this.swipeStart) return;

        // If the player only tapped, detect a rope at that point
        if (!this.swipeMoved && this.isRunning) {
            const p = this.getPointer(e);

            this.cutRopesAlongSwipe(
                p.x, p.y,
                p.x, p.y
            );
        }

        this.clearSwipe();
    },

    cutRopesAlongSwipe(ax, ay, bx, by) {
        if (this.levelComplete || this.failed || this.finished) return;

        let nearest = -1;
        let nearestDistance = 20;

        this.ropes.forEach((rope, i) => {
            if (!rope.active) return;

            const distance = this.distanceBetweenSegments(
                ax, ay,
                bx, by,
                rope.x1, rope.y1,
                rope.x2, rope.y2
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = i;
            }
        });

        if (nearest < 0) return;

        const rope = this.ropes[nearest];

        rope.active = false;

        this.cuts++;
        this.totalCuts++;

        // Release character with cutting momentum
        this.player.vx += (Math.random() - 0.5) * 3;
        this.player.vy -= 2.5;

        this.addParticles(
            this.player.x,
            this.player.y,
            '#ffd166'
        );

        this.addParticles(
            rope.x2,
            rope.y2,
            '#39f5c5'
        );

        this.updateScore();
    },

    distanceToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        const lengthSq = dx * dx + dy * dy;

        if (!lengthSq) {
            return Math.hypot(px - x1, py - y1);
        }

        const t = Math.max(
            0,
            Math.min(
                1,
                ((px - x1) * dx + (py - y1) * dy) / lengthSq
            )
        );

        return Math.hypot(
            px - (x1 + t * dx),
            py - (y1 + t * dy)
        );
    },

    distanceBetweenSegments(ax, ay, bx, by, cx, cy, dx, dy) {
        const cross = (x1, y1, x2, y2, x3, y3) =>
            (x2 - x1) * (y3 - y1) -
            (y2 - y1) * (x3 - x1);

        const d1 = cross(ax, ay, bx, by, cx, cy);
        const d2 = cross(ax, ay, bx, by, dx, dy);
        const d3 = cross(cx, cy, dx, dy, ax, ay);
        const d4 = cross(cx, cy, dx, dy, bx, by);

        // Segments intersect
        if (d1 * d2 <= 0 && d3 * d4 <= 0) {
            const minX1 = Math.min(ax, bx);
            const maxX1 = Math.max(ax, bx);
            const minY1 = Math.min(ay, by);
            const maxY1 = Math.max(ay, by);

            const minX2 = Math.min(cx, dx);
            const maxX2 = Math.max(cx, dx);
            const minY2 = Math.min(cy, dy);
            const maxY2 = Math.max(cy, dy);

            if (
                maxX1 >= minX2 && maxX2 >= minX1 &&
                maxY1 >= minY2 && maxY2 >= minY1
            ) {
                return 0;
            }
        }

        return Math.min(
            this.distanceToSegment(ax, ay, cx, cy, dx, dy),
            this.distanceToSegment(bx, by, cx, cy, dx, dy),
            this.distanceToSegment(cx, cy, ax, ay, bx, by),
            this.distanceToSegment(dx, dy, ax, ay, bx, by)
        );
    },

    update(dt) {
        const p = this.player;

        // Gravity
        p.vy += 0.22 * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vx *= Math.pow(0.997, dt);
        p.vy *= Math.pow(0.997, dt);

        // Rope swing physics
        const activeRope = this.ropes.find(r => r.active);

        if (activeRope) {
            const anchorX = activeRope.x2;
            const anchorY = activeRope.y2;

            const dx = p.x - anchorX;
            const dy = p.y - anchorY;

            const distance = Math.hypot(dx, dy);

            const ropeLength = Math.hypot(
                activeRope.x1 - activeRope.x2,
                activeRope.y1 - activeRope.y2
            );

            if (distance > ropeLength && distance > 0) {
                const nx = dx / distance;
                const ny = dy / distance;

                p.x = anchorX + nx * ropeLength;
                p.y = anchorY + ny * ropeLength;

                const outward = p.vx * nx + p.vy * ny;

                if (outward > 0) {
                    p.vx -= outward * nx;
                    p.vy -= outward * ny;
                }
            }
        }

        // Side boundaries
        if (p.x < 18) {
            p.x = 18;
            p.vx = Math.abs(p.vx) * 0.6;
        }

        if (p.x > 382) {
            p.x = 382;
            p.vx = -Math.abs(p.vx) * 0.6;
        }

        // Platform collision
        this.platforms.forEach(platform => {
            if (
                p.vy > 0 &&
                p.y + p.r >= platform.y &&
                p.y - p.r < platform.y &&
                p.x > platform.x &&
                p.x < platform.x + platform.w
            ) {
                p.y = platform.y - p.r;
                p.vy = 0;
                p.vx *= 0.75;
            }
        });

        // Rescue detection
        const distance = Math.hypot(
            p.x - this.target.x,
            p.y - this.target.y
        );

        if (distance < this.target.r - p.r / 2) {
            this.completeLevel();
            return;
        }

        // Fall detection
        if (p.y > 530) {
            this.failed = true;
            this.isRunning = false;
            this.clearSwipe();
        }
    },

    completeLevel() {
        this.levelComplete = true;
        this.clearSwipe();
        this.updateScore();

        if (this.levelIndex >= this.levels.length - 1) {
            this.finished = true;
            this.isRunning = false;

            if (this.callbacks.onGameOver) {
                this.callbacks.onGameOver(this.score);
            }
        }
    },

    nextLevel() {
        if (!this.levelComplete || this.finished) return;

        this.levelIndex++;
        this.loadLevel();
        this.draw();
    },

    retryLevel() {
        if (!this.failed) return;

        this.loadLevel();

        this.failed = false;
        this.isRunning = true;
        this.lastTime = 0;

        this.loop();
    },

    get score() {
        return Math.max(
            0,
            1000 - this.totalCuts * 50 + this.levelIndex * 100
        );
    },

    updateScore() {
        if (this.callbacks.onScore) {
            this.callbacks.onScore(this.score);
        }
    },

    addParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 30,
                color,
                size: Math.random() * 3 + 2
            });
        }
    },

    updateParticles(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            p.vy += 0.08 * dt;
            p.life -= dt;

            return p.life > 0;
        });
    },

    draw() {
        if (!this.ctx) return;

        const ctx = this.ctx;

        ctx.clearRect(0, 0, 400, 540);

        // Background
        ctx.fillStyle = '#080e1b';
        ctx.fillRect(0, 0, 400, 540);

        // Background stars
        for (let i = 0; i < 35; i++) {
            ctx.fillStyle = 'rgba(120,170,220,0.25)';
            ctx.beginPath();
            ctx.arc(
                (i * 71) % 400,
                (i * 113) % 540,
                1.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Header
        ctx.fillStyle = '#39f5c5';
        ctx.textAlign = 'center';
        ctx.font = 'bold 23px Arial';
        ctx.fillText('ROPE RESCUE', 200, 34);

        ctx.fillStyle = '#aab8cc';
        ctx.font = '12px Arial';

        ctx.fillText(
            `LEVEL ${this.levelIndex + 1} / ${this.levels.length}`,
            105,
            59
        );

        ctx.fillText(`CUTS: ${this.cuts}`, 295, 59);

        // Target zone
        ctx.fillStyle = 'rgba(57,245,197,0.12)';
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(
            this.target.x,
            this.target.y,
            this.target.r,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#39f5c5';
        ctx.font = 'bold 11px Arial';

        ctx.fillText(
            'RESCUE',
            this.target.x,
            this.target.y + 4
        );

        // Platforms
        this.platforms.forEach(p => {
            ctx.fillStyle = '#526b83';

            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 6);
            ctx.fill();

            ctx.strokeStyle = '#8da8c2';
            ctx.stroke();
        });

        // Animated ropes
        this.ropes.forEach(r => {
            if (!r.active) return;

            ctx.save();

            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';

            ctx.shadowColor = '#ffd166';
            ctx.shadowBlur = 9;

            ctx.beginPath();
            ctx.moveTo(this.player.x, this.player.y);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Rope anchor
            ctx.fillStyle = '#fff0b3';

            ctx.beginPath();
            ctx.arc(r.x2, r.y2, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Character
        ctx.save();

        ctx.fillStyle = '#55aaff';
        ctx.shadowColor = '#55aaff';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(
            this.player.x,
            this.player.y,
            this.player.r,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#d8efff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Character eyes
        ctx.fillStyle = '#ffffff';

        ctx.beginPath();
        ctx.arc(
            this.player.x - 4,
            this.player.y - 3,
            2,
            0,
            Math.PI * 2
        );

        ctx.arc(
            this.player.x + 4,
            this.player.y - 3,
            2,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        // Instructions
        ctx.fillStyle = '#aab8cc';
        ctx.font = '12px Arial';

        ctx.fillText(
            'SWIPE ACROSS A ROPE TO CUT IT',
            200,
            520
        );

        // Level complete overlay
        if (this.levelComplete && !this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.88)';
            ctx.fillRect(0, 0, 400, 540);

            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 27px Arial';
            ctx.fillText('RESCUED!', 200, 230);

            ctx.fillStyle = '#ffffff';
            ctx.font = '15px Arial';
            ctx.fillText(
                'Great work! Move to the next level.',
                200,
                265
            );

            this.drawActionButton(
                ctx,
                'NEXT LEVEL',
                125,
                300,
                150,
                45,
                () => this.nextLevel()
            );
        }

        // Failed overlay
        if (this.failed) {
            ctx.fillStyle = 'rgba(3,8,18,0.88)';
            ctx.fillRect(0, 0, 400, 540);

            ctx.fillStyle = '#ff6680';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('TRY AGAIN!', 200, 235);

            ctx.fillStyle = '#ffffff';
            ctx.font = '15px Arial';
            ctx.fillText(
                'The character fell. Retry this level.',
                200,
                270
            );

            this.drawActionButton(
                ctx,
                'RETRY LEVEL',
                125,
                300,
                150,
                45,
                () => this.retryLevel()
            );
        }

        // Game finished
        if (this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.88)';
            ctx.fillRect(0, 0, 400, 540);

            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('ALL RESCUED!', 200, 235);

            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText(
                `Final score: ${this.score}`,
                200,
                275
            );
        }
    },

    drawActionButton(ctx, label, x, y, w, h, action) {
        ctx.fillStyle = '#173c4a';
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';

        ctx.fillText(
            label,
            x + w / 2,
            y + h / 2 + 4
        );

        this.actionButton = { x, y, w, h, action };
    },

    pause() {
        this.isPaused = true;
        this.clearSwipe();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
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
                'pointerdown',
                this.boundPointer
            );

            this.canvas.removeEventListener(
                'pointermove',
                this.boundMove
            );

            this.canvas.removeEventListener(
                'pointerup',
                this.boundUp
            );

            this.canvas.removeEventListener(
                'pointercancel',
                this.boundUp
            );
        }

        this.boundPointer = null;
        this.boundMove = null;
        this.boundUp = null;

        this.animationId = null;
        this.clearSwipe();
        this.actionButton = null;
    }
};
