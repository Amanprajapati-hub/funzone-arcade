
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['factory-manager'] = {
    id: 'factory-manager',
    title: 'Factory Manager',
    category: 'Strategy',
    description: 'Build your production empire! Manufacture goods, earn coins, and upgrade your factory.',
    instructions: 'Tap PRODUCE to manufacture goods. Sell your products for coins, then purchase machine upgrades to increase production speed and value. Reach the target to win!',
    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,
    lastTime: 0,

    money: 0,
    goods: 0,
    produced: 0,
    sold: 0,
    machineLevel: 1,
    speedLevel: 1,
    valueLevel: 1,
    productionProgress: 0,
    productionRate: 0.65,
    target: 120,
    score: 0,
    buttons: [],
    particles: [],
    boundPointer: null,

    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        this.canvas.width = 400;
        this.canvas.height = 540;
        this.canvas.style.touchAction = 'none';
        this.boundPointer = (e) => this.handlePointer(e);
        this.canvas.addEventListener('pointerdown', this.boundPointer);
        this.reset();
    },

    reset() {
        this.money = 25;
        this.goods = 0;
        this.produced = 0;
        this.sold = 0;
        this.machineLevel = 1;
        this.speedLevel = 1;
        this.valueLevel = 1;
        this.productionProgress = 0;
        this.productionRate = 0.65;
        this.target = 120;
        this.score = 0;
        this.particles = [];
        this.buttons = [];
        this.finished = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.isRunning = false;
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
            this.productionProgress += dt * this.productionRate * (1 + (this.speedLevel - 1) * 0.45);
            while (this.productionProgress >= 1) {
                this.productionProgress -= 1;
                this.goods++;
                this.produced++;
                this.addParticles(205, 245, '#39f5c5');
                this.updateScore();
            }
        }

        this.updateParticles(dt);
        this.draw();
        this.animationId = requestAnimationFrame((t) => this.loop(t));
    },

    handlePointer(e) {
        if (!this.canvas || this.finished || this.isPaused) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (400 / rect.width);
        const y = (e.clientY - rect.top) * (540 / rect.height);

        for (const b of this.buttons) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                b.action();
                this.draw();
                return;
            }
        }
    },

    produceNow() {
        if (this.finished) return;
        this.goods += 1 + Math.floor(this.machineLevel / 3);
        this.produced += 1 + Math.floor(this.machineLevel / 3);
        this.addParticles(205, 245, '#39f5c5');
        this.updateScore();
        this.draw();
    },

    sellGoods() {
        if (this.goods <= 0 || this.finished) return;
        const quantity = this.goods;
        const price = 5 + (this.valueLevel - 1) * 3;
        const earned = quantity * price;
        this.money += earned;
        this.sold += quantity;
        this.goods = 0;
        this.score += earned;
        this.updateScore();
        this.addParticles(200, 315, '#ffd166');
        this.checkWin();
    },

    upgradeMachine() {
        const cost = 20 + this.machineLevel * 25;
        if (this.money < cost || this.finished) return;
        this.money -= cost;
        this.machineLevel++;
        this.updateScore();
        this.addParticles(200, 405, '#55aaff');
    },

    upgradeSpeed() {
        const cost = 30 + (this.speedLevel - 1) * 35;
        if (this.money < cost || this.finished) return;
        this.money -= cost;
        this.speedLevel++;
        this.updateScore();
        this.addParticles(200, 405, '#55aaff');
    },

    upgradeValue() {
        const cost = 35 + (this.valueLevel - 1) * 40;
        if (this.money < cost || this.finished) return;
        this.money -= cost;
        this.valueLevel++;
        this.updateScore();
        this.addParticles(200, 405, '#55aaff');
    },

    updateScore() {
        this.score = Math.max(this.score, this.sold * 5);
        if (this.callbacks.onScore) this.callbacks.onScore(this.score);
    },

    checkWin() {
        if (this.sold >= this.target) {
            this.finished = true;
            this.isRunning = false;
            if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
        }
    },

    addParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 90,
                vy: (Math.random() - 0.5) * 90,
                life: 0.6,
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

    drawButton(x, y, w, h, label, action, color = '#18283b', disabled = false) {
        const ctx = this.ctx;
        ctx.fillStyle = disabled ? '#171d28' : color;
        ctx.strokeStyle = disabled ? '#303846' : '#39f5c5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = disabled ? '#657080' : '#f1f7ff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2 + 4);

        this.buttons.push({
            x, y, w, h,
            action: disabled ? () => {} : action
        });
    },

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        this.buttons = [];

        ctx.clearRect(0, 0, 400, 540);
        ctx.fillStyle = '#080e1b';
        ctx.fillRect(0, 0, 400, 540);

        // Background grid
        ctx.strokeStyle = 'rgba(60,110,160,0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= 400; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 540);
            ctx.stroke();
        }
        for (let y = 0; y <= 540; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(400, y);
            ctx.stroke();
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#39f5c5';
        ctx.font = 'bold 23px Arial';
        ctx.fillText('FACTORY MANAGER', 200, 34);

        ctx.fillStyle = '#aab8cc';
        ctx.font = '12px Arial';
        ctx.fillText('BUILD • PRODUCE • PROFIT', 200, 55);

        // Stats panel
        ctx.fillStyle = '#111d2e';
        ctx.beginPath();
        ctx.roundRect(18, 72, 364, 72, 12);
        ctx.fill();
        ctx.strokeStyle = '#263b54';
        ctx.stroke();

        const stats = [
            { label: 'COINS', value: this.money, color: '#ffd166' },
            { label: 'GOODS', value: this.goods, color: '#39f5c5' },
            { label: 'SOLD', value: `${this.sold}/${this.target}`, color: '#7db8ff' }
        ];

        stats.forEach((s, i) => {
            const x = 78 + i * 122;
            ctx.fillStyle = '#8494aa';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(s.label, x, 94);
            ctx.fillStyle = s.color;
            ctx.font = 'bold 21px Arial';
            ctx.fillText(s.value, x, 122);
        });

        // Factory building
        ctx.fillStyle = '#172b40';
        ctx.beginPath();
        ctx.roundRect(75, 177, 250, 135, 10);
        ctx.fill();
        ctx.strokeStyle = '#39f5c5';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Roof
        ctx.fillStyle = '#25415c';
        ctx.beginPath();
        ctx.moveTo(65, 183);
        ctx.lineTo(110, 145);
        ctx.lineTo(290, 145);
        ctx.lineTo(335, 183);
        ctx.closePath();
        ctx.fill();

        // Chimneys
        ctx.fillStyle = '#46627d';
        ctx.fillRect(110, 133, 28, 25);
        ctx.fillRect(262, 133, 28, 25);

        ctx.fillStyle = '#39f5c5';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('PRODUCTION UNIT', 200, 202);

        // Machine icon
        ctx.fillStyle = '#233f59';
        ctx.beginPath();
        ctx.roundRect(130, 215, 140, 65, 8);
        ctx.fill();
        ctx.strokeStyle = '#55aaff';
        ctx.stroke();

        ctx.fillStyle = '#55aaff';
        ctx.beginPath();
        ctx.arc(165, 247, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0b1727';
        ctx.beginPath();
        ctx.arc(165, 247, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#39f5c5';
        ctx.fillRect(198, 232, 50, 7);
        ctx.fillRect(198, 246, 35, 7);
        ctx.fillRect(198, 260, 42, 7);

        // Production progress
        ctx.fillStyle = '#1b2c40';
        ctx.beginPath();
        ctx.roundRect(45, 326, 310, 13, 6);
        ctx.fill();
        ctx.fillStyle = '#39f5c5';
        ctx.beginPath();
        ctx.roundRect(45, 326, 310 * this.productionProgress, 13, 6);
        ctx.fill();

        ctx.fillStyle = '#aab8cc';
        ctx.font = '11px Arial';
        ctx.fillText('AUTOMATIC PRODUCTION', 200, 357);

        // Upgrade details
        ctx.fillStyle = '#aab8cc';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`Machine Lv.${this.machineLevel}  •  Speed Lv.${this.speedLevel}  •  Value Lv.${this.valueLevel}`, 200, 380);

        this.drawButton(20, 397, 170, 42, 'UPGRADE MACHINE', () => this.upgradeMachine(),
            '#173c4a', this.money < 20 + this.machineLevel * 25);

        this.drawButton(210, 397, 170, 42, 'UPGRADE SPEED', () => this.upgradeSpeed(),
            '#173c4a', this.money < 30 + (this.speedLevel - 1) * 35);

        this.drawButton(20, 451, 170, 42, 'UPGRADE VALUE', () => this.upgradeValue(),
            '#173c4a', this.money < 35 + (this.valueLevel - 1) * 40);

        this.drawButton(210, 451, 170, 42, 'SELL ALL GOODS', () => this.sellGoods(),
            '#5a4020', this.goods <= 0);

        this.drawButton(80, 502, 240, 30, '⚡ QUICK PRODUCE', () => this.produceNow(), '#174d48');

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / 0.6);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        if (this.finished) {
            ctx.fillStyle = 'rgba(3,8,18,0.88)';
            ctx.fillRect(0, 0, 400, 540);
            ctx.fillStyle = '#39f5c5';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('FACTORY TYCOON!', 200, 230);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText('Production target completed!', 200, 266);
            ctx.fillText(`Goods sold: ${this.sold}`, 200, 296);
            ctx.fillText(`Final score: ${this.score}`, 200, 324);
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
        if (this.canvas && this.boundPointer) {
            this.canvas.removeEventListener('pointerdown', this.boundPointer);
        }
        this.boundPointer = null;
        this.animationId = null;
    }
};
