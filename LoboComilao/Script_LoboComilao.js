/* ====== CONFIGURAÇÃO DE DIRETÓRIOS DE IMAGENS ====== */
const IMAGE_CONFIG = {
    carne1: "Imagens_LoboComilão/Bife_Carne.png",
    carne2: "Imagens_LoboComilão/Coxa_Frango.png",
    carne3: "Imagens_LoboComilão/Peça_Carne.png",
    cookie: "Imagens_LoboComilão/Cookie.png",
    choco: "Imagens_LoboComilão/Choco.png",
    vidaxtra: "Imagens_LoboComilão/Golden_Heart.png",
    lives: "Imagens_LoboComilão/Curaçao.png"
};

// Função auxiliar para injetar tags HTML de imagens dinamicamente
function getImageHTML(type) {
    return `<img src="${IMAGE_CONFIG[type]}" alt="${type}">`;
}

/* ====== MAPEAMENTO DE ELEMENTOS DO DOM ====== */
const gameArea = document.getElementById("jogoArea");
const wolf = document.getElementById("lobo");
const scoreDisplay = document.getElementById("scoreValue");
const livesDisplay = document.getElementById("livesContainer");

/* ====== VARIÁVEIS DE ESTADO GLOBAL ====== */
let running = false;          // Define se o motor de jogo está ativo ou parado
let animationId;              // Guarda a ID da animação de frames (requestAnimationFrame)
let score = 0;                // Pontuação do utilizador
let lives = 3;                // Quantidade de vidas atuais
let combo = 0;                // Quantidade de comidas apanhadas seguidas
let playerName = "";          // Nome do utilizador atual
let bgMusic;                  // Armazenará a instância do áudio de fundo (música de início)

/* ====== PARÂMETROS DE FÍSICA E TIMINGS ====== */
let fallSpeed = 3;            // Velocidade vertical inicial com que os itens caem
let spawnRate = 900;          // Intervalo de tempo (ms) entre a criação de cada item
let wolfX = 365;              // Posição X horizontal inicial do lobo
let wolfSpeed = 8;            // Velocidade de deslocação do lobo através do teclado
let lastSpawnX = -100;        // Guarda o X do último item criado para evitar sobreposição imediata
let lastSpawnTime = 0;        // Timestamp do último item gerado
let difficultyScaleTime = 0;  // Contador de tempo para aumentar progressivamente a dificuldade
let activeItems = [];         // Array com os objetos de todos os itens atualmente em queda ativa

/* ====== SISTEMA DE CAPTURA DE TECLADO (SUAVE) ====== */
// Dicionário com estados das teclas. Permite carregar em duas ao mesmo tempo suavemente.
let keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };

// Ativa o estado da tecla para "true" quando pressionada
document.addEventListener("keydown", (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
// Desativa o estado da tecla para "false" quando largada
document.addEventListener("keyup", (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

/* ====== CONTROLO VIA RATO / TRACKPAD ====== */
document.addEventListener("mousemove", (e) => {
    if(!running) return; // Só calcula o movimento se o jogo estiver a decorrer
    let r = gameArea.getBoundingClientRect(); // Obtém os limites absolutos da caixa de jogo no ecrã
    let newX = e.clientX - r.left - 35; // Calcula o centro do rato face à div do jogo
    wolfX = Math.max(0, Math.min(800 - 70, newX)); // Trava o lobo dentro dos limites (0 a 730px)
});

/* ====== GESTÃO DE ARMAZENAMENTO LOCAL (LOCALSTORAGE) E RANKINGS ====== */
// Carrega o recorde absoluto guardado no navegador do utilizador
document.getElementById("record").innerHTML = 'Recorde: ' + (localStorage.getItem("record_lobo") || 0);

// Vai buscar os dados brutos JSON, converte em array, ordena de forma decrescente e extrai os 5 melhores
function loadRankings() {
    return JSON.parse(localStorage.getItem("rankings_lobo") || "[]").sort((a, b) => b.score - a.score).slice(0, 5);
}

// Guarda uma nova linha de recorde no histórico do navegador
function saveRanking(name, score) {
    let rankings = JSON.parse(localStorage.getItem("rankings_lobo") || "[]");
    rankings.push({name, score, date: new Date().toLocaleDateString()}); // Adiciona nome, pontos e data atual
    localStorage.setItem("rankings_lobo", JSON.stringify(rankings));
}

// Gera e atualiza a estrutura HTML das tabelas de classificação (no menu e no game over)
function displayRankings() {
    let rankings = loadRankings();
    let tableHTML = "";
    
    rankings.forEach((rank, index) => {
        tableHTML += `
            <tr>
                <td style="color:#f1c40f; font-weight:bold; font-size:18px;">#${index + 1}</td>
                <td style="font-size:16px;">${rank.name}</td>
                <td style="text-align:right; font-weight:bold; font-size:18px; color:#2ecc71;">${rank.score}</td>
                <td style="color:#bdc3c7; font-size:12px;">${rank.date}</td>
            </tr>`;
    });

    let tableMenu = document.getElementById("rankingTable");
    let tableGameOver = document.getElementById("rankingTableGameOver");
    
    if(tableMenu) tableMenu.innerHTML = tableHTML;
    if(tableGameOver) tableGameOver.innerHTML = tableHTML;
}
// Executa a função imediatamente ao carregar a página para popular a tabela do menu
displayRankings();

// Força o reinício completo da aplicação limpando dados temporários
function restartGame() {
    location.reload();
}

/* ====== INICIALIZAÇÃO DO JOGO ====== */
function start(diff) {
    // Captura o nome inserido ou define um nome padrão se estiver vazio
    playerName = localStorage.getItem("nomeUsuario") || "Lobo Solitário";

    // Modifica os rácios de velocidade e surgimento baseado no botão escolhido
    if(diff === "easy") { fallSpeed = 3.5; spawnRate = 800; }
    if(diff === "medium") { fallSpeed = 5.5; spawnRate = 600; }
    if(diff === "hard") { fallSpeed = 8; spawnRate = 450; }

    // Altera a visibilidade das divisões do documento
    document.getElementById("menu").style.display = "none";
    gameArea.style.display = "block";
    document.getElementById("hud").style.display = "flex";

    updateLives(); // Desenha os corações iniciais
    running = true;
    
    // INSTANCIA E INICIA A REPRODUÇÃO DA MÚSICA DE INÍCIO DO JOGO EM LOOP
    bgMusic = new Audio("Audio_LoboComilao/Musica_Fundo.mp3");
    bgMusic.loop = true;
    bgMusic.play().catch(e => console.log("Áudio pendente de interação do utilizador:", e));

    // Captura os tempos iniciais de alta precisão do processador
    lastSpawnTime = performance.now();
    difficultyScaleTime = performance.now();
    
    // Inicia o loop infinito de processamento de quadros por segundo (FPS)
    requestAnimationFrame(gameLoop);
}

/* ====== LOOP DE JOGO PRINCIPAL (CORRE A ~60FPS) ====== */
function gameLoop(timestamp) {
    if (!running) return; // Trava imediata caso o jogo seja interrompido ou dê game over

    /* 1. Gestão dos Controlos de Teclado */
    if (keys.ArrowLeft || keys.a) wolfX -= wolfSpeed;
    if (keys.ArrowRight || keys.d) wolfX += wolfSpeed;
    wolfX = Math.max(0, Math.min(800 - 70, wolfX)); // Valida barreiras laterais
    wolf.style.left = wolfX + "px"; // Aplica a posição no CSS do elemento real

    /* 2. Escalonamento Automático de Dificuldade (A cada 3 segundos) */
    if (timestamp - difficultyScaleTime > 3000) {
        if (fallSpeed < 18) fallSpeed += 0.2; // Aumenta a velocidade de queda
        if (spawnRate > 200) spawnRate -= 15; // Encurta o tempo de espera entre spawns
        difficultyScaleTime = timestamp;     // Reinicia o cronómetro do ciclo
    }

    /* 3. Temporizador de Criação de Novos Itens */
    if (timestamp - lastSpawnTime > spawnRate) {
        spawnItem();
        lastSpawnTime = timestamp;
    }

    /* 4. Atualização de Posições, Remoção e Deteteção de Colisão de Itens */
    let wolfRect = wolf.getBoundingClientRect(); // Caixa geométrica do Lobo no ecrã
    
    // Percorre a lista de trás para a frente para evitar falhas de indexação ao remover elementos
    for (let i = activeItems.length - 1; i >= 0; i--) {
        let itemObj = activeItems[i];
        itemObj.y += fallSpeed; // Desloca o item para baixo baseado na velocidade atual
        itemObj.element.style.top = itemObj.y + "px"; // Atualiza a posição visual no CSS

        let itemRect = itemObj.element.getBoundingClientRect(); // Caixa geométrica do item cadente

        // Algoritmo de intersecção de caixas (AABB Collision) com margem (padding) de segurança
        let padding = 15; 
        if (itemRect.left + padding < wolfRect.right - padding && 
            itemRect.right - padding > wolfRect.left + padding && 
            itemRect.top + padding < wolfRect.bottom && 
            itemRect.bottom > wolfRect.top + padding) {
            
            handleCollision(itemObj.type); // Processa as consequências do contacto
            itemObj.element.remove();       // Apaga o elemento HTML do ecrã
            activeItems.splice(i, 1);       // Remove o objeto do array de monitorização
            continue;
        }

        // Se o item ultrapassar o limite vertical inferior da arena (600px)
        if (itemObj.y > 600) {
            itemObj.element.remove();
            activeItems.splice(i, 1);
        }
    }

    // Se o jogo continuar ativo, solicita ao navegador para executar esta função novamente no próximo frame do monitor
    if (running) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

/* ====== LÓGICA DE GERAÇÃO PROBABILÍSTICA (SPAWN) ====== */
function spawnItem() {
    let r = Math.random(); // Gera um decimal aleatório entre 0.0 e 1.0
    let type;
    
    // Separação de tabelas matemáticas estáveis para evitar bugs com o aumento de velocidade
    let isHard = fallSpeed >= 7;

    if (isHard) {
        // Distribuição avançada/difícil (mais perigos, menos comidas)
        if (r < 0.25) type = "carne1";        
        else if (r < 0.40) type = "carne2";   
        else if (r < 0.50) type = "carne3";   
        else if (r < 0.75) type = "cookie"; 
        else if (r < 0.95) type = "choco";   
        else type = "vidaxtra";                 
    } else {
        // Distribuição normal/inicial (mais amigável)
        if (r < 0.35) type = "carne1";        
        else if (r < 0.55) type = "carne2";   
        else if (r < 0.65) type = "carne3";   
        else if (r < 0.80) type = "cookie"; 
        else if (r < 0.95) type = "choco";   
        else type = "vidaxtra";                 
    }

    /* Algoritmo anti-aglomeração lateral */
    let newX;
    let attempts = 0;
    do {
        newX = Math.random() * (800 - 80); // Define um X aleatório descontando a largura do item
        attempts++;
    } while (Math.abs(newX - lastSpawnX) < 80 && attempts < 5); // Tenta até 5 vezes se nascer colado ao anterior
    
    lastSpawnX = newX;

    // Injeção do elemento físico no DOM da árvore HTML
    const itemEl = document.createElement("div");
    itemEl.classList.add("item");
    itemEl.innerHTML = getImageHTML(type);
    itemEl.style.left = newX + "px";
    itemEl.style.top = "-60px"; // Começa ligeiramente oculto acima da área visível

    gameArea.appendChild(itemEl); // Cola o novo item dentro da div do jogo

    // Guarda os dados de rastreio num objeto interno
    activeItems.push({
        element: itemEl,
        type: type,
        x: newX,
        y: -60
    });
}

/* ====== SISTEMA REGRAS E CONSEQUÊNCIAS DE COLISÃO ====== */
function handleCollision(type) {
    if(type === "cookie") {
        loseLife(1); // Perde 1 vida
        combo = 0;   // Perde o multiplicador de pontos
    }
    else if(type === "choco") {
        loseLife(2); // Perde 2 vidas de uma vez
        combo = 0;
    }
    else if(type === "vidaxtra") {
        lives++;     // Adiciona uma vida
        updateLives();
    }
    else {
        /* Lógica das Comidas Válidas */
        combo++;
        let points = 0;
        
        if(type === "carne1") points = 1;
        if(type === "carne2") points = 2;
        if(type === "carne3") points = 5;

        // Sistema de Multiplicadores Baseado no Combo
        if(combo >= 20) points *= 4;
        else if(combo >= 10) points *= 3;
        else if(combo >= 5) points *= 2;

        score += points;
        scoreDisplay.innerText = score; // Atualiza o texto dos pontos no HUD
        
        // Pequena animação/feedback visual rápido de ampliação no marcador numérico
        scoreDisplay.style.color = "#f1c40f";
        scoreDisplay.style.transform = "scale(1.3)";
        setTimeout(() => {
            scoreDisplay.style.color = "white";
            scoreDisplay.style.transform = "scale(1)";
        }, 150);
    }
}

/* ====== SISTEMA DE SUBTRAÇÃO E FEEDBACK DE VIDA ====== */
function loseLife(amount) {
    lives -= amount;
    updateLives(); // Redesenha os corações

    // CRIA E REPRODUZ INSTANTANEAMENTE O ÁUDIO DE DANO
    const soundDamage = new Audio("Audio_LoboComilao/Lobo_Dano.mp3");
    soundDamage.play().catch(e => console.log(e));

    // Altera temporariamente as cores das bordas da arena para dar um efeito de piscar vermelho
    gameArea.style.border = "4px solid #ff4757";
    gameArea.style.boxShadow = "0 0 40px rgba(255, 71, 87, 0.6)";
    
    // Retorna ao estilo normal após 250 milissegundos
    setTimeout(() => { 
        gameArea.style.border = "4px solid #2ecc71"; 
        gameArea.style.boxShadow = "0 15px 50px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.3)";
    }, 250);

    if (lives <= 0) gameOver(); // Gatilho de fim de jogo se as vidas chegarem a zero
}

// Atualiza o painel visual das vidas repetindo imagens de corações
function updateLives() {
    let html = "";
    for(let i = 0; i < Math.max(0, lives); i++) {
        html += `<img src="${IMAGE_CONFIG.lives}" style="width:1.2em; vertical-align:middle; margin-left:8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" onerror="this.style.display='none'">`;
    }
    livesDisplay.innerHTML = html;
}

/* ====== FINALIZAÇÃO E GAME OVER ====== */
function gameOver() {
    running = false; // Desativa o motor de jogo
    cancelAnimationFrame(animationId); // Quebra o ciclo de renderização pendente

    // INTERROMPE A MÚSICA DE FUNDO PRINCIPAL E REPRODUZ O ÁUDIO DE GAME OVER
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0; // Reseta a faixa para o início
    }
    const soundGameOver = new Audio("Audio_LoboComilao/Lobo_Uivo.mp3");
    soundGameOver.play().catch(e => console.log(e));

    // Varre e apaga todos os elementos cadentes remanescentes que ficaram congelados no ecrã
    activeItems.forEach(item => item.element.remove());
    activeItems = []; // Esvazia a lista

    // Compara a pontuação atual com a máxima guardada e atualiza o recorde se necessário
    if (score > (localStorage.getItem("record_lobo") || 0)) {
        localStorage.setItem("record_lobo", score);
    }

    saveRanking(playerName, score); // Regista no histórico local
    displayRankings();              // Força a atualização visual imediata das tabelas

    // Altera a visibilidade dos blocos HTML ocultando a ação e mostrando os resultados
    document.getElementById("jogoArea").style.display = "none";
    document.getElementById("hud").style.display = "none";
    document.getElementById("gameOver").style.display = "block";
    
    // Escreve a mensagem de pontuação final customizada
    document.getElementById("finalScore").innerHTML = `<b>${playerName}</b> fez <span style="color:#2ecc71;">${score}</span> pontos!`;
}

function goBackToGames(){
    window.location.href = "../Jogos.html";
}