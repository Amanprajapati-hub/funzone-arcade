
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['kingdom-tactics'] = {
    id: 'kingdom-tactics',
    title: 'Kingdom Tactics',
    category: 'Strategy',
    description: 'Command your kingdom army and defeat the enemy king in a tactical battlefield.',
    instructions: 'You control the cyan army. Tap one of your units, then tap a highlighted destination to move or attack. Soldiers move one square, knights move in an L shape, and archers attack enemies up to two squares away. Defeat the enemy king to win.',

    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,

    board: [],
    selected: null,
    legalMoves: [],
    currentPlayer: 1,
    turn: 1,
    score: 0,
    aiTimer: 0,
    aiThinking: false,
    message: 'Select one of your units.',
    messageTimer: 0,
    boundPointer: null,

    cell: 48,
    boardX: 56,
    boardY: 112,

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

    createUnit(type, side) {
        const stats = {
            king: { hp: 5, damage: 2, range: 1, move: 1, symbol: 'K' },
            soldier: { hp: 3, damage: 1, range: 1, move: 1, symbol: 'S' },
            knight: { hp: 4, damage: 2, range: 1, move: 2, symbol: 'N' },
            archer: { hp: 2, damage: 1, range: 2, move: 1, symbol: 'A' }
        };

        return {
            type,
            side,
            ...stats[type],
            maxHp: stats[type].hp
        };
    },

    
reset() {
    this.board = Array.from({ length: 6 }, () => Array(6).fill(null));

    // Randomly shuffle available positions
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Your army positions: bottom three rows
    const playerPositions = [];

    for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
            playerPositions.push({ row: r, col: c });
        }
    }

    // Enemy army positions: top three rows
    const enemyPositions = [];

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
            enemyPositions.push({ row: r, col: c });
        }
    }

    shuffle(playerPositions);
    shuffle(enemyPositions);

    // Unit formations
    const army = [
        'king',
        'soldier',
        'soldier',
        'knight',
        'archer'
    ];

    // Place your army randomly
    army.forEach((type, index) => {
        const pos = playerPositions[index];

        this.board[pos.row][pos.col] = this.createUnit(type, 1);
    });

    // Place enemy army randomly
    const enemyArmy = shuffle([...army]);

    enemyArmy.forEach((type, index) => {
        const pos = enemyPositions[index];

        this.board[pos.row][pos.col] = this.createUnit(type, -1);
    });

    this.selected = null;
    this.legalMoves = [];
    this.currentPlayer = 1;
    this.turn = 1;
    this.score = 0;

    this.aiTimer = 0;
    this.aiThinking = false;
    this.finished = false;
    this.isPaused = false;

    this.message = 'Select one of your units.';
    this.messageTimer = 3;

    this.draw();
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
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        if (!this.isPaused && !this.finished) {
            this.update(dt);
        }

        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    update(dt) {
        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
        }

        if (this.aiThinking) {
            this.aiTimer -= dt;

            if (this.aiTimer <= 0) {
                this.aiThinking = false;
                this.makeAIMove();
            }
        }
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
            this.canvas.removeEventListener('pointerdown', this.boundPointer);
        }

        this.boundPointer = null;
        this.canvas = null;
        this.ctx = null;
    },

    setMessage(text, duration = 2) {
        this.message = text;
        this.messageTimer = duration;
    },

    handlePointer(event) {
        if (
            this.finished ||
            this.isPaused ||
            !this.isRunning ||
            this.currentPlayer !== 1 ||
            this.aiThinking
        ) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * this.canvas.width / rect.width;
        const y = (event.clientY - rect.top) * this.canvas.height / rect.height;

        if (x >= 315 && x <= 390 && y >= 12 && y <= 45) {
            this.restart();
            return;
        }

        const col = Math.floor((x - this.boardX) / this.cell);
        const row = Math.floor((y - this.boardY) / this.cell);

        if (row < 0 || row >= 6 || col < 0 || col >= 6) return;

        const target = { row, col };
        const unit = this.board[row][col];

        if (
            this.selected &&
            this.legalMoves.some(m => m.row === row && m.col === col)
        ) {
            this.performMove(
                this.selected.row,
                this.selected.col,
                row,
                col
            );
            return;
        }

        if (unit && unit.side === 1) {
            this.selected = target;
            this.legalMoves = this.getLegalMoves(row, col);
            this.setMessage(`${unit.type.toUpperCase()} selected. Choose a move.`);
            return;
        }

        this.selected = null;
        this.legalMoves = [];
    },

    getLegalMoves(row, col) {
        const unit = this.board[row][col];
        if (!unit) return [];

        const moves = [];

        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                if (r === row && c === col) continue;

                const target = this.board[r][c];

                if (target && target.side === unit.side) continue;

                const dr = Math.abs(r - row);
                const dc = Math.abs(c - col);

                let valid = false;

                if (unit.type === 'knight') {
                    valid = (
                        (dr === 2 && dc === 1) ||
                        (dr === 1 && dc === 2)
                    ) && !target;
                } else if (unit.type === 'archer') {
                    valid = (
                        (dr === 0 && dc > 0 && dc <= 2) ||
                        (dc === 0 && dr > 0 && dr <= 2)
                    );

                    if (valid && !target) {
                        valid = false;
                    }

                    if (valid) {
                        const stepR = Math.sign(r - row);
                        const stepC = Math.sign(c - col);

                        for (let i = 1; i < Math.max(dr, dc); i++) {
                            if (this.board[row + stepR * i][col + stepC * i]) {
                                valid = false;
                                break;
                            }
                        }
                    }
                } else {
                    valid = dr + dc === 1;
                }

                if (!valid) continue;

                if (target && target.side === unit.side) continue;

                moves.push({ row: r, col: c, attack: !!target });
            }
        }

        return moves;
    },

    performMove(fromR, fromC, toR, toC) {
        const unit = this.board[fromR][fromC];
        if (!unit) return;

        const target = this.board[toR][toC];

        if (target) {
            target.hp -= unit.damage;

            this.makeParticles(
                this.boardX + toC * this.cell + this.cell / 2,
                this.boardY + toR * this.cell + this.cell / 2,
                unit.side === 1 ? '#45e6d0' : '#ff8a79'
            );

            if (target.hp <= 0) {
                if (target.type === 'king') {
                    this.finishGame(unit.side);
                    return;
                }

                this.board[toR][toC] = null;

                if (unit.side === 1) {
                    this.score += 100;

                    if (this.callbacks.onScore) {
                        this.callbacks.onScore(this.score);
                    }
                }
            } else {
                this.setMessage(
                    `${target.type.toUpperCase()} hit! ${target.hp} HP remaining.`,
                    2
                );
            }
        } else {
            this.board[toR][toC] = unit;
            this.board[fromR][fromC] = null;
        }

        this.selected = null;
        this.legalMoves = [];

        this.currentPlayer *= -1;

        if (this.currentPlayer === 1) {
            this.turn++;
            this.setMessage('Your turn. Command your army!', 2);
        } else {
            this.aiThinking = true;
            this.aiTimer = 0.75;
            this.setMessage('Enemy army is thinking...', 2);
        }
    },

    makeAIMove() {
        if (this.finished || this.currentPlayer !== -1) return;

        const choices = [];

        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const unit = this.board[r][c];

                if (!unit || unit.side !== -1) continue;

                const moves = this.getLegalMoves(r, c);

                for (const move of moves) {
                    const target = this.board[move.row][move.col];

                    let value = Math.random() * 3;

                    if (target) {
                        value += target.type === 'king' ? 100 : target.maxHp * 2;
                    }

                    if (unit.type === 'king') value -= 1;

                    choices.push({
                        fromR: r,
                        fromC: c,
                        toR: move.row,
                        toC: move.col,
                        value
                    });
                }
            }
        }

        if (!choices.length) {
            this.currentPlayer = 1;
            this.turn++;
            this.setMessage('Enemy has no moves. Your turn!', 2);
            return;
        }

        choices.sort((a, b) => b.value - a.value);

        const move = choices[0];

        this.performMove(
            move.fromR,
            move.fromC,
            move.toR,
            move.toC
        );
    },

    finishGame(winner) {
        this.finished = true;
        this.aiThinking = false;

        if (winner === 1) {
            this.score += 500;
            this.message = 'VICTORY! ENEMY KING DEFEATED!';

            if (this.callbacks.onScore) {
                this.callbacks.onScore(this.score);
            }
        } else {
            this.message = 'YOUR KINGDOM HAS FALLEN!';
        }

        this.draw();

        const finalScore = this.score;

        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(finalScore);
        }
    },

    makeParticles(x, y, color) {
        if (!this.particles) this.particles = [];

        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * (25 + Math.random() * 65),
                vy: Math.sin(angle) * (25 + Math.random() * 65),
                life: 0.5,
                color
            });
        }
    },

    draw() {
        if (!this.ctx) return;

        const ctx = this.ctx;

        ctx.clearRect(0, 0, 400, 540);

        this.drawBackground();
        this.drawHeader();
        this.drawBoard();
        this.drawUnits();
        this.drawFooter();

        if (this.finished) {
            this.drawOverlay();
        }
    },

    drawBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 540);

        gradient.addColorStop(0, '#111c36');
        gradient.addColorStop(1, '#080d1b');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 540);

        ctx.strokeStyle = 'rgba(130,160,220,0.05)';

        for (let x = 0; x < 400; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 540);
            ctx.stroke();
        }
    },

    drawHeader() {
        const ctx = this.ctx;

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('KINGDOM TACTICS', 200, 32);

        ctx.fillStyle = '#9aaccd';
        ctx.font = '11px Arial';
        ctx.fillText('COMMAND YOUR ARMY • DEFEAT THE ENEMY KING', 200, 51);

        ctx.fillStyle = '#45e6d0';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('YOUR ARMY', 110, 83);

        ctx.fillStyle = '#bb91ff';
        ctx.fillText('ENEMY ARMY', 290, 83);

        ctx.fillStyle = '#1c2d4b';
        ctx.beginPath();
        ctx.roundRect(315, 12, 75, 30, 7);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('RESET', 352, 31);
    },

    drawBoard() {
        const ctx = this.ctx;

        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const x = this.boardX + c * this.cell;
                const y = this.boardY + r * this.cell;

                ctx.fillStyle = (r + c) % 2 === 0
                    ? '#263b54'
                    : '#1b2d45';

                ctx.fillRect(x, y, this.cell, this.cell);

                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.strokeRect(x, y, this.cell, this.cell);

                if (
                    this.selected &&
                    this.selected.row === r &&
                    this.selected.col === c
                ) {
                    ctx.fillStyle = 'rgba(69,230,208,0.3)';
                    ctx.fillRect(x, y, this.cell, this.cell);

                    ctx.strokeStyle = '#45e6d0';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x + 2, y + 2, this.cell - 4, this.cell - 4);
                    ctx.lineWidth = 1;
                }

                const move = this.legalMoves.find(
                    m => m.row === r && m.col === c
                );

                if (move) {
                    ctx.beginPath();
                    ctx.arc(
                        x + this.cell / 2,
                        y + this.cell / 2,
                        move.attack ? 13 : 5,
                        0,
                        Math.PI * 2
                    );

                    ctx.fillStyle = move.attack
                        ? 'rgba(255,110,110,0.85)'
                        : '#45e6d0';

                    ctx.fill();
                }
            }
        }
    },

    drawUnits() {
        const ctx = this.ctx;

        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const unit = this.board[r][c];
                if (!unit) continue;

                const x = this.boardX + c * this.cell + this.cell / 2;
                const y = this.boardY + r * this.cell + this.cell / 2;

                const color = unit.side === 1 ? '#45e6d0' : '#bb91ff';
                const dark = unit.side === 1 ? '#087b7d' : '#6240a1';

                ctx.shadowColor = color;
                ctx.shadowBlur = 10;

                const gradient = ctx.createRadialGradient(
                    x - 5, y - 6, 2, x, y, 18
                );

                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.25, color);
                gradient.addColorStop(1, dark);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, 17, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = '#102039';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(unit.symbol, x, y + 1);
                ctx.textBaseline = 'alphabetic';

                // Health bar
                ctx.fillStyle = '#34283c';
                ctx.fillRect(x - 12, y + 21, 24, 4);

                ctx.fillStyle = unit.side === 1 ? '#45e6d0' : '#bb91ff';
                ctx.fillRect(
                    x - 12,
                    y + 21,
                    24 * (unit.hp / unit.maxHp),
                    4
                );

                ctx.fillStyle = '#dce8ff';
                ctx.font = '8px Arial';
                ctx.fillText(`${unit.hp} HP`, x, y + 34);
            }
        }
    },

    drawFooter() {
        const ctx = this.ctx;

        ctx.textAlign = 'center';

        ctx.fillStyle = '#45e6d0';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`TURN ${this.turn}`, 200, 430);

        ctx.fillStyle = this.messageTimer > 0 ? '#d5e7ff' : '#8fa3c7';
        ctx.font = '11px Arial';
        ctx.fillText(this.message, 200, 455, 380);

        ctx.fillStyle = '#8fa3c7';
        ctx.font = '10px Arial';
        ctx.fillText('K = King  S = Soldier  N = Knight  A = Archer', 200, 485);

        ctx.fillStyle = '#627a9f';
        ctx.fillText('Defeat the enemy king to claim victory.', 200, 507);
    },

    drawOverlay() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(4,8,20,0.82)';
        ctx.fillRect(0, 0, 400, 540);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(
            this.message.includes('VICTORY') ? 'KINGDOM SAVED!' : 'GAME OVER',
            200,
            245
        );

        ctx.fillStyle = '#45e6d0';
        ctx.font = '14px Arial';
        ctx.fillText(`Final Score: ${this.score}`, 200, 280);

        ctx.fillStyle = '#b5c7e6';
        ctx.font = '12px Arial';
        ctx.fillText('Press RESET to play again', 200, 315);
    }
};
