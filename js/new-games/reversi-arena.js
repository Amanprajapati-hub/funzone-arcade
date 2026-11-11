
window.ArcadeGames = window.ArcadeGames || {};

window.ArcadeGames['reversi-arena'] = {
    id: 'reversi-arena',
    title: 'Reversi Arena',
    category: 'Strategy',
    description: 'Outsmart your opponent in this classic black-and-white disk strategy game.',
    instructions: 'You play as cyan. Tap a highlighted square to place your disk and flip your opponent’s disks. Capture more disks than the purple opponent to win. If you have no legal move, your turn is skipped.',

    canvas: null,
    ctx: null,
    callbacks: {},
    animationId: null,
    isRunning: false,
    isPaused: false,
    finished: false,

    board: [],
    currentPlayer: 1,
    validMoves: [],
    playerScore: 2,
    opponentScore: 2,
    message: 'Your turn — place a cyan disk.',
    messageTimer: 0,
    aiTimer: 0,
    aiThinking: false,
    boundPointer: null,

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
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        if (!this.isPaused && !this.finished) {
            this.update(dt);
        }

        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    
reset() {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(0));

    // Random starting position in the central area
    const startRow = 2 + Math.floor(Math.random() * 3);
    const startCol = 2 + Math.floor(Math.random() * 3);

    // Randomly choose one of the two diagonal arrangements
    const layouts = [
        [
            [1, -1],
            [-1, 1]
        ],
        [
            [-1, 1],
            [1, -1]
        ]
    ];

    const layout = layouts[Math.floor(Math.random() * layouts.length)];

    // Place the four starting disks
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
            this.board[startRow + r][startCol + c] = layout[r][c];
        }
    }

    this.currentPlayer = 1;
    this.validMoves = [];
    this.playerScore = 2;
    this.opponentScore = 2;

    this.finished = false;
    this.isPaused = false;
    this.aiThinking = false;
    this.aiTimer = 0;

    this.message = 'Your turn — place a cyan disk.';
    this.messageTimer = 0;

    this.refreshMoves();
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
            this.canvas.removeEventListener('pointerdown', this.boundPointer);
        }

        this.boundPointer = null;
        this.canvas = null;
        this.ctx = null;
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

        if (x >= 325 && x <= 390 && y >= 12 && y <= 48) {
            this.restart();
            return;
        }

        const boardX = 40;
        const boardY = 135;
        const cell = 40;

        if (
            x < boardX ||
            x >= boardX + cell * 8 ||
            y < boardY ||
            y >= boardY + cell * 8
        ) return;

        const col = Math.floor((x - boardX) / cell);
        const row = Math.floor((y - boardY) / cell);

        this.playMove(row, col, 1);
    },

    getFlips(row, col, player) {
        if (
            row < 0 || row >= 8 ||
            col < 0 || col >= 8 ||
            this.board[row][col] !== 0
        ) return [];

        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const allFlips = [];

        for (const [dr, dc] of directions) {
            const line = [];
            let r = row + dr;
            let c = col + dc;

            while (
                r >= 0 && r < 8 &&
                c >= 0 && c < 8 &&
                this.board[r][c] === -player
            ) {
                line.push([r, c]);
                r += dr;
                c += dc;
            }

            if (
                line.length > 0 &&
                r >= 0 && r < 8 &&
                c >= 0 && c < 8 &&
                this.board[r][c] === player
            ) {
                allFlips.push(...line);
            }
        }

        return allFlips;
    },

    getLegalMoves(player) {
        const moves = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const flips = this.getFlips(r, c, player);

                if (flips.length > 0) {
                    moves.push({ row: r, col: c, flips });
                }
            }
        }

        return moves;
    },

    refreshMoves() {
        this.validMoves = this.getLegalMoves(this.currentPlayer);
    },

    playMove(row, col, player) {
        if (this.finished || this.currentPlayer !== player) return false;

        const flips = this.getFlips(row, col, player);

        if (!flips.length) {
            if (player === 1) {
                this.message = 'Invalid move — choose a highlighted square.';
                this.messageTimer = 2;
            }
            return false;
        }

        this.board[row][col] = player;

        for (const [r, c] of flips) {
            this.board[r][c] = player;
        }

        this.updateScores();

        this.currentPlayer = -player;
        this.refreshMoves();

        this.message = player === 1
            ? `Nice move! You flipped ${flips.length} disk(s).`
            : `Opponent flipped ${flips.length} disk(s).`;

        this.messageTimer = 2;

        this.checkNextTurn();

        return true;
    },

    updateScores() {
        let player = 0;
        let opponent = 0;

        for (const row of this.board) {
            for (const disk of row) {
                if (disk === 1) player++;
                if (disk === -1) opponent++;
            }
        }

        this.playerScore = player;
        this.opponentScore = opponent;

        if (this.callbacks.onScore) {
            this.callbacks.onScore(player * 10);
        }
    },

    checkNextTurn() {
        const playerMoves = this.getLegalMoves(1);
        const opponentMoves = this.getLegalMoves(-1);

        if (!playerMoves.length && !opponentMoves.length) {
            this.finishGame();
            return;
        }

        if (!this.getLegalMoves(this.currentPlayer).length) {
            this.currentPlayer *= -1;

            this.message = this.currentPlayer === 1
                ? 'Opponent has no moves. Your turn again!'
                : 'You have no moves. Opponent plays again.';

            this.messageTimer = 2;
            this.refreshMoves();
        }

        if (this.currentPlayer === -1) {
            this.aiThinking = true;
            this.aiTimer = 0.65;
        } else {
            this.aiThinking = false;
            this.refreshMoves();
        }
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

    makeAIMove() {
        if (this.finished || this.currentPlayer !== -1) return;

        const moves = this.getLegalMoves(-1);

        if (!moves.length) {
            this.currentPlayer = 1;
            this.refreshMoves();
            this.message = 'Your turn!';
            this.messageTimer = 2;
            return;
        }

        const weights = [
            [100, -20, 10, 5, 5, 10, -20, 100],
            [-20, -40, -5, -5, -5, -5, -40, -20],
            [10, -5, 10, 2, 2, 10, -5, 10],
            [5, -5, 2, 2, 2, 2, -5, 5],
            [5, -5, 2, 2, 2, 2, -5, 5],
            [10, -5, 10, 2, 2, 10, -5, 10],
            [-20, -40, -5, -5, -5, -5, -40, -20],
            [100, -20, 10, 5, 5, 10, -20, 100]
        ];

        moves.sort((a, b) => {
            const scoreA =
                weights[a.row][a.col] + a.flips.length * 1.5;
            const scoreB =
                weights[b.row][b.col] + b.flips.length * 1.5;

            return scoreB - scoreA;
        });

        const bestScore =
            weights[moves[0].row][moves[0].col] +
            moves[0].flips.length * 1.5;

        const goodMoves = moves.filter(move => {
            const score =
                weights[move.row][move.col] +
                move.flips.length * 1.5;

            return score >= bestScore - 8;
        });

        const choice = goodMoves[
            Math.floor(Math.random() * goodMoves.length)
        ];

        this.playMove(choice.row, choice.col, -1);
    },

    finishGame() {
        this.finished = true;
        this.updateScores();

        let result;

        if (this.playerScore > this.opponentScore) {
            result = 'YOU WIN!';
        } else if (this.playerScore < this.opponentScore) {
            result = 'OPPONENT WINS';
        } else {
            result = 'DRAW!';
        }

        this.message = result;

        const score = this.playerScore * 10;

        this.draw();

        if (this.callbacks.onScore) {
            this.callbacks.onScore(score);
        }

        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(score);
        }
    },

    draw() {
        if (!this.ctx) return;

        const ctx = this.ctx;

        ctx.clearRect(0, 0, 400, 540);

        this.drawBackground();
        this.drawHeader();
        this.drawScoreboard();
        this.drawBoard();
        this.drawFooter();

        if (this.finished) {
            this.drawOverlay();
        }
    },

    drawBackground() {
        const ctx = this.ctx;

        const gradient = ctx.createLinearGradient(0, 0, 0, 540);
        gradient.addColorStop(0, '#121d39');
        gradient.addColorStop(1, '#080d1c');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 540);

        ctx.strokeStyle = 'rgba(120,160,220,0.06)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= 400; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 540);
            ctx.stroke();
        }
    },

    drawHeader() {
        const ctx = this.ctx;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 23px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('REVERSI ARENA', 200, 35);

        ctx.fillStyle = '#91a4c7';
        ctx.font = '11px Arial';
        ctx.fillText('CAPTURE THE MOST DISKS TO WIN', 200, 55);

        ctx.fillStyle = '#45e6d0';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('YOU: CYAN', 105, 82);

        ctx.fillStyle = '#bb91ff';
        ctx.fillText('OPPONENT: PURPLE', 285, 82);
    },

    drawScoreboard() {
        const ctx = this.ctx;

        this.drawScoreCard(105, 108, this.playerScore, '#45e6d0');
        this.drawScoreCard(285, 108, this.opponentScore, '#bb91ff');

        ctx.fillStyle = '#a6b8d8';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';

        ctx.fillText(
            this.currentPlayer === 1 ? 'YOUR TURN' :
            this.currentPlayer === -1 ? 'OPPONENT TURN' : '',
            200,
            117
        );

        if (this.aiThinking) {
            ctx.fillStyle = '#bb91ff';
            ctx.font = '10px Arial';
            ctx.fillText('Thinking...', 200, 132);
        }
    },

    drawScoreCard(x, y, score, color) {
        const ctx = this.ctx;

        ctx.fillStyle = '#1a2948';
        ctx.beginPath();
        ctx.roundRect(x - 42, y - 19, 84, 38, 8);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = 'bold 19px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(String(score), x, y + 7);
    },

    drawBoard() {
        const ctx = this.ctx;

        const startX = 40;
        const startY = 145;
        const cell = 40;

        ctx.fillStyle = '#145b55';
        ctx.beginPath();
        ctx.roundRect(startX - 4, startY - 4, 328, 328, 8);
        ctx.fill();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = startX + c * cell;
                const y = startY + r * cell;

                ctx.fillStyle = (r + c) % 2 === 0
                    ? '#1a6d62'
                    : '#175e55';

                ctx.fillRect(x, y, cell, cell);

                ctx.strokeStyle = 'rgba(200,255,240,0.12)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cell, cell);

                if (this.board[r][c] !== 0) {
                    this.drawDisk(
                        x + cell / 2,
                        y + cell / 2,
                        this.board[r][c]
                    );
                } else if (
                    this.currentPlayer === 1 &&
                    this.validMoves.some(m => m.row === r && m.col === c)
                ) {
                    ctx.beginPath();
                    ctx.arc(
                        x + cell / 2,
                        y + cell / 2,
                        5,
                        0,
                        Math.PI * 2
                    );

                    ctx.fillStyle = 'rgba(69,230,208,0.85)';
                    ctx.fill();
                }
            }
        }
    },

    drawDisk(x, y, player) {
        const ctx = this.ctx;

        const color = player === 1 ? '#45e6d0' : '#bb91ff';

        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        const gradient = ctx.createRadialGradient(
            x - 4, y - 5, 2,
            x, y, 16
        );

        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.25, color);
        gradient.addColorStop(1, player === 1 ? '#087c80' : '#6540a0');

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    },

    drawFooter() {
        const ctx = this.ctx;

        ctx.fillStyle = this.messageTimer > 0
            ? '#a9f4df'
            : '#a4b6d8';

        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.message,
            200,
            500,
            380
        );

        ctx.fillStyle = '#7186ab';
        ctx.font = '10px Arial';
        ctx.fillText(
            'Tap a highlighted square to place your disk',
            200,
            520
        );

        ctx.fillStyle = '#263858';
        ctx.beginPath();
        ctx.roundRect(325, 12, 65, 30, 7);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('RESET', 357, 31);
    },

    drawOverlay() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(5,10,25,0.82)';
        ctx.fillRect(0, 0, 400, 540);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.message, 200, 250);

        ctx.fillStyle = '#b8c9e8';
        ctx.font = '15px Arial';
        ctx.fillText(
            `You ${this.playerScore}  —  ${this.opponentScore} Opponent`,
            200,
            282
        );

        ctx.fillStyle = '#45e6d0';
        ctx.font = '12px Arial';
        ctx.fillText('Press RESET to play again', 200, 315);
    }
};
