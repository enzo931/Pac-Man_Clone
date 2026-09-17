const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const winScreen = document.getElementById("winScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const gridSize = 40;
const rows = 20;
const cols = 30;
let speed = 0.08;
let score = 0;
let fim = false;

// 🎵 Carrega os áudios
const backgroundMusic = new Audio("audio/fundo.mp3");
const collectSound = new Audio("audio/eat.mp3");

backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

window.addEventListener("load", () => {
    backgroundMusic.play().catch(error => console.log("Autoplay bloqueado pelo navegador:", error));
});

document.getElementById("playMusic").addEventListener("click", () => {
    backgroundMusic.play();
    document.getElementById("playMusic").style.display = "none";
});

function playCollectSound() {
    collectSound.currentTime = 0;
    collectSound.play();
}

let pacman = { x: 1, y: 1, radius: 15, direction: "right" };

// Fantasmas com comportamentos e velocidades diferentes
const ghosts = [
    { x: 5, y: 5, radius: 15, direction: "right", color: "red", speed: 0.060, behavior: "chase" },       // Persegue direto
    { x: 10, y: 15, radius: 15, direction: "left", color: "pink", speed: 0.040, behavior: "ambush" },     // Tenta prever a frente do Pac-Man
    { x: 15, y: 5, radius: 15, direction: "up", color: "orange", speed: 0.020, behavior: "patrol" },     // Patrulha / Aleatório
    { x: 20, y: 10, radius: 15, direction: "up", color: "aqua", speed: 0.010, behavior: "flank" }        // Flanqueia de outro ângulo
];

// CORREÇÃO: Gerar o mapa sem colocar bolinhas (2) aleatoriamente em locais inacessíveis
const map = Array(rows).fill(null).map((_, row) =>
    Array(cols).fill(null).map((_, col) =>
        (row === 0 || row === rows - 1 || col === 0 || col === cols - 1 || (row === 1 && col === 1)) ? 1 : (Math.random() > 0.8 ? 1 : 0)
    )
);

map[1][1] = 0;

function isAccessible(x, y) {
    return map[y] && map[y][x] !== 1;
}

function getAccessibleCells() {
    let accessibleCells = [];
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));

    let queue = [[1, 1]];
    visited[1][1] = true;

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (queue.length > 0) {
        let [x, y] = queue.shift();

        accessibleCells.push([x, y]);

        for (let [dx, dy] of directions) {
            let nx = x + dx;
            let ny = y + dy;

            if (isAccessible(nx, ny) && !visited[ny][nx]) {
                visited[ny][nx] = true;
                queue.push([nx, ny]);
            }
        }
    }
    return accessibleCells;
}

function generateOranges() {
    const accessibleCells = getAccessibleCells();
    // Garante colocar bolinhas apenas em células onde o Pac-Man consegue chegar
    let orangeCount = Math.floor(accessibleCells.length * 0.3);

    while (orangeCount > 0) {
        let [x, y] = accessibleCells[Math.floor(Math.random() * accessibleCells.length)];

        if (map[y][x] === 0 && !(x === 1 && y === 1)) {
            map[y][x] = 2;
            orangeCount--;
        }
    }
}

generateOranges();

document.addEventListener("keydown", (event) => {
    if (fim) return;
    const keyMap = { "w": "up", "a": "left", "s": "down", "d": "right" };
    if (keyMap[event.key]) {
        pacman.direction = keyMap[event.key];
    }
});

function drawMap() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (map[row][col] === 1) {
                ctx.fillStyle = "blue";
                ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
            } else if (map[row][col] === 2) {
                ctx.fillStyle = "orange";
                ctx.beginPath();
                ctx.arc(col * gridSize + gridSize / 2, row * gridSize + gridSize / 2, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawPacman() {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    let angleOffset = { "right": 0, "left": Math.PI, "up": -Math.PI / 2, "down": Math.PI / 2 };
    ctx.arc(pacman.x * gridSize + gridSize / 2, pacman.y * gridSize + gridSize / 2, pacman.radius, angleOffset[pacman.direction] + 0.2 * Math.PI, angleOffset[pacman.direction] + 1.8 * Math.PI);
    ctx.lineTo(pacman.x * gridSize + gridSize / 2, pacman.y * gridSize + gridSize / 2);
    ctx.fill();
}

// NOVO FORMATO DOS FANTASMAS (Formato Clássico com Cabeça Redonda, Ondas na Base e Olhos)
function drawGhosts() {
    ghosts.forEach(ghost => {
        let cx = ghost.x * gridSize + gridSize / 2;
        let cy = ghost.y * gridSize + gridSize / 2;
        let r = ghost.radius;

        ctx.fillStyle = ghost.color;
        ctx.beginPath();

        // Cabeça semi-circular
        ctx.arc(cx, cy - 2, r, Math.PI, 0, false);

        // Corpo
        ctx.lineTo(cx + r, cy + r);

        // Saia ondulada na base
        let numWaves = 3;
        let waveWidth = (r * 2) / numWaves;
        for (let i = 0; i < numWaves; i++) {
            ctx.quadraticCurveTo(
                cx + r - (i + 0.5) * waveWidth, cy + r - 6,
                cx + r - (i + 1) * waveWidth, cy + r
            );
        }

        ctx.lineTo(cx - r, cy - 2);
        ctx.fill();

        // Olhos
        let eyeOffsetX = 0;
        let eyeOffsetY = 0;

        if (ghost.direction === "right") eyeOffsetX = 3;
        if (ghost.direction === "left") eyeOffsetX = -3;
        if (ghost.direction === "up") eyeOffsetY = -3;
        if (ghost.direction === "down") eyeOffsetY = 3;

        // Fundo dos Olhos (Branco)
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(cx - 5 + eyeOffsetX, cy - 4 + eyeOffsetY, 4, 0, Math.PI * 2);
        ctx.arc(cx + 5 + eyeOffsetX, cy - 4 + eyeOffsetY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas (Azuis)
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(cx - 5 + eyeOffsetX * 1.5, cy - 4 + eyeOffsetY * 1.5, 2, 0, Math.PI * 2);
        ctx.arc(cx + 5 + eyeOffsetX * 1.5, cy - 4 + eyeOffsetY * 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// MOVIMENTAÇÃO DIVERSIFICADA (Mantendo atravessar paredes)
function moveGhosts() {
    if (fim) return;

    ghosts.forEach(ghost => {
        let targetX = pacman.x;
        let targetY = pacman.y;

        // Lógicas de alvo variadas para evitar sobreposição total
        if (ghost.behavior === "ambush") {
            // Tenta mirar à frente da posição do Pac-Man
            if (pacman.direction === "right") targetX += 3;
            if (pacman.direction === "left") targetX -= 3;
            if (pacman.direction === "up") targetY -= 3;
            if (pacman.direction === "down") targetY += 3;
        } else if (ghost.behavior === "flank") {
            // Flanqueia mirando no lado oposto do Pac-Man
            targetX = pacman.x + (pacman.x - ghosts[0].x);
            targetY = pacman.y + (pacman.y - ghosts[0].y);
        } else if (ghost.behavior === "patrol") {
            // Caso esteja perto demais, ele recua ligeiramente para um ponto aleatório
            let dist = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);
            if (dist < 4) {
                targetX = 1;
                targetY = 1;
            }
        }

        // Determina direção para movimentação e orientação dos olhos
        let dx = targetX - ghost.x;
        let dy = targetY - ghost.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            ghost.direction = dx > 0 ? "right" : "left";
        } else {
            ghost.direction = dy > 0 ? "down" : "up";
        }

        // Movimentação contínua atravessando paredes com a velocidade própria
        if (ghost.x < targetX) ghost.x += ghost.speed;
        if (ghost.x > targetX) ghost.x -= ghost.speed;
        if (ghost.y < targetY) ghost.y += ghost.speed;
        if (ghost.y > targetY) ghost.y -= ghost.speed;
    });
}

function canMove(x, y) {
    let gridX = Math.floor(x + 0.5);
    let gridY = Math.floor(y + 0.5);
    return map[gridY] && map[gridY][gridX] !== 1;
}

function updatePacman() {
    if (fim) return;
    let newX = pacman.x;
    let newY = pacman.y;

    if (pacman.direction === "right" && canMove(pacman.x + speed, pacman.y)) newX += speed;
    if (pacman.direction === "left" && canMove(pacman.x - speed, pacman.y)) newX -= speed;
    if (pacman.direction === "up" && canMove(pacman.x, pacman.y - speed)) newY -= speed;
    if (pacman.direction === "down" && canMove(pacman.x, pacman.y + speed)) newY += speed;

    pacman.x = newX;
    pacman.y = newY;

    let gridX = Math.floor(pacman.x + 0.5);
    let gridY = Math.floor(pacman.y + 0.5);
    if (map[gridY] && map[gridY][gridX] === 2) {
        map[gridY][gridX] = 0;
        score += 10;
        scoreDisplay.textContent = "Score: " + score;
        playCollectSound();
        checkWin();
    }
}

function checkWin() {
    if (!map.flat().includes(2)) {
        winScreen.style.display = "block";
        fim = true;
    }
}

function checkCollision() {
    ghosts.forEach(ghost => {
        let dx = pacman.x * gridSize + gridSize / 2 - ghost.x * gridSize - gridSize / 2;
        let dy = pacman.y * gridSize + gridSize / 2 - ghost.y * gridSize - gridSize / 2;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pacman.radius + ghost.radius - 5) {
            gameOver();
        }
    });
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    gameOverScreen.style.display = "block";
    fim = true;
}

function restartGame() {
    location.reload();
}

function gameLoop() {
    if (fim) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    updatePacman();
    moveGhosts();
    drawPacman();
    drawGhosts();
    checkCollision();
    requestAnimationFrame(gameLoop);
}

gameLoop();
