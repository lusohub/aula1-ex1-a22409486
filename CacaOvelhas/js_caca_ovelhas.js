/* ===== CAÇA À OVELHA - PROGRESSIVE DIFFICULTY GAME ===== */
/* Game increases difficulty each level until it becomes impossible to solve */

/* ===== DOM REFERENCES ===== */
const menu = document.getElementById('menu');
const rankingTable = document.getElementById('rankingTable');
const rankingTableGameOver = document.getElementById('rankingTableGameOver');
const recordEl = document.getElementById('record');
const hud = document.getElementById('hud');
const levelDisplay = document.getElementById('levelDisplay');
const movesDisplay = document.getElementById('movesDisplay');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const newMapBtn = document.getElementById('newMapBtn');
const resetBtn = document.getElementById('resetBtn');
const resetRecordsBtn = document.getElementById('resetRecordsBtn');

const boardWrapper = document.getElementById('board-wrapper');
const nodesContainer = document.getElementById('nodes');
const edgesSvg = document.getElementById('edges');
const wolfEl = document.getElementById('wolf');
const sheepEl = document.getElementById('sheep');
const cabbageEl = document.getElementById('cabbage');
const status = document.getElementById('status');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');

const STORAGE_KEY = 'cacaOvelha_records_v1';

const imgPaths = {
  wolf: 'imagens caça/lobo.png',
  sheep: 'imagens caça/ovelha.png',
  cabbage: 'imagens caça/repolho.png'
};
const pieceFallback = { wolf: '🐺', sheep: '🐑', cabbage: '🥬' };
const availableImages = { wolf: false, sheep: false, cabbage: false };


function playSound(soundKey) {
  try {
    const sound = new Audio(audioPaths[soundKey] || '');
    sound.volume = 0.3;
    sound.play().catch(e => console.log('Audio:', e));
  } catch(e) { console.log('Audio error:', e); }
}

/* ---------------- State & params ---------------- */
let nodes = [], wolfPos=0, sheepPos=0, cabbagePos=0;
let level = 1, moves = 0, gameOver = false;
const baseNodes = 6, maxNodes = 24, nodesPerLevel = 2;
const minPathBase = 4, minPathIncreaseEvery = 2, sheepStepEvery = 3;
const nodeRetries = 500, graphRetries = 15, minNodeSpacing = 7;

let combo = 0, bestCombo = 0;
let playerName = 'Jogador';
let mouseX = 0, mouseY = 0;
let mouseTrackingActive = false;

/* ---------------- Ranking ---------------- */
function loadRanking(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function addRankingEntry(name, levelVal, movesVal){
  const arr = loadRanking();
  arr.push({name, level: levelVal, moves: movesVal, combo: combo, date: new Date().toLocaleString()});
  arr.sort((a,b)=> b.level - a.level || a.moves - b.moves);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  renderRankingUI();
}
function renderRankingUI(){
  const arr = loadRanking().slice(0,5);
  let html = '';
  arr.forEach((r,i)=> html += `<tr><td style="color:#f1c40f;font-weight:bold">#${i+1}</td><td>${r.name}</td><td style="text-align:right;color:#2ecc71">${r.level}</td><td style="color:#ff66c4;font-size:11px">${r.combo || 0} combo</td><td style="color:#ccc;font-size:12px">${r.date}</td></tr>`);
  if (rankingTable) rankingTable.innerHTML = html;
  if (rankingTableGameOver) rankingTableGameOver.innerHTML = html;
  if (recordEl) recordEl.innerText = 'Melhor Nível: ' + (arr[0]?.level || 0);
  const best = arr[0]?.level || 0; const bestEl = document.getElementById('bestLevel'); if (bestEl) bestEl.textContent = best;
}
renderRankingUI();

/* ---------------- Image loader with fallback ---------------- */
function tryImage(src){ return new Promise(res=>{ const i=new Image(); i.onload=()=>res(true); i.onerror=()=>res(false); i.src=src; }); }
async function chooseImages(){
  availableImages.wolf = imgPaths.wolf ? await tryImage(imgPaths.wolf) : false;
  availableImages.sheep = imgPaths.sheep ? await tryImage(imgPaths.sheep) : false;
  availableImages.cabbage = imgPaths.cabbage ? await tryImage(imgPaths.cabbage) : false;

  if (availableImages.wolf) { wolfEl.src = imgPaths.wolf; wolfEl.style.display = 'block'; } else wolfEl.style.display = 'none';
  if (availableImages.sheep) { sheepEl.src = imgPaths.sheep; sheepEl.style.display = 'block'; } else sheepEl.style.display = 'none';
  if (availableImages.cabbage) { cabbageEl.src = imgPaths.cabbage; cabbageEl.style.display = 'block'; } else cabbageEl.style.display = 'none';
}

/* ===== START GAME ===== */
async function start(){
  const nameInput = localStorage.getItem('nomeUsuario');
  playerName = nameInput ? nameInput : 'Jogador';
  if (!playerName) playerName = 'Jogador';
  
  menu.style.display = 'none';
  hud.style.display = 'flex';
  document.getElementById('jogoArea').style.display = 'block';
  gameOverDiv.style.display = 'none';
  
  level = 1;
  moves = 0;
  gameOver = false;
  combo = 0;
  bestCombo = 0;
  levelDisplay.innerText = level;
  movesDisplay.innerText = moves;
  nextLevelBtn.disabled = true;
  mouseTrackingActive = true;
  
  await chooseImages();
  generateLevel(level);
}
window.start = start;

// Mouse tracking for smooth wolf movement
document.addEventListener('mousemove', (e) => {
  if (!mouseTrackingActive || gameOver) return;
  const rect = boardWrapper.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

/* ---------------- Generation with K constraint (same logic as before) ---------------- */
function generateLevel(lv){
  gameOver = false; moves = 0; movesDisplay.innerText = moves; combo = 0;
  nodesContainer.innerHTML = ''; edgesSvg.innerHTML = '';
  
  // Difficulty scaling - increases every level automatically
  const nodeCount = Math.min(maxNodes, baseNodes + (lv-1)*nodesPerLevel);
  let targetK = Math.max(2, minPathBase + Math.floor((lv-1)/minPathIncreaseEvery));
  const sheepSteps = 1 + Math.floor((lv-1)/sheepStepEvery);
  boardWrapper.dataset.sheepSteps = String(sheepSteps);
  
  // Progressive difficulty: 3% harder per level
  let difficultyFactor = 1.0 * (1 - (lv-1) * 0.03);
  difficultyFactor = Math.max(0.55, difficultyFactor);

  let ok=false, attempt=0;
  while(attempt < graphRetries && !ok){
    attempt++;
    nodes = placeNodesRandom(nodeCount, minNodeSpacing, nodeRetries);
    nodes.forEach(n => n.neighbors = []);
    const radius = computeConnectionRadiusForLevel(lv) * difficultyFactor;
    for (let i=0;i<nodes.length;i++){
      for (let j=i+1;j<nodes.length;j++){
        if (pointDistPct(nodes[i].x,nodes[i].y,nodes[j].x,nodes[j].y) <= radius){
          nodes[i].neighbors.push(nodes[j].id);
          nodes[j].neighbors.push(nodes[i].id);
        }
      }
    }
    ensureConnected(nodes);
    const ids = shuffle(nodes.map(n=>n.id));
    let found=false;
    for (let si=0; si<ids.length && !found; si++){
      for (let ci=0; ci<ids.length && !found; ci++){
        if (ids[si]===ids[ci]) continue;
        const path = bfsPath(ids[si], ids[ci]);
        if (path && path.length-1 >= targetK){
          sheepPos = ids[si]; cabbagePos = ids[ci];
          const others = ids.filter(id=> id!==sheepPos && id!==cabbagePos);
          wolfPos = others[0] ?? ids[0];
          found = true;
        }
      }
    }
    if (found) ok=true; else targetK = Math.max(1, targetK - 1);
  }

  if (!ok){
    // Level became impossible to solve!
    handleImpossible();
    return;
  }

  // render nodes and visuals
  renderNodes();
  setTimeout(()=> {
    redrawVisuals();
    updatePieces();
  }, 30);

  levelDisplay.innerText = lv;
  document.querySelectorAll('.platform').forEach(el => { el.classList.remove('locked'); el.onclick = onNodeClick; });
  nextLevelBtn.disabled = true;
  
  const sheepStepsText = sheepSteps === 1 ? 'passo' : 'passos';
  status.textContent = `📊 Nível ${lv} • 🐑 Ovelha move ${sheepSteps} ${sheepStepsText}/turno • 🎯 Clica em nós ligados para mover`;
  boardWrapper.style.animation = 'none';
  setTimeout(() => {
    boardWrapper.style.animation = 'levelPulse 0.6s ease-out';
  }, 10);
}
window.generateLevel = generateLevel;

/* ---------------- Graph helpers ---------------- */
function computeConnectionRadiusForLevel(lv){ const base = 28; const reduce = Math.floor((lv-1)/2) * 1.2; return Math.max(9, base - reduce); }

function placeNodesRandom(n, minSpacing, retries){
  const arr=[]; const padding=8; let attempts=0;
  while(arr.length < n && attempts < retries){
    attempts++;
    const x = randRange(padding,100-padding);
    const y = randRange(padding,100-padding);
    let ok=true;
    for (const p of arr) if (pointDistPct(x,y,p.x,p.y) < minSpacing){ ok=false; break; }
    if (ok) arr.push({id:arr.length, x:+x.toFixed(2), y:+y.toFixed(2)});
  }
  while(arr.length < n) arr.push({id:arr.length, x:randRange(12,88), y:randRange(12,88)});
  return arr;
}

function ensureConnected(nodesArr){
  const adj = {}; nodesArr.forEach(n => adj[n.id] = new Set(n.neighbors));
  const visited = new Set(); const components = [];
  for (const n of nodesArr) if (!visited.has(n.id)){
    const comp=[]; const q=[n.id]; visited.add(n.id);
    while(q.length){ const u=q.shift(); comp.push(u); for (const v of adj[u]) if (!visited.has(v)){ visited.add(v); q.push(v);} }
    components.push(comp);
  }
  while(components.length > 1){
    const c1 = components.shift();
    let best={d:Infinity,a:null,b:null}; const c2 = components[0];
    for (const id1 of c1){ const p1 = nodesArr[id1]; for (const id2 of c2){ const p2 = nodesArr[id2]; const d = pointDistPct(p1.x,p1.y,p2.x,p2.y); if (d < best.d){ best={d,a:id1,b:id2}; } } }
    nodesArr[best.a].neighbors.push(best.b); nodesArr[best.b].neighbors.push(best.a);
    adj[best.a].add(best.b); adj[best.b].add(best.a);
    visited.clear(); components.length=0;
    for (const n of nodesArr) if (!visited.has(n.id)){
      const comp=[]; const q=[n.id]; visited.add(n.id);
      while(q.length){ const u=q.shift(); comp.push(u); for (const v of adj[u]) if (!visited.has(v)){ visited.add(v); q.push(v);} }
      components.push(comp);
    }
  }
}

function bfsPath(start, goal){
  if (start === goal) return [start];
  const q = [[start]]; const visited = new Set([start]);
  while(q.length){
    const path = q.shift(); const node = path[path.length-1];
    if (node === goal) return path;
    const neigh = nodes.find(n=>n.id===node).neighbors;
    for (const nb of neigh) if (!visited.has(nb)){ visited.add(nb); q.push([...path, nb]); }
  }
  return null;
}

function bfsDistance(start, goal){
  const path = bfsPath(start, goal);
  return path ? path.length - 1 : Infinity;
}

function chooseSmartSheepMove(){
  const sheepNode = nodes.find(n => n.id === sheepPos);
  if (!sheepNode || sheepNode.neighbors.length === 0) return sheepPos;

  const candidates = sheepNode.neighbors
    .filter(id => id !== wolfPos)
    .map(id => {
      const node = nodes.find(n => n.id === id);
      const distanceToCabbage = bfsDistance(id, cabbagePos);
      const distanceToWolf = bfsDistance(id, wolfPos);
      const canBeCaughtNext = distanceToWolf <= 1;
      const reachesCabbage = id === cabbagePos;
      const escapeRoutes = node ? node.neighbors.filter(nb => nb !== wolfPos).length : 0;

      let score = 0;
      score -= distanceToCabbage * 8;
      score += distanceToWolf * 6;
      score += escapeRoutes * 2;
      if (canBeCaughtNext) score -= 35;
      if (reachesCabbage) score += 80;

      return { id, score, distanceToCabbage, distanceToWolf };
    });

  if (!candidates.length) return sheepNode.neighbors[0];

  candidates.sort((a, b) =>
    b.score - a.score ||
    b.distanceToWolf - a.distanceToWolf ||
    a.distanceToCabbage - b.distanceToCabbage
  );

  return candidates[0].id;
}

/* ---------------- Render & visuals ---------------- */
function renderNodes(){ /* node divs are not the main visuals now - we use platform elements */ }
function redrawVisuals(){
  // clear edges and platforms
  edgesSvg.innerHTML = '';
  // remove existing platform elements
  document.querySelectorAll('.platform').forEach(el => el.remove());
  const rect = boardWrapper.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  // draw edges & platforms
  const seen = new Set();
  nodes.forEach(n => {
    n.neighbors.forEach(nb => {
      const key = n.id < nb ? `${n.id}-${nb}` : `${nb}-${n.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const a = n, b = nodes.find(x=>x.id===nb);
      if (!a || !b) return;
      const ax = (a.x/100)*rect.width, ay = (a.y/100)*rect.height;
      const bx = (b.x/100)*rect.width, by = (b.y/100)*rect.height;
      drawEdge(ax,ay,bx,by);
    });
  });

  // platforms
  nodes.forEach(n => {
    const el = document.createElement('div');
    el.className = 'platform';
    el.dataset.id = n.id;
    nodesContainer.appendChild(el);
    const left = (n.x/100)*rect.width;
    const top = (n.y/100)*rect.height;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    const pieceType = n.id === wolfPos ? 'wolf' : n.id === sheepPos ? 'sheep' : n.id === cabbagePos ? 'cabbage' : null;
    if (pieceType && !availableImages[pieceType]){
      el.classList.add('occupied', pieceType);
      el.textContent = pieceFallback[pieceType];
    }
    el.addEventListener('click', ()=> { if (typeof onNodeClick==='function') onNodeClick({ currentTarget: el }); });
  });
}

function drawEdge(x1,y1,x2,y2){
  // glow
  const glow = document.createElementNS('http://www.w3.org/2000/svg','line');
  glow.setAttribute('x1', x1); glow.setAttribute('y1', y1);
  glow.setAttribute('x2', x2); glow.setAttribute('y2', y2);
  glow.setAttribute('stroke', 'rgba(255,102,196,0.24)');
  glow.setAttribute('stroke-width', 18);
  glow.setAttribute('stroke-linecap','round');
  glow.style.filter = 'blur(2px)';
  edgesSvg.appendChild(glow);
  // main line
  const line = document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1', x1); line.setAttribute('y1', y1);
  line.setAttribute('x2', x2); line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#ff66c4');
  line.setAttribute('stroke-width', 10);
  line.setAttribute('stroke-linecap','round');
  edgesSvg.appendChild(line);
}

function updatePieces(){
  const rect = boardWrapper.getBoundingClientRect();
  if (!rect.width) return;
  const gp = id => nodes.find(x=>x.id===id);
  const w = gp(wolfPos), s = gp(sheepPos), c = gp(cabbagePos);
  if (w && wolfEl.style) { wolfEl.style.left = (w.x/100)*rect.width + 'px'; wolfEl.style.top = (w.y/100)*rect.height + 'px'; }
  if (s && sheepEl.style) { sheepEl.style.left = (s.x/100)*rect.width + 'px'; sheepEl.style.top = (s.y/100)*rect.height + 'px'; }
  if (c && cabbageEl.style) { cabbageEl.style.left = (c.x/100)*rect.width + 'px'; cabbageEl.style.top = (c.y/100)*rect.height + 'px'; }
  updatePlatformPieces();
}

function updatePlatformPieces(){
  document.querySelectorAll('.platform').forEach(el => {
    el.classList.remove('occupied', 'wolf', 'sheep', 'cabbage');
    el.textContent = '';
  });

  [
    { id: wolfPos, type: 'wolf' },
    { id: sheepPos, type: 'sheep' },
    { id: cabbagePos, type: 'cabbage' }
  ].forEach(piece => {
    if (availableImages[piece.type]) return;
    const el = document.querySelector(`.platform[data-id="${piece.id}"]`);
    if (!el) return;
    el.classList.add('occupied', piece.type);
    el.textContent = pieceFallback[piece.type];
  });
}

/* ---------------- Gameplay (onNodeClick, sheepTurn, handleEnd, etc.) ---------------- */
// onNodeClick (called by platform click)
function onNodeClick(e){
  if (gameOver) return;
  const id = Number(e.currentTarget.dataset.id);
  const cur = nodes.find(n => n.id === wolfPos);
  if (!cur || !cur.neighbors.includes(id)){ 
    status.textContent = '❌ Só podes mover para nós ligados!'; 
    flashNode(id); 
    playSound('move');
    return; 
  }
  
  wolfPos = id; 
  moves++; 
  combo++;
  movesDisplay.innerText = moves; 
  updatePieces();
  
  // Visual feedback: highlight move
  e.currentTarget.classList.add('highlight');
  setTimeout(() => e.currentTarget.classList.remove('highlight'), 200);
  
  playSound('move');
  
  if (combo > bestCombo) bestCombo = combo;
  
  // Dynamic status message based on combo
  let comboMsg = '';
  if (combo >= 10) comboMsg = ' 🔥🔥 MEGA COMBO!';
  else if (combo >= 5) comboMsg = ' 🔥 COMBO!';
  else if (combo >= 3) comboMsg = ' 🔥';
  
  status.textContent = `Movimento ${moves}. Combo: ${combo}${comboMsg}`;
  
  if (wolfPos === sheepPos){ 
    handleEnd(true); 
    return; 
  }
  
  lockNodes(true); 
  status.textContent = '🐑 A ovelha está a mover-se...';
  const sheepSteps = Number(boardWrapper.dataset.sheepSteps || 1);
  setTimeout(()=> sheepTurn(sheepSteps), 380);
}
function sheepTurn(maxSteps){
  let moved = 0;

  function finishTurn(){
    if (gameOver) return;
    lockNodes(false);
    let turnMsg = `Tua vez. Combo: ${combo}`;
    if (combo >= 5) turnMsg += ' 🔥';
    status.textContent = turnMsg;
  }

  function stepFn(){
    if (gameOver) return;
    if (moved >= maxSteps){
      finishTurn();
      return;
    }

    const nextSheepPos = chooseSmartSheepMove();
    if (nextSheepPos === sheepPos){
      finishTurn();
      return;
    }

    sheepPos = nextSheepPos;
    updatePieces();
    moved++;

    if (sheepPos === wolfPos){
      handleEnd(true);
      return;
    }
    if (sheepPos === cabbagePos){
      handleEnd(false);
      return;
    }
    setTimeout(stepFn, 260);
  }

  setTimeout(stepFn, 120);
}



function lockNodes(flag){ 
  document.querySelectorAll('.platform').forEach(n=> flag ? n.classList.add('locked') : n.classList.remove('locked')); 
}

function flashNode(id){ 
  const el = document.querySelector(`.platform[data-id="${id}"]`); 
  if (!el) return; 
  el.classList.add('highlight'); 
  setTimeout(()=> el.classList.remove('highlight'), 350); 
}

// Get nearest node to mouse cursor
function getNearestNode(x, y, maxDist = 80) {
  let nearest = null;
  let minDist = maxDist;
  const rect = boardWrapper.getBoundingClientRect();
  
  nodes.forEach(n => {
    const nx = (n.x/100) * rect.width;
    const ny = (n.y/100) * rect.height;
    const d = Math.hypot(nx - x, ny - y);
    if (d < minDist) {
      minDist = d;
      nearest = n.id;
    }
  });
  return nearest;
}

/* Handle when level becomes impossible */
function handleImpossible() {
  gameOver = true;
  lockNodes(true);
  mouseTrackingActive = false;

  status.textContent = `⚠️ Nível ${level} é impossível de resolver!`;
  playSound('lose');
  document.getElementById('gameOverTitle').innerHTML = `🏁 FIM DO JOGO! 🏁`;

  addRankingEntry(playerName, level - 1, moves);
  renderRankingUI();

  document.getElementById('jogoArea').style.display = 'none';
  hud.style.display = 'none';
  gameOverDiv.style.display = 'flex';

  finalScoreEl.innerHTML = `<b>${playerName}</b> atingiu o nível <span style="color:#2ecc71">${level - 1}</span> e conseguiu <span style="color:#ff66c4;font-weight:bold">${bestCombo}</span> de melhor combo!`;
}

function handleEnd(playerWon){
  gameOver = true; 
  lockNodes(true);
  mouseTrackingActive = false;
  
  if (playerWon){ 
    status.textContent = `🎉 O lobo comeu a ovelha! A avançar para o nível ${level + 1}...`; 
    nextLevelBtn.disabled = true;
    playSound('win');
    setTimeout(() => {
      level++;
      gameOver = false;
      mouseTrackingActive = true;
      generateLevel(level);
    }, 1200);
    return;
  }

  status.textContent = '😢 A ovelha chegou ao repolho. Perdeste.'; 
  nextLevelBtn.disabled = true;
  playSound('lose');
  document.getElementById('gameOverTitle').innerHTML = `💀 DERROTA 💀`;
  
  addRankingEntry(playerName, level, moves);
  renderRankingUI();
  
  document.getElementById('jogoArea').style.display = 'none';
  hud.style.display = 'none';
  gameOverDiv.style.display = 'flex';
  
  const comboText = combo > 0 ? ` com <span style="color:#ff66c4;font-weight:bold">${combo}</span> combo movimentos` : '';
  finalScoreEl.innerHTML = `<b>${playerName}</b> chegou ao nível <span style="color:#2ecc71">${level}</span> com <b>${moves}</b> movimentos${comboText}.`;

}

nextLevelBtn.addEventListener('click', () => {
  if (nextLevelBtn.disabled) return;
  level++;
  gameOver = false;
  mouseTrackingActive = true;
  nextLevelBtn.disabled = true;
  generateLevel(level);
});

newMapBtn.addEventListener('click', () => {
  gameOver = false;
  mouseTrackingActive = true;
  nextLevelBtn.disabled = true;
  combo = 0;
  generateLevel(level);
});

resetBtn.addEventListener('click', () => {
  gameOver = false;
  mouseTrackingActive = true;
  nextLevelBtn.disabled = true;
  combo = 0;
  generateLevel(level);
});

resetRecordsBtn.addEventListener('click', () => {
  if (!confirm('Apagar todos os recordes?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderRankingUI();
});

/* ---------------- Helper: small no-op drawEdges if called early ---------------- */
function drawEdges(){ /* visuals drawn via redrawVisuals */ }

/* Improved restart game */
window.restartGame = function() {
  gameOver = false;
  combo = 0;
  level = 1;
  moves = 0;
  location.reload();
};

/* Add keyboard shortcut support */
document.addEventListener('keydown', (e) => {
  if (gameOver || document.getElementById('menu').style.display !== 'none') return;
  
  // Quick hint
  if (e.key === 'h' || e.key === 'H') {
    status.textContent = '💡 Dica: Clica nos nós ligados para mover. Cria combos!';
    setTimeout(() => { status.textContent = `Tua vez. Combo: ${combo}`; }, 3000);
  }
  // Reset level
  if (e.key === 'r' || e.key === 'R') {
    if (confirm('Recomeçar nível?')) { combo = 0; generateLevel(level); }
  }
});

window.addEventListener('resize', ()=> { setTimeout(redrawVisuals, 80); });
window.addEventListener('load', ()=> { /* menu visible until user starts */ });

/* Utility functions */
function randRange(a,b){ return Math.random()*(b-a)+a; }
function shuffle(a){ return a.sort(()=>Math.random()-0.5); }
function pointDistPct(x1,y1,x2,y2){ const dx=x1-x2, dy=y1-y2; return Math.sqrt(dx*dx + dy*dy); }

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = '../Jogos.html';
});