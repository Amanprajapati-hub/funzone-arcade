
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['laser-bounce'] = {
    id: 'laser-bounce',
    title: 'Laser Bounce',
    category: 'Puzzle',
    description: 'Rotate mirrors, redirect laser beams, and activate every target in this neon puzzle adventure.',
    instructions: 'Tap mirrors to rotate them. Connect the laser emitter to the glowing target. Complete all 8 levels.',
    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,
    lastTime: 0,

    levels: [
        { emitter: [55, 270], target: [345, 270], mirrors: [{x:200,y:270,dir:1}], walls: [] },
        { emitter: [55, 380], target: [345, 160], mirrors: [{x:180,y:380,dir:1},{x:180,y:160,dir:1}], walls: [] },
        { emitter: [55, 170], target: [345, 380], mirrors: [{x:170,y:170,dir:1},{x:170,y:380,dir:1},{x:290,y:380,dir:1}], walls: [] },
        { emitter: [55, 270], target: [345, 270], mirrors: [{x:150,y:270,dir:1},{x:250,y:270,dir:1}], walls: [{x:200,y:180,w:20,h:180}] },
        { emitter: [55, 420], target: [345, 120], mirrors: [{x:140,y:420,dir:1},{x:140,y:120,dir:1},{x:260,y:120,dir:1},{x:260,y:420,dir:1}], walls: [] },
        { emitter: [55, 150], target: [345, 420], mirrors: [{x:150,y:150,dir:1},{x:150,y:300,dir:1},{x:270,y:300,dir:1},{x:270,y:420,dir:1}], walls: [] },
        { emitter: [55, 270], target: [345, 270], mirrors: [{x:130,y:270,dir:1},{x:200,y:160,dir:1},{x:270,y:270,dir:1}], walls: [{x:200,y:220,w:20,h:100}] },
        { emitter: [55, 420], target: [345, 120], mirrors: [{x:130,y:420,dir:1},{x:130,y:120,dir:1},{x:220,y:120,dir:1},{x:220,y:300,dir:1},{x:300,y:300,dir:1},{x:300,y:120,dir:1}], walls: [] }
    ],

    levelIndex: 0,
    mirrors: [],
    emitter: [55, 270],
    target: [345, 270],
    walls: [],
    beamSegments: [],
    activated: false,
    moves: 0,
    totalMoves: 0,
    actionButton: null,
    boundPointer: null,

    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        canvas.width = 400;
        canvas.height = 540;
        canvas.style.touchAction = 'none';
        this.boundPointer = e => this.handlePointer(e);
        canvas.addEventListener('pointerdown', this.boundPointer);
        this.reset();
    },

    reset() {
        this.levelIndex = 0;
        this.moves = 0;
        this.totalMoves = 0;
        this.finished = false;
        this.isPaused = false;
        this.isRunning = false;
        this.lastTime = 0;
        this.loadLevel();
        this.updateScore();
        this.draw();
    },

    loadLevel() {
        const level = this.levels[this.levelIndex];
        this.emitter = [...level.emitter];
        this.target = [...level.target];
        this.mirrors = level.mirrors.map(m => ({ ...m }));
        this.walls = level.walls.map(w => ({ ...w }));
        this.moves = 0;
        this.activated = false;
        this.actionButton = null;
        this.traceLaser();
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
        this.draw();
        this.animationId = requestAnimationFrame(t => this.loop(t));
    },

    getPointer(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (400 / rect.width),
            y: (e.clientY - rect.top) * (540 / rect.height)
        };
    },

    handlePointer(e) {
        if (!this.isRunning || this.isPaused || this.finished) return;
        const p = this.getPointer(e);

        if (this.actionButton &&
            p.x >= this.actionButton.x && p.x <= this.actionButton.x + this.actionButton.w &&
            p.y >= this.actionButton.y && p.y <= this.actionButton.y + this.actionButton.h) {
            this.actionButton.action();
            return;
        }

        if (this.activated) return;

        for (const mirror of this.mirrors) {
            if (Math.hypot(p.x - mirror.x, p.y - mirror.y) < 27) {
                mirror.dir = (mirror.dir + 1) % 2;
                this.moves++;
                this.totalMoves++;
                this.traceLaser();
                this.updateScore();
                this.draw();
                return;
            }
        }
    },

    traceLaser() {
        const segments = [];
        let x = this.emitter[0];
        let y = this.emitter[1];
        let dx = 1;
        let dy = 0;
        const visited = new Set();
        let reached = false;

        for (let step = 0; step < 100; step++) {
            let nextX = x + dx * 5;
            let nextY = y + dy * 5;

            // Stop at the board edge
            if (nextX < 25 || nextX > 375 || nextY < 90 || nextY > 455) {
                segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
                break;
            }

            // Wall collision
            const wall = this.walls.find(w =>
                nextX >= w.x && nextX <= w.x + w.w &&
                nextY >= w.y && nextY <= w.y + w.h
            );
            if (wall) {
                segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
                break;
            }

            // Target collision
            if (Math.hypot(nextX - this.target[0], nextY - this.target[1]) < 13) {
                segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
                reached = true;
                break;
            }

            // Mirror collision
            const mirror = this.mirrors.find(m => Math.hypot(nextX - m.x, nextY - m.y) < 8);
            if (mirror) {
                const key = `${mirror.x},${mirror.y},${dx},${dy}`;
                if (visited.has(key)) break;
                visited.add(key);

                segments.push({ x1: x, y1: y, x2: mirror.x, y2: mirror.y });

                if (mirror.dir === 1) {
                    const oldDx = dx;
                    dx = -dy;
                    dy = -oldDx;
                } else {
                    const oldDx = dx;
                    dx = dy;
                    dy = oldDx;
                }

                x = mirror.x + dx * 7;
                y = mirror.y + dy * 7;
                continue;
            }

            x = nextX;
            y = nextY;

            if (step === 99) {
                segments.push({ x1: x, y1: y, x2: x + dx * 5, y2: y + dy * 5 });
            }
        }

        this.beamSegments = segments;
        if (reached && !this.activated) {
            this.activated = true;
            this.updateScore();
        }
    },

    nextLevel() {
        if (!this.activated || this.finished) return;
        if (this.levelIndex >= this.levels.length - 1) {
            this.finished = true;
            this.isRunning = false;
            if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
            return;
        }
        this.levelIndex++;
        this.loadLevel();
        this.draw();
    },

    get score() {
        return Math.max(0, 8000 - this.totalMoves * 25);
    },

    updateScore() {
        if (this.callbacks.onScore) this.callbacks.onScore(this.score);
    },

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        this.actionButton = null;

        ctx.clearRect(0, 0, 400, 540);
        ctx.fillStyle = '#080e1b';
        ctx.fillRect(0, 0, 400, 540);

        // Grid
        ctx.strokeStyle = 'rgba(70,120,170,0.12)';
        ctx.lineWidth = 1;
        for (let x = 30; x < 400; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 80);
            ctx.lineTo(x, 460);
            ctx.stroke();
        }
        for (let y = 90; y < 460; y += 25) {
            ctx.beginPath();
            ctx.moveTo(25, y);
            ctx.lineTo(375, y);
            ctx.stroke();
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#39f5c5';
        ctx.font = 'bold 23px Arial';
        ctx.fillText('LASER BOUNCE', 200, 34);

        ctx.fillStyle = '#aab8cc';
        ctx.font = '12px Arial';
        ctx.fillText(`LEVEL ${this.levelIndex + 1} / ${this.levels.length}`, 105, 60);
        ctx.fillText(`MOVES: ${this.moves}`, 295, 60);

        // Board
        ctx.strokeStyle = '#29445e';
        ctx.lineWidth = 2;
        ctx.strokeRect(25, 80, 350, 380);

        // Walls
        this.walls.forEach(w => {
            ctx.fillStyle = '#526b83';
            ctx.beginPath();
            ctx.roundRect(w.x, w.y, w.w, w.h, 5);
            ctx.fill();
        });

        // Laser beam
        ctx.strokeStyle = 'rgba(255,70,110,0.25)';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        this.beamSegments.forEach(s => {
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
        });
        ctx.stroke();

        ctx.strokeStyle = '#ff5577';
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.beamSegments.forEach(s => {
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
        });
        ctx.stroke();

        // Emitter
        ctx.fillStyle = '#ff5577';
        ctx.beginPath();
        ctx.arc(this.emitter[0], this.emitter[1], 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.emitter[0], this.emitter[1], 5, 0, Math.PI * 2);
        ctx.fill();

        // Target
        ctx.fillStyle = this.activated ? '#39f5c5' : '#173c4a';
        ctx.beginPath();
        ctx.arc(this.target[0], this.target[1], 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Mirrors
        this.mirrors.forEach(m => {
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(m.dir === 1 ? Math.PI / 4 : -Math.PI / 4);
            ctx.strokeStyle = '#55aaff';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#55aaff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(-17, 0);
            ctx.lineTo(17, 0);
            ctx.stroke();
            ctx.restore();
        });

        ctx.fillStyle = '#aab8cc';
        ctx.font = '12px Arial';
        ctx.fillText('TAP MIRRORS TO ROTATE THEM', 200, 495);

        if (this.activated && !this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.84)';
            ctx.fillRect(0, 0, 400, 540);
            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 27px Arial';
            ctx.fillText('TARGET ACTIVATED!', 200, 225);
            ctx.fillStyle = '#ffffff';
            ctx.font = '15px Arial';
            ctx.fillText('Laser connection successful!', 200, 260);
            this.drawActionButton(ctx, 'NEXT LEVEL', 125, 295, 150, 45, () => this.nextLevel());
        }

        if (this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.9)';
            ctx.fillRect(0, 0, 400, 540);
            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 27px Arial';
            ctx.fillText('PUZZLES SOLVED!', 200, 235);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText(`Final score: ${this.score}`, 200, 275);
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
        ctx.fillText(label, x + w / 2, y + h / 2 + 4);
        this.actionButton = { x, y, w, h, action };
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
        if (this.canvas && this.boundPointer) {
            this.canvas.removeEventListener('pointerdown', this.boundPointer);
        }
        this.boundPointer = null;
        this.animationId = null;
    }
};
