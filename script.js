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
let fim = false; // Variável alterada de gameOver para fim

// 🎵 Carrega os áudios
const backgroundMusic = new Audio("audio/fundo.mp3");
const collectSound = new Audio("audio/eat.mp3");

// 🎶 Configura a música de fundo
backgroundMusic.loop = true; // Faz a música tocar repetidamente
backgroundMusic.volume = 0.5; // Ajusta o volume

// 🎵 Toca a música de fundo automaticamente ao carregar a página
window.addEventListener("load", () => {
    backgroundMusic.play().catch(error => console.log("Autoplay bloqueado pelo navegador:", error));
});

document.getElementById("playMusic").addEventListener("click", () => {
    backgroundMusic.play();
    document.getElementById("playMusic").style.display = "none"; // Esconde o botão após ativação
});


// 🎯 Função para tocar o som quando Pac-Man pega uma bolinha laranja
function playCollectSound() {
    collectSound.currentTime = 0; // Reseta o tempo para evitar delay
    collectSound.play();
}


let pacman = { x: 1, y: 1, radius: 15, direction: "right" };

const ghosts = [
    { x: 5, y: 5, radius: 15, direction: "right", color: "red" },
    { x: 10, y: 15, radius: 15, direction: "left", color: "pink" },
    { x: 15, y: 5, radius: 15, direction: "up", color: "orange" },
    { x: 20, y: 10, radius: 15, direction: "up", color: "aqua" }
];



const map = Array(rows).fill(null).map((_, row) =>
    Array(cols).fill(null).map((_, col) =>
        (row === 0 || row === rows - 1 || col === 0 || col === cols - 1 || (row === 1 && col === 1)) ? 1 : (Math.random() > 0.8 ? 1 : (Math.random() > 0.9 ? 2 : 0))
    )
);

// Garante que a posição inicial do Pac-Man (1, 1) seja livre
map[1][1] = 0; // Garante que o Pac-Man não apareça em cima de um obstáculo

// Função para verificar se uma célula é acessível
function isAccessible(x, y) {
    return map[y] && map[y][x] !== 1; // Checa se a célula não é um obstáculo
}

// Algoritmo para buscar todas as células acessíveis a partir da posição inicial
function getAccessibleCells() {
    let accessibleCells = [];
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));

    // Busca em Largura (BFS) para encontrar células acessíveis
    let queue = [[1, 1]]; // Começando do Pac-Man
    visited[1][1] = true;

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // Direções: direita, baixo, esquerda, cima

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

// Função para gerar bolinhas laranjas (pontos) nas células acessíveis
function generateOranges() {
    const accessibleCells = getAccessibleCells();
    let orangeCount = Math.floor((rows * cols) * 0.2); // 20% das células acessíveis terão bolinhas laranjas

    while (orangeCount > 0) {
        let [x, y] = accessibleCells[Math.floor(Math.random() * accessibleCells.length)];

        // Verifica se já não existe uma bolinha laranja nessa posição
        if (map[y][x] === 0) {
            map[y][x] = 2; // Coloca a bolinha laranja
            orangeCount--;
        }
    }
}

// Gerar bolinhas laranjas nas células acessíveis
generateOranges();


document.addEventListener("keydown", (event) => {
    if (fim) return;  // Impede qualquer movimento se o jogo tiver acabado
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

function drawGhosts() {
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x * gridSize + gridSize / 2, ghost.y * gridSize + gridSize / 2, ghost.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function moveGhosts() {
    if (fim) return;
    ghosts.forEach(ghost => {
        let pacmanX = pacman.x;
        let pacmanY = pacman.y;

        // Calcular a direção do fantasma em direção ao Pac-Man
        if (pacmanX > ghost.x) ghost.x += 0.01; // Move para a direita
        if (pacmanX < ghost.x) ghost.x -= 0.01; // Move para a esquerda
        if (pacmanY > ghost.y) ghost.y += 0.01; // Move para baixo
        if (pacmanY < ghost.y) ghost.y -= 0.01; // Move para cima
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
    if (map[gridY][gridX] === 2) {
        map[gridY][gridX] = 0;
        score += 10;
        scoreDisplay.textContent = "Score: " + score;
        playCollectSound(); // 🔊 Toca o som da bolinha laranja
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

        if (distance < pacman.radius + ghost.radius) {
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

// Função para verificar se o jogo acabou e parar o loop de animação
function gameLoop() {
    if (fim) return; // Impede que o jogo continue se estiver no estado de fim
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    updatePacman();  // Atualiza o Pac-Man
    moveGhosts();    // Move os fantasmas
    drawPacman();    // Desenha o Pac-Man
    drawGhosts();    // Desenha os fantasmas
    checkCollision(); // Verifica colisões
    requestAnimationFrame(gameLoop);  // Continua o loop de animação
}


gameLoop();