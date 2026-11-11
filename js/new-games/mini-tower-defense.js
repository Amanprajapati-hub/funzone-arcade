
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['mini-tower-defense'] = {
    id: 'mini-tower-defense',
    title: 'Mini Tower Defense',
    category: 'Strategy',
    description: 'Build defensive towers, stop enemy waves and protect your base.',
    instructions: 'Tap an empty build pad to place a tower. Start a wave to send enemies along the path. Select a tower and press UPGRADE.',

    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,

    coins: 120,
    lives: 10,
    wave: 0,
    score: 0,
    enemies: [],
    towers: [],
    bullets: [],
    particles: [],
    selectedTower: null,
    selectedPad: null,
    waveActive: false,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    lastTime: 0,
    gameTime: 0,
    message: 'Build a tower to defend your base!',
    messageTimer: 3,

    towerCost: 50,
    upgradeCost: 45,

    path: [],
    pads: [],

    boundPointer: null,

    // Different route layouts. Each new game randomly selects one.
    basePath: [
        { x: 0, y: 155 },
        { x: 105, y: 155 },
        { x: 105, y: 270 },
        { x: 290, y: 270 },
        { x: 290, y: 390 },
        { x: 400, y: 390 }
    ],

    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        this.canvas.width = 400;
        this.canvas.height = 540;
        this.canvas.style.touchAction = 'none';

        this.boundPointer = this.handlePointer.bind(this);
        this.canvas.addEventListener('pointerdown', this.boundPointer);

        this.reset();
    },

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();

        this.loop();
    },

    loop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.04);
        this.lastTime = now;

        if (!this.isPaused && !this.finished) {
            this.update(dt);
        }

        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    // Randomly mirror the route horizontally and/or vertically.
    generateRandomPath() {
        const flipX = Math.random() < 0.5;
        const flipY = Math.random() < 0.5;

        this.path = this.basePath.map(point => ({
            x: flipX ? 400 - point.x : point.x,
            y: flipY ? 540 - point.y : point.y
        }));
    },

    // Distance from a point to a path segment.
    pointToSegmentDistance(px, py, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        const lengthSquared = dx * dx + dy * dy;

        if (!lengthSquared) {
            return Math.hypot(px - a.x, py - a.y);
        }

        const t = Math.max(0, Math.min(1,
            ((px - a.x) * dx + (py - a.y) * dy) / lengthSquared
        ));

        const nearestX = a.x + t * dx;
        const nearestY = a.y + t * dy;

        return Math.hypot(px - nearestX, py - nearestY);
    },

    distanceFromPath(x, y) {
        let minimum = Infinity;

        for (let i = 0; i < this.path.length - 1; i++) {
            const distance = this.pointToSegmentDistance(
                x, y, this.path[i], this.path[i + 1]
            );

            minimum = Math.min(minimum, distance);
        }

        return minimum;
    },

    // Generate eight random build locations away from the enemy path.
    generateRandomPads() {
        const candidates = [];

        const columns = [35, 85, 155, 205, 275, 345, 375];
        const rows = [115, 215, 330, 445];

        for (const y of rows) {
            for (const x of columns) {
                if (this.distanceFromPath(x, y) >= 52) {
                    candidates.push({ x, y });
                }
            }
        }

        // Relax the distance slightly if a route has fewer than eight pads.
        if (candidates.length < 8) {
            for (const y of rows) {
                for (const x of columns) {
                    const alreadyAdded = candidates.some(
                        p => p.x === x && p.y === y
                    );

                    if (
                        !alreadyAdded &&
                        this.distanceFromPath(x, y) >= 38
                    ) {
                        candidates.push({ x, y });
                    }
                }
            }
        }

        // Shuffle candidate positions.
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] =
                [candidates[j], candidates[i]];
        }

        this.pads = candidates.slice(0, 8);
    },

    reset() {
        this.coins = 120;
        this.lives = 10;
        this.wave = 0;
        this.score = 0;

        this.enemies = [];
        this.towers = [];
        this.bullets = [];
        this.particles = [];

        this.selectedTower = null;
        this.selectedPad = null;

        this.waveActive = false;
        this.enemiesToSpawn = 0;
        this.spawnTimer = 0;

        this.gameTime = 0;
        this.message = 'Build a tower to defend your base!';
        this.messageTimer = 4;

        this.finished = false;
        this.isPaused = false;

        // New random map every reset.
        this.generateRandomPath();
        this.generateRandomPads();

        if (this.callbacks.onScore) {
            this.callbacks.onScore(0);
        }

        if (this.callbacks.onLives) {
            this.callbacks.onLives(this.lives);
        }

        this.draw();
    },

    pause() {
        this.isPaused = true;
    },

    resume() {
        if (!this.finished) {
            this.isPaused = false;
            this.lastTime = performance.now();
        }
    },

    restart() {
        this.reset();
        this.start();
    },

    destroy() {
        this.isRunning = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.canvas && this.boundPointer) {
            this.canvas.removeEventListener(
                'pointerdown',
                this.boundPointer
            );
        }

        this.boundPointer = null;
        this.canvas = null;
        this.ctx = null;
    },

    handlePointer(event) {
        if (this.finished || this.isPaused || !this.isRunning) return;

        const rect = this.canvas.getBoundingClientRect();

        const x = (event.clientX - rect.left) *
            this.canvas.width / rect.width;

        const y = (event.clientY - rect.top) *
            this.canvas.height / rect.height;

        // Start wave.
        if (this.hitRect(x, y, 275, 12, 112, 38)) {
            this.startWave();
            return;
        }

        // Upgrade.
        if (this.hitRect(x, y, 275, 58, 112, 34)) {
            this.upgradeSelected();
            return;
        }

        // Reset.
        if (this.hitRect(x, y, 12, 12, 75, 30)) {
            this.restart();
            return;
        }

        // Select tower.
        for (const tower of this.towers) {
            if (Math.hypot(x - tower.x, y - tower.y) < 22) {
                this.selectedTower = tower;
                this.selectedPad = null;

                this.setMessage(
                    `Tower level ${tower.level} selected.`,
                    2
                );

                return;
            }
        }

        // Build tower.
        for (let i = 0; i < this.pads.length; i++) {
            const pad = this.pads[i];

            if (Math.hypot(x - pad.x, y - pad.y) < 24) {
                this.placeTower(i);
                return;
            }
        }

        this.selectedTower = null;
        this.selectedPad = null;
    },

    hitRect(x, y, rx, ry, rw, rh) {
        return (
            x >= rx &&
            x <= rx + rw &&
            y >= ry &&
            y <= ry + rh
        );
    },

    placeTower(index) {
        const pad = this.pads[index];

        const occupied = this.towers.some(t =>
            Math.hypot(t.x - pad.x, t.y - pad.y) < 5
        );

        if (occupied) {
            this.setMessage('That pad already has a tower.', 2);
            return;
        }

        if (this.coins < this.towerCost) {
            this.setMessage('Not enough coins! Defeat enemies to earn more.', 2);
            return;
        }

        this.coins -= this.towerCost;

        const tower = {
            x: pad.x,
            y: pad.y,
            level: 1,
            range: 105,
            damage: 1,
            fireRate: 0.75,
            cooldown: 0,
            angle: 0
        };

        this.towers.push(tower);
        this.selectedTower = tower;
        this.selectedPad = index;

        this.setMessage('Tower built! Start the next wave.', 2);
    },

    upgradeSelected() {
        const tower = this.selectedTower;

        if (!tower) {
            this.setMessage('Select a tower first.', 2);
            return;
        }

        const cost = this.upgradeCost * tower.level;

        if (this.coins < cost) {
            this.setMessage(`Upgrade costs ${cost} coins.`, 2);
            return;
        }

        this.coins -= cost;
        tower.level++;
        tower.range += 18;
        tower.damage += 1;
        tower.fireRate = Math.max(0.28, tower.fireRate - 0.08);

        this.setMessage(`Tower upgraded to level ${tower.level}!`, 2);
    },

    startWave() {
        if (this.waveActive || this.finished) {
            if (this.waveActive) {
                this.setMessage('The current wave is still active!', 2);
            }
            return;
        }

        this.wave++;
        this.waveActive = true;
        this.enemiesToSpawn = 4 + this.wave * 2;
        this.spawnTimer = 0.3;

        const start = this.path[0];

        this.setMessage(
            `WAVE ${this.wave} INCOMING FROM ${this.getDirectionName(start)}!`,
            2.5
        );
    },

    getDirectionName(point) {
        if (point.x <= 1) return 'LEFT';
        if (point.x >= 399) return 'RIGHT';
        if (point.y <= 1) return 'TOP';
        return 'BOTTOM';
    },

    spawnEnemy() {
        const hp = 2 + Math.floor(this.wave * 0.8);
        const start = this.path[0];

        this.enemies.push({
            x: start.x,
            y: start.y,
            segment: 0,
            progress: 0,
            speed: 42 + this.wave * 2,
            hp,
            maxHp: hp,
            reward: 12 + this.wave,
            radius: 10,
            dead: false
        });
    },

    update(dt) {
        this.gameTime += dt;

        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
        }

        if (this.waveActive && this.enemiesToSpawn > 0) {
            this.spawnTimer -= dt;

            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.enemiesToSpawn--;

                this.spawnTimer = Math.max(
                    0.45,
                    1.1 - this.wave * 0.035
                );
            }
        }

        this.updateEnemies(dt);
        this.updateTowers(dt);
        this.updateBullets(dt);
        this.updateParticles(dt);

        this.enemies = this.enemies.filter(e => !e.dead);

        if (
            this.waveActive &&
            this.enemiesToSpawn === 0 &&
            this.enemies.length === 0
        ) {
            this.waveActive = false;
            this.coins += 25 + this.wave * 5;

            this.setMessage(
                `Wave ${this.wave} cleared! Bonus coins awarded.`,
                3
            );
        }

        if (this.lives <= 0) {
            this.endGame();
        }
    },

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            if (enemy.dead) continue;

            let remaining = enemy.speed * dt;

            while (
                remaining > 0 &&
                enemy.segment < this.path.length - 1
            ) {
                const a = this.path[enemy.segment];
                const b = this.path[enemy.segment + 1];

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const length = Math.hypot(dx, dy);

                const available = length * (1 - enemy.progress);
                const travel = Math.min(remaining, available);

                enemy.progress += travel / length;
                remaining -= travel;

                enemy.x = a.x + dx * enemy.progress;
                enemy.y = a.y + dy * enemy.progress;

                if (enemy.progress >= 0.999) {
                    enemy.segment++;
                    enemy.progress = 0;
                }
            }

            if (enemy.segment >= this.path.length - 1) {
                enemy.dead = true;
                this.lives--;

                this.makeParticles(
                    enemy.x,
                    enemy.y,
                    '#ff6464',
                    6
                );

                if (this.callbacks.onLives) {
                    this.callbacks.onLives(this.lives);
                }
            }
        }
    },

    updateTowers(dt) {
        for (const tower of this.towers) {
            tower.cooldown -= dt;

            let target = null;
            let bestProgress = -1;

            for (const enemy of this.enemies) {
                if (enemy.dead) continue;

                const distance = Math.hypot(
                    enemy.x - tower.x,
                    enemy.y - tower.y
                );

                if (
                    distance <= tower.range &&
                    enemy.segment + enemy.progress > bestProgress
                ) {
                    bestProgress = enemy.segment + enemy.progress;
                    target = enemy;
                }
            }

            if (target) {
                tower.angle = Math.atan2(
                    target.y - tower.y,
                    target.x - tower.x
                );

                if (tower.cooldown <= 0) {
                    this.bullets.push({
                        x: tower.x,
                        y: tower.y,
                        target,
                        speed: 270,
                        damage: tower.damage,
                        dead: false
                    });

                    tower.cooldown = tower.fireRate;
                }
            }
        }
    },

    updateBullets(dt) {
        for (const bullet of this.bullets) {
            if (
                bullet.dead ||
                !bullet.target ||
                bullet.target.dead
            ) {
                bullet.dead = true;
                continue;
            }

            const target = bullet.target;

            const dx = target.x - bullet.x;
            const dy = target.y - bullet.y;
            const distance = Math.hypot(dx, dy);
            const travel = bullet.speed * dt;

            if (distance <= travel + target.radius) {
                bullet.dead = true;
                target.hp -= bullet.damage;

                this.makeParticles(
                    target.x,
                    target.y,
                    '#ffd166',
                    3
                );

                if (target.hp <= 0) {
                    target.dead = true;
                    this.coins += target.reward;
                    this.score += 100;

                    if (this.callbacks.onScore) {
                        this.callbacks.onScore(this.score);
                    }

                    this.makeParticles(
                        target.x,
                        target.y,
                        '#ff9b54',
                        9
                    );
                }
            } else {
                bullet.x += dx / distance * travel;
                bullet.y += dy / distance * travel;
            }
        }

        this.bullets = this.bullets.filter(b => !b.dead);
    },

    makeParticles(x, y, color, amount) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 25 + Math.random() * 75;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.35 + Math.random() * 0.35,
                maxLife: 0.7,
                color
            });
        }
    },

    updateParticles(dt) {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }

        this.particles = this.particles.filter(p => p.life > 0);
    },

    setMessage(message, duration = 2) {
        this.message = message;
        this.messageTimer = duration;
    },

    endGame() {
        if (this.finished) return;

        this.finished = true;
        this.waveActive = false;

        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(this.score);
        }
    },

    draw() {
        if (!this.ctx) return;

        const ctx = this.ctx;

        ctx.clearRect(0, 0, 400, 540);

        this.drawBackground();
        this.drawHeader();
        this.drawPath();
        this.drawBuildPads();
        this.drawTowers();
        this.drawEnemies();
        this.drawBullets();
        this.drawParticles();
        this.drawControls();

        if (this.isPaused) {
            this.drawOverlay('PAUSED', 'Game is paused');
        }

        if (this.finished) {
            this.drawOverlay('GAME OVER', `Final Score: ${this.score}`);
        }
    },

    drawBackground() {
        const ctx = this.ctx;

        const gradient = ctx.createLinearGradient(0, 0, 0, 540);
        gradient.addColorStop(0, '#101b35');
        gradient.addColorStop(1, '#080e1d');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 540);

        ctx.strokeStyle = 'rgba(100,150,210,0.07)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= 400; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 48);
            ctx.lineTo(x, 470);
            ctx.stroke();
        }

        for (let y = 50; y <= 470; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(400, y);
            ctx.stroke();
        }
    },

    drawHeader() {
        const ctx = this.ctx;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MINI TOWER DEFENSE', 200, 24);

        ctx.fillStyle = '#879bbc';
        ctx.font = '10px Arial';
        ctx.fillText('DEFEND YOUR BASE FROM ENEMY WAVES', 200, 42);

        this.drawStat(50, 69, 'COINS', this.coins, '#ffd166');
        this.drawStat(145, 69, 'LIVES', this.lives, '#ff7777');
        this.drawStat(245, 69, 'WAVE', this.wave, '#55e7d1');
        this.drawStat(350, 69, 'SCORE', this.score, '#b79aff');
    },

    drawStat(x, y, label, value, color) {
        const ctx = this.ctx;

        ctx.fillStyle = '#192743';
        ctx.beginPath();
        ctx.roundRect(x - 40, y - 17, 80, 35, 7);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = '9px Arial';
        ctx.fillStyle = '#8da1c7';
        ctx.fillText(label, x, y - 4);

        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = color;
        ctx.fillText(String(value), x, y + 12);
    },

    drawPath() {
        const ctx = this.ctx;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);

        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }

        ctx.strokeStyle = '#273650';
        ctx.lineWidth = 43;
        ctx.stroke();

        ctx.strokeStyle = '#344c69';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 9]);
        ctx.stroke();
        ctx.setLineDash([]);

        const start = this.path[0];
        const end = this.path[this.path.length - 1];

        // Entry marker follows the randomized start.
        ctx.fillStyle = '#ffca70';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';

        ctx.fillText(
            'ENTRY',
            start.x === 0 ? 28 :
            start.x === 400 ? 372 : start.x,
            start.y < 200 ? start.y - 27 :
            start.y > 350 ? start.y + 31 : start.y - 27
        );

        // Base marker follows the randomized endpoint.
        ctx.fillStyle = '#ff7474';
        ctx.fillText(
            'BASE',
            end.x === 0 ? 28 :
            end.x === 400 ? 372 : end.x,
            end.y < 200 ? end.y - 27 :
            end.y > 350 ? end.y + 31 : end.y - 27
        );

        ctx.fillStyle = '#ff7474';
        ctx.beginPath();
        ctx.arc(end.x, end.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('!', end.x, end.y + 4);
    },

    drawBuildPads() {
        const ctx = this.ctx;

        for (const pad of this.pads) {
            const occupied = this.towers.some(t =>
                Math.hypot(t.x - pad.x, t.y - pad.y) < 5
            );

            if (occupied) continue;

            ctx.beginPath();
            ctx.arc(pad.x, pad.y, 17, 0, Math.PI * 2);

            ctx.fillStyle = '#1d3850';
            ctx.fill();

            ctx.strokeStyle = '#56d7c4';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#56d7c4';
            ctx.font = 'bold 19px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+', pad.x, pad.y + 7);
        }
    },

    drawTowers() {
        const ctx = this.ctx;

        for (const tower of this.towers) {
            if (this.selectedTower === tower) {
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);

                ctx.fillStyle = 'rgba(85,231,209,0.06)';
                ctx.fill();

                ctx.strokeStyle = 'rgba(85,231,209,0.35)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);

            ctx.fillStyle = tower.level >= 3 ? '#9c7bff' : '#35bfc2';
            ctx.fill();

            ctx.strokeStyle = this.selectedTower === tower
                ? '#ffffff'
                : '#7df7eb';

            ctx.lineWidth = this.selectedTower === tower ? 3 : 1.5;
            ctx.stroke();

            ctx.save();
            ctx.translate(tower.x, tower.y);
            ctx.rotate(tower.angle);

            ctx.fillStyle = '#d7ffff';
            ctx.fillRect(0, -4, 20, 8);

            ctx.restore();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(String(tower.level), tower.x, tower.y + 3);
        }
    },

    drawEnemies() {
        const ctx = this.ctx;

        for (const enemy of this.enemies) {
            if (enemy.dead) continue;

            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);

            ctx.fillStyle = '#ff795e';
            ctx.fill();

            ctx.strokeStyle = '#ffc19b';
            ctx.lineWidth = 2;
            ctx.stroke();

            const barWidth = 23;
            const healthWidth = barWidth * Math.max(
                0,
                enemy.hp / enemy.maxHp
            );

            ctx.fillStyle = '#3a2431';
            ctx.fillRect(enemy.x - 12, enemy.y - 18, barWidth, 4);

            ctx.fillStyle = '#6aff9e';
            ctx.fillRect(enemy.x - 12, enemy.y - 18, healthWidth, 4);
        }
    },

    drawBullets() {
        const ctx = this.ctx;

        for (const bullet of this.bullets) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);

            ctx.fillStyle = '#ffe47b';
            ctx.shadowColor = '#ffe47b';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    },

    drawParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    },

    drawControls() {
        const ctx = this.ctx;

        this.drawButton(12, 12, 75, 30, 'RESET', '#273b5b');

        this.drawButton(
            275, 12, 112, 38,
            this.waveActive ? 'WAVE ACTIVE' : 'START WAVE',
            this.waveActive ? '#45516a' : '#087f83'
        );

        const upgradeText = this.selectedTower
            ? `UPGRADE (${this.upgradeCost * this.selectedTower.level})`
            : 'UPGRADE';

        this.drawButton(275, 58, 112, 34, upgradeText, '#54458c');

        // Separate footer area prevents text collisions.
        ctx.fillStyle = 'rgba(15,27,49,0.96)';
        ctx.fillRect(8, 474, 384, 62);

        ctx.textAlign = 'center';

        if (this.messageTimer > 0) {
            ctx.fillStyle = '#d8eaff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(this.message, 200, 488, 370);
        }

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`Tower cost: ${this.towerCost} coins`, 200, 508);

        ctx.fillStyle = '#9eafd0';
        ctx.font = '9px Arial';
        ctx.fillText('Tap + to build  |  Tap tower to select', 200, 526);
    },

    drawButton(x, y, w, h, label, color) {
        const ctx = this.ctx;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 7);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
        ctx.textBaseline = 'alphabetic';
    },

    drawOverlay(title, subtitle) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(4,8,20,0.78)';
        ctx.fillRect(0, 0, 400, 540);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 27px Arial';
        ctx.fillText(title, 200, 245);

        ctx.fillStyle = '#a9c0e5';
        ctx.font = '14px Arial';
        ctx.fillText(subtitle, 200, 275);
    }
};
