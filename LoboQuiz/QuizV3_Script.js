const baseQuestions = [
    {q:"Nome científico do lobo-ibérico?",a:["Canis lupus signatus","Canis familiaris","Canis lupus arctos","Canis aureus"],c:0},
    {q:"Onde vive mais in Portugal?",a:["Algarve","Norte","Lisboa","Madeira"],c:1},
    {q:"Grupo de lobos chama-se?",a:["Rebanho","Alcateia","Bando","Colónia"],c:1},
    {q:"Principal presa?",a:["Girafa","Javali","Pinguim","Tubarão"],c:1},
    {q:"O lobo é?",a:["Herbívoro","Carnívoro","Omnívoro","Insetívoro"],c:1},
    {q:"Comunicação principal?",a:["Uivo","Assobio","Canto","Riso"],c:0},
    {q:"Sentido mais forte?",a:["Visão","Olfato","Tato","Audição"],c:1},
    {q:"Velocidade máxima?",a:["20","35","50","80"],c:2},
    {q:"Quem cuida das crias?",a:["Só mãe","Só pai","Alcateia","Ninguém"],c:2},
    {q:"Habitat?",a:["Deserto","Florestas","Oceano","Cidade"],c:1},
    {q:"Qual o estado de conservação do lobo-ibérico em Portugal?",a:["Pouco preocupante","Extinto","Em perigo","Doméstico"],c:2},
    {q:"Em que países existe o lobo-ibérico?",a:["Portugal e Espanha","França e Itália","Alemanha e Polónia","Portugal e Marrocos"],c:0},
    {q:"Qual é uma das principais ameaças ao lobo-ibérico?",a:["Falta de água","Perseguição humana e perda de habitat","Excesso de alimento","Frio excessivo no verão"],c:1},
    {q:"Qual é a esperança média de vida do lobo na natureza?",a:["2-4 anos","8-12 anos","15-20 anos","25-30 anos"],c:1},
    {q:"Qual é o peso aproximado de um lobo-ibérico adulto?",a:["5-10 kg","15-20 kg","25-40 kg","60-80 kg"],c:2},
    {q:"Quanto tempo dura a gestação da fêmea do lobo?",a:["30 dias","63 dias","100 dias","150 dias"],c:1},
    {q:"Como os lobos marcam o território?",a:["Com uivos apenas","Com arranhões no chão","Com urina e cheiro","Com pedras"],c:2},
    {q:"O lobo-ibérico é mais ativo durante:",a:["O dia","A noite","Apenas ao meio-dia","Nunca sai da toca"],c:1},
    {q:"Qual é o tamanho típico de uma alcateia?",a:["1-2 lobos","3-8 lobos","20-30 lobos","Mais de 100 lobos"],c:1},
    {q:"Quantos dentes tem um lobo adulto aproximadamente?",a:["20","30","42","60"],c:2}
];

let questions = [];
let i = 0;
let score = 0;
let streak = 0;
let correct = 0;
let wrong = 0;

let time = 15;
let interval;
let locked = false;

window.onload = function() {
    updateBestScore();
};

/* 🔥 SAFE AUDIO GET */
function safeAudio(id){
    const el = document.getElementById(id);
    if(!el){
        console.warn("Áudio não encontrado:", id);
        return null;
    }
    return el;
}

function startGame(){
    i = 0;
    score = 0;
    streak = 0;
    correct = 0;
    wrong = 0;

    document.getElementById("score").innerText = 0;
    document.getElementById("streak").innerText = 0;
    document.getElementById("progress").style.width = "0%";

    questions = [...baseQuestions].sort(() => Math.random() - 0.5);

    switchScreen("quizScreen");
    loadQuestion();
}

function updateBestScore(){
    let best = localStorage.getItem("bestScore") || 0;
    const bestScoreBox = document.getElementById("bestScore");
    if(bestScoreBox) {
        bestScoreBox.innerText = "🏆 Melhor pontuação nesta máquina: " + best;
    }
}

function switchScreen(id){
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function loadQuestion(){
    if(i >= questions.length) return endGame();

    locked = false;

    let q = questions[i];
    document.getElementById("question").innerText = q.q;
    document.getElementById("progressText").innerText = `Pergunta ${i+1} de ${questions.length}`;

    let buttons = document.querySelectorAll(".ans");

    if(buttons.length < 4){
        console.error("ERRO: precisas de 4 botões com class .ans no HTML");
        return;
    }

    let order = [0,1,2,3].sort(() => Math.random() - 0.5);

    order.forEach((val, idx) => {
        let b = buttons[idx];
        if(!b) return;

        b.innerText = q.a[val];
        b.dataset.correct = (val === q.c).toString();
        b.classList.remove("correct", "wrong");
        b.onclick = () => answer(idx);
    });

    time = 15;
    document.getElementById("time").innerText = time;

    clearInterval(interval);
    interval = setInterval(timer, 1000);

    document.getElementById("progress").style.width = (i / questions.length) * 100 + "%";
}

function timer(){
    if(locked) return;

    time--;
    document.getElementById("time").innerText = time;

    if(time <= 0){
        answer(-1);
        return;
    }

    if(time <= 5){
        const tick = safeAudio("tickSound");
        if(tick && tick.paused){
            tick.currentTime = 0;
            tick.play().catch(()=>{});
        }
    }
}

function answer(idx){
    if(locked) return;

    locked = true;
    clearInterval(interval);

    let buttons = document.querySelectorAll(".ans");
    let chosen = idx >= 0 ? buttons[idx] : null;

    buttons.forEach(b => {
        if(b.dataset.correct === "true"){
            b.classList.add("correct");
        }
    });

    if(idx === -1){
        wrong++;
        streak = 0;
        safeAudio("wrongSound")?.play().catch(()=>{});
    } else if(chosen && chosen.dataset.correct === "true"){
        chosen.classList.add("correct");
        correct++;
        streak++;
        score += 100 + (streak * 20);
        safeAudio("okSound")?.play().catch(()=>{});
    } else {
        if(chosen) chosen.classList.add("wrong");
        wrong++;
        streak = 0;
        safeAudio("wrongSound")?.play().catch(()=>{});
    }

    document.getElementById("score").innerText = score;
    document.getElementById("streak").innerText = streak;

    setTimeout(() => {
        i++;
        if(i < questions.length) {
            document.getElementById("progress").style.width = (i / questions.length) * 100 + "%";
        }
        loadQuestion();
    }, 1200);
}

function endGame(){
    let percent = Math.round((correct / questions.length) * 100);
    let rank = "";

    if(score >= 5000) rank = "🐺👑 Mestre dos Lobos";
    else if(score >= 3500) rank = "🥇 Caçador Experiente";
    else if(score >= 1500) rank = "🥈 Explorador";
    else rank = "🥉 Iniciante";

    // Guarda o recorde local da máquina
    let best = parseInt(localStorage.getItem("bestScore")) || 0;
    if(score > best) localStorage.setItem("bestScore", score);

    // 🔥 NOVIDADE: Guarda a pontuação na sessão para o teu script de certificados ler noutra janela
    sessionStorage.setItem("quizScore", score);

    document.getElementById("finalStats").innerHTML = `
        Pontuação Final: ${score}<br>
        Acertos: ${correct}<br>
        Erros: ${wrong}<br>
        Precisão: ${percent}%
    `;

    document.getElementById("rank").innerText = rank;
    switchScreen("endScreen");
}

function goBackToGames(){
    window.location.href = "../Jogos.html";
}