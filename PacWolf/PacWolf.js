const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

const tileSize = 20; 
let score = 0;
let lives = 3;
let gameOver = false;
let gameWon = false;
let powerUpActive = false;
let powerUpTimer = null;
let totalQueijos = 0;

// Mapa do Labirinto
// 1 = Parede, 0 = Ponto, 2 = Vazio, 3 = Power-Up
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,3,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,2,1,1,1,2,2,1,1,1,2,1,1,0,1,1,1,1,1,1],
    [2,2,2,2,2,2,0,2,2,2,1,3,2,2,2,2,3,1,2,2,2,0,2,2,2,2,2,2],
    [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,1,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1,1,0,0,0,1],
    [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function drawMap() {
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] === 1) {
                ctx.fillStyle = '#2e7d32'; 
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            } else if (map[r][c] === 0) {
                ctx.beginPath();
                ctx.arc(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#ffb300'; 
                ctx.fill();
                ctx.closePath();
            } else if (map[r][c] === 3) {
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                const centerX = c * tileSize + tileSize / 2;
                const centerY = r * tileSize + tileSize / 2;
                ctx.moveTo(centerX - 6, centerY + 6);
                ctx.lineTo(centerX + 6, centerY + 6);
                ctx.lineTo(centerX, centerY - 7);
                ctx.closePath();
                ctx.fill();
                
                // Furinhos do queijo
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(centerX - 2, centerY + 2, 2, 2);
                ctx.fillRect(centerX + 2, centerY + 3, 1.5, 1.5);
            }
        }
    }
}

function isWall(col, row) {
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
        return true;
    }
    return map[row][col] === 1;
}


function contarQueijos() {
    totalQueijos = 0;
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] === 0 || map[r][c] === 3) {
                totalQueijos++;
            }
        }
    }
}
// Chame a função imediatamente para inicializar o valor
contarQueijos();

// Lobo
const wolf = {
    x: 14 * tileSize + tileSize / 2, 
    y: 16 * tileSize + tileSize / 2, 
    radius: 8,
    speed: 2, 
    dirX: 0,
    dirY: 0,
    nextDirX: 0,
    nextDirY: 0
};

function drawWolf() {
    ctx.beginPath();
    ctx.arc(wolf.x, wolf.y, wolf.radius, 0, Math.PI * 2);
    ctx.fillStyle = powerUpActive ? '#ffff00' : '#90a4ae'; // <-- Alterado
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = powerUpActive ? '#ffcc00' : '#546e7a'; // <-- Alterado
    ctx.fillRect(wolf.x - 7, wolf.y - 11, 4, 5); 
    ctx.fillRect(wolf.x + 3, wolf.y - 11, 4, 5); 
}

function updateWolfPosition() {
    const mapWidthInPixels = map[0].length * tileSize;

    if (wolf.x < 0) {
        wolf.x = mapWidthInPixels - tileSize / 2;
    } else if (wolf.x > mapWidthInPixels) {
        wolf.x = tileSize / 2;
    }

    const currentCol = Math.floor(wolf.x / tileSize);
    const currentRow = Math.floor(wolf.y / tileSize);

    if (currentCol === 0 || currentCol === map[0].length - 1) {
        wolf.x += wolf.dirX * wolf.speed;
        wolf.y += wolf.dirY * wolf.speed;
        return; 
    }

    const isCenteredX = (wolf.x === currentCol * tileSize + tileSize / 2);
    const isCenteredY = (wolf.y === currentRow * tileSize + tileSize / 2);

    if (isCenteredX && isCenteredY) {
        if (map[currentRow] && map[currentRow][currentCol] === 0) {
            map[currentRow][currentCol] = 2; 
            score += 10;
            scoreEl.innerText = score;
            totalQueijos--;
        } else if (map[currentRow] && map[currentRow][currentCol] === 3) {
            map[currentRow][currentCol] = 2; 
            score += 50;
            scoreEl.innerText = score;
            activatePowerUp();
            totalQueijos--;
        }

        if (totalQueijos === 0) {
            gameWon = true;
        }

        if (!isWall(currentCol + wolf.nextDirX, currentRow + wolf.nextDirY)) {
            wolf.dirX = wolf.nextDirX;
            wolf.dirY = wolf.nextDirY;
        } else if (isWall(currentCol + wolf.dirX, currentRow + wolf.dirY)) {
            wolf.dirX = 0;
            wolf.dirY = 0;
        }
    }

    wolf.x += wolf.dirX * wolf.speed;
    wolf.y += wolf.dirY * wolf.speed;
}


// Caçadores
const hunters = [
    { x: 13 * tileSize + tileSize / 2, y: 8 * tileSize + tileSize / 2, normalcolor: '#00acc1', preycolor: '#341ff7', dirX: 0, dirY: -1, speed: 2, isDead: false, justSpawned: false},
    { x: 14 * tileSize + tileSize / 2, y: 8 * tileSize + tileSize / 2, normalcolor: '#e53935', preycolor: '#372d8a',dirX: 1, dirY: 0,  speed: 2, isDead: false, justSpawned: false},
    { x: 13 * tileSize + tileSize / 2, y: 10 * tileSize + tileSize / 2, normalcolor: '#ffb300', preycolor: '#5e4fe6', dirX: -1, dirY: 0, speed: 2, isDead: false, justSpawned: false},
    { x: 14 * tileSize + tileSize / 2, y: 10 * tileSize + tileSize / 2, normalcolor: '#ff00dd', preycolor: '#4d3fcc', dirX: -1, dirY: 0, speed: 2, isDead: false, justSpawned: false}
];

function drawHunters() {
    hunters.forEach(hunter => {
        // Corpo do caçador
        if(!hunter.isDead) {
            ctx.beginPath();
            ctx.arc(hunter.x, hunter.y, 8, Math.PI, 0, false);
            ctx.lineTo(hunter.x + 8, hunter.y + 9);
            ctx.lineTo(hunter.x - 8, hunter.y + 9);
            ctx.fillStyle = (powerUpActive && !hunter.justSpawned) ? hunter.preycolor : hunter.normalcolor;
            ctx.fill();
            ctx.closePath();
        }

        // Olhos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hunter.x - 4, hunter.y - 3, 3, 3);
        ctx.fillRect(hunter.x + 2, hunter.y - 3, 3, 3);
    });
}

function updateHuntersPosition() {
    hunters.forEach(hunter => {
        const currentCol = Math.floor(hunter.x / tileSize);
        const currentRow = Math.floor(hunter.y / tileSize);

        const isCenteredX = (hunter.x === currentCol * tileSize + tileSize / 2);
        const isCenteredY = (hunter.y === currentRow * tileSize + tileSize / 2);

        if (isCenteredX && isCenteredY) {
            if (!powerUpActive && !hunter.isDead && hunter.speed === 1) {
                hunter.speed = 2;
            }

            if (hunter.isDead && currentRow >= 8 && currentRow <= 13 && currentCol >= 10 && currentCol <= 17) {
                hunter.isOpposite = true;
                hunter.speed = 2;
            }

            const directions = [
                { x: 0, y: -1 }, // Cima
                { x: 0, y: 1 },  // Baixo
                { x: -1, y: 0 }, // Esquerda
                { x: 1, y: 0 }   // Direita
            ];

            const validDirections = directions.filter(dir => {
                const isOpposite = (dir.x === -hunter.dirX && dir.y === -hunter.dirY);
                return !isWall(currentCol + dir.x, currentRow + dir.y) && (!isOpposite || directions.length === 1);
            });

            if (validDirections.length > 0) {
                // Escolha aleatória inteligente baseada apenas em caminhos reais
                const chosenDir = validDirections[Math.floor(Math.random() * validDirections.length)];
                hunter.dirX = chosenDir.x;
                hunter.dirY = chosenDir.y;
            } else {
                // Se ficar sem saída por algum motivo, força a inversão
                hunter.dirX = -hunter.dirX;
                hunter.dirY = -hunter.dirY;
            }
        }

        hunter.x += hunter.dirX * hunter.speed;
        hunter.y += hunter.dirY * hunter.speed;

        // Teletransporte nos corredores laterais para os caçadores
        const mapWidthInPixels = map[0].length * tileSize;
        if (hunter.x < 0) hunter.x = mapWidthInPixels - tileSize / 2;
        if (hunter.x > mapWidthInPixels) hunter.x = tileSize / 2;
    });
}


// Funções de Gameplay
function checkCollisions() {
    hunters.forEach(hunter => {
        const dist = Math.hypot(wolf.x - hunter.x, wolf.y - hunter.y);
        
        if (dist < 12) {
            if (powerUpActive && !hunter.isDead && !hunter.justSpawned) {
                score += 200; 
                scoreEl.innerText = score;
                
                // Envia o caçador de volta para a jaula
                hunter.isDead = true;
                hunter.x = 14 * tileSize + tileSize / 2;
                hunter.y = 10 * tileSize + tileSize / 2;
                hunter.dirX = 0; hunter.dirY = -1;
                hunter.speed = 2;
            } 
            else if(!powerUpActive && !hunter.justSpawned) {
                lives--;
                if (lives <= 0) {
                    livesEl.innerText = "Fim de Jogo!";
                    gameOver = true;
                } else {
                    livesEl.innerText = "🐺 ".repeat(lives);
                    resetPositions();
                }
            }
        }
    });
}

function resetPositions() {
    wolf.x = 14 * tileSize + tileSize / 2;
    wolf.y = 16 * tileSize + tileSize / 2;
    wolf.dirX = 0; wolf.dirY = 0;
    wolf.nextDirX = 0; wolf.nextDirY = 0;

    hunters[0].x = 13 * tileSize + tileSize / 2; hunters[0].y = 8 * tileSize + tileSize / 2;
    hunters[1].x = 14 * tileSize + tileSize / 2; hunters[1].y = 8 * tileSize + tileSize / 2;
    hunters[2].x = 13 * tileSize + tileSize / 2; hunters[2].y = 10 * tileSize + tileSize / 2;
    hunters[3].x = 14 * tileSize + tileSize / 2; hunters[3].y = 10 * tileSize + tileSize / 2;
    
    hunters.forEach(h => { h.dirX = 0; h.dirY = -1; });

    powerUpActive = false;
    if (powerUpTimer) clearTimeout(powerUpTimer);

    hunters.forEach(h => { 
        h.speed = 2;
        h.dirX = 0; 
        h.dirY = -1; 
        h.isDead = false;
        h.justSpawned = false;
    });
}

function activatePowerUp() {
    powerUpActive = true;
    
    if (powerUpTimer) clearTimeout(powerUpTimer);

    // Caçadores ficam em pânico
    hunters.forEach(hunter => {
        if(!hunter.isDead) {
            hunter.speed = 1;         // Ficam mais lentos
        }
    });

    // Termina o efeito após 7 segundos
    powerUpTimer = setTimeout(() => {
        powerUpActive = false;
        hunters.forEach(hunter => {
            hunter.justSpawned = false;
                if (hunter.isDead) hunter.isDead = false;
        });

    }, 7000);
}

window.addEventListener('keydown', (e) => {
    if (gameOver || gameWon) return;
    switch (e.key) {
        case 'ArrowUp':    wolf.nextDirX =  0; wolf.nextDirY = -1; break;
        case 'ArrowDown':  wolf.nextDirX =  0; wolf.nextDirY =  1; break;
        case 'ArrowLeft':  wolf.nextDirX = -1; wolf.nextDirY =  0; break;
        case 'ArrowRight': wolf.nextDirX =  1; wolf.nextDirY =  0; break;
    }
});

function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CAÇADO!', canvas.width / 2, canvas.height / 2);
        return;
    }

    if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00e013'; // Amarelo queijo!
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPASTE!', canvas.width / 2, canvas.height / 2);
        ctx.font = '18px Arial';
        ctx.fillText(`Pontuação Final: ${score}`, canvas.width / 2, (canvas.height / 2) + 40);
        localStorage.setItem("UserScore", score);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateWolfPosition();
    updateHuntersPosition();
    checkCollisions();

    drawMap();
    drawWolf();
    drawHunters();
    
    requestAnimationFrame(gameLoop);
}

gameLoop();