const GRID_SIZE = 5;
const START_HP = 150;
const VECNA_START = 5;
const UPSIDE_DAMAGE = 15;
const DEMO_DAMAGE = 25;
const FLAYER_DAMAGE = 35;

const TYPE = {
  REAL:'real', UPSIDE:'upside', EXIT:'exit',
  DEMOGORGON:'demogorgon', MINDFLAYER:'mindflayer',
  FLAMETHROWER:'flamethrower', PSYCHIC:'psychic',
  START:'start'
};

const ICONS = {
  [TYPE.REAL]:'✨', [TYPE.UPSIDE]:'🌿', [TYPE.EXIT]:'🚪',
  [TYPE.DEMOGORGON]:'👹', [TYPE.MINDFLAYER]:'🧠',
  [TYPE.FLAMETHROWER]:'🔥', [TYPE.PSYCHIC]:'🌀',
  [TYPE.START]:'🏠'
};

let state, audioCtx, vecnaTimerId;

function initState(){
  state = {
    grid: generateGrid(),
    player: { row: GRID_SIZE - 1, col: 0 },
    playerHP: START_HP,
    vecnaHP: VECNA_START,
    currentRoll: null,
    rolling: false,
    startTime: null,
    elapsed: 0,
    inventory: { flamethrower: 0, psychic: 0 },
    gameOver: false,
    history: [],
    log: [],
    psychicActive: false
  };
  state.grid[state.player.row][state.player.col].revealed = true;
  state.grid[state.player.row][state.player.col].type = TYPE.START;
}

function generateGrid(){
  const cells = [];
  for(let r=0; r<GRID_SIZE; r++){
    const row=[];
    for(let c=0; c<GRID_SIZE; c++){
      row.push({
        type:null,
        unlockReq: 1 + Math.floor(Math.random()*10),
        revealed:false,
        used:false
      });
    }
    cells.push(row);
  }

  const positions = [];
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      if(!(r===GRID_SIZE-1 && c===0)) positions.push([r,c]);
    }
  }
  for(let i=positions.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [positions[i],positions[j]]=[positions[j],positions[i]];
  }

  const distribution = [
    [TYPE.EXIT, 1],
    [TYPE.DEMOGORGON, 2],
    [TYPE.MINDFLAYER, 1],
    [TYPE.FLAMETHROWER, 2],
    [TYPE.PSYCHIC, 1],
    [TYPE.UPSIDE, 8],
    [TYPE.REAL, 9]
  ];
  let idx = 0;
  for(const [type, count] of distribution){
    for(let i=0;i<count;i++){
      const [r,c] = positions[idx++];
      cells[r][c].type = type;
    }
  }
  cells[GRID_SIZE-1][0].unlockReq = 0;
  return cells;
}

function render(){
  renderGrid();
  renderHUD();
  renderPreview();
  renderInventory();
}

function renderGrid(){
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      const cell = state.grid[r][c];
      const div = document.createElement('div');
      div.className = 'cell';
      const adj = isAdjacent(r,c) && !state.gameOver;
      if(adj) div.classList.add('adjacent');

      if(cell.revealed){

        let display = cell.type;
        if(cell.used && [TYPE.DEMOGORGON,TYPE.MINDFLAYER,TYPE.FLAMETHROWER,TYPE.PSYCHIC].includes(cell.type)){
          display = TYPE.REAL;
        }
        div.classList.add(display);
        div.textContent = ICONS[display] || '';
      } else {
        div.classList.add('locked');
        const reqEl = document.createElement('span');
        reqEl.className = 'req';
        reqEl.textContent = cell.unlockReq;
        div.appendChild(reqEl);
      }

      if(state.player.row===r && state.player.col===c){
        const marker = document.createElement('span');
        marker.className = 'player-marker';
        marker.textContent = '🕷️';
        div.appendChild(marker);
      }

      div.addEventListener('click', () => attemptMove(r,c));
      gridEl.appendChild(div);
    }
  }
}

function renderHUD(){
  document.getElementById('player-hp').textContent = state.playerHP;
  document.getElementById('vecna-hp').textContent = state.vecnaHP;
  document.getElementById('timer').textContent = state.elapsed;
}

function renderPreview(){
  const cur = state.grid[state.player.row][state.player.col];
  let label = (cur.type || 'start').toUpperCase();
  if(cur.used && [TYPE.DEMOGORGON,TYPE.MINDFLAYER,TYPE.FLAMETHROWER,TYPE.PSYCHIC].includes(cur.type)){
    label = 'CLEARED';
  }
  document.getElementById('preview-label').textContent = label;
  const dirs = [['up',-1,0],['down',1,0],['left',0,-1],['right',0,1]];
  for(const [dir,dr,dc] of dirs){
    const nr = state.player.row + dr;
    const nc = state.player.col + dc;
    const el = document.getElementById('arrow-'+dir);
    if(nr<0||nr>=GRID_SIZE||nc<0||nc>=GRID_SIZE){
      el.textContent = '×'; el.style.opacity = .3;
    } else {
      const ncell = state.grid[nr][nc];
      el.textContent = ncell.revealed ? '·' : ncell.unlockReq;
      el.style.opacity = 1;
    }
  }
}

function renderInventory(){
  const inv = state.inventory;
  let html = `🔥 Flamethrower: ${inv.flamethrower}<br>🌀 Psychic: ${inv.psychic}`;
  if(inv.psychic > 0 && !state.psychicActive){
    html += `<br><button onclick="usePsychic()">Use Psychic</button>`;
  }
  if(state.psychicActive){
    html += `<br><span style="color:var(--neon-cyan)">⚡ Next roll = 10</span>`;
  }
  document.getElementById('inventory').innerHTML = html;
}

function isAdjacent(r,c){
  return Math.abs(r - state.player.row) + Math.abs(c - state.player.col) === 1;
}


function rollDice(){
  if(state.gameOver) return;
  if(state.rolling) return;
  if(state.currentRoll !== null){
    addLog('⚠ Use your current roll first.', 'bad');
    return;
  }
  const dice = document.getElementById('dice');
  state.rolling = true;
  dice.classList.add('rolling');
  let flickers = 0;
  const flickerInterval = setInterval(() => {
    dice.textContent = 1 + Math.floor(Math.random()*10);
    flickers++;
    if(flickers >= 10){
      clearInterval(flickerInterval);
      let roll;
      if(state.psychicActive){
        roll = 10;
        state.psychicActive = false;
        addLog('🌀 Psychic surge! Roll guaranteed.', 'gold');
      } else {
        roll = 1 + Math.floor(Math.random()*10);
      }
      state.currentRoll = roll;
      dice.textContent = roll;
      dice.classList.remove('rolling');
      state.rolling = false;
      renderInventory();
    }
  }, 50);
}

function attemptMove(r,c){
  if(state.gameOver) return;
  if(!isAdjacent(r,c)) return;
  const cell = state.grid[r][c];


  if(cell.revealed){
    saveSnapshot();
    state.player = { row: r, col: c };
    state.log.push({ type:'move', to:[r,c] });
    if(!state.startTime) startVecnaTimer();
    applyEffect(cell, false);
    render();
    checkGameOver();
    return;
  }

  if(state.currentRoll === null){
    addLog('⚠ Roll the dice first!', 'bad');
    return;
  }

  saveSnapshot();
  const roll = state.currentRoll;
  if(!state.startTime) startVecnaTimer();

  if(roll >= cell.unlockReq){
    cell.revealed = true;
    state.player = { row: r, col: c };
    addLog(`✓ Rolled ${roll} ≥ ${cell.unlockReq}. Unlocked (${r},${c}).`, 'good');
    state.log.push({ type:'unlock', to:[r,c], roll });
    applyEffect(cell, true);
  } else {
    addLog(`✗ Rolled ${roll} < ${cell.unlockReq}. Turn lost.`, 'bad');
    state.log.push({ type:'fail', target:[r,c], roll });
  }
  state.currentRoll = null;
  document.getElementById('dice').textContent = '?';
  render();
  checkGameOver();
}

function applyEffect(cell, justRevealed){
  switch(cell.type){
    case TYPE.REAL:
      if(justRevealed) addLog('✨ The Real World. Safe.', 'good');
      break;
    case TYPE.UPSIDE:
      state.playerHP -= UPSIDE_DAMAGE;
      addLog(`🌿 The Upside Down! −${UPSIDE_DAMAGE} HP.`, 'bad');
      shakeAndFlash();
      break;
    case TYPE.EXIT:
      addLog('🚪 You found the EXIT DOOR!', 'gold');
      endGame();
      return;
    case TYPE.DEMOGORGON:
      if(cell.used) break;
      if(state.inventory.flamethrower > 0){
        state.inventory.flamethrower--;
        cell.used = true;
        addLog('🔥 Demogorgon torched with flamethrower!', 'gold');
      } else {
        state.playerHP -= DEMO_DAMAGE;
        cell.used = true;
        addLog(`👹 Demogorgon attack! −${DEMO_DAMAGE} HP.`, 'bad');
        shakeAndFlash();
      }
      break;
    case TYPE.MINDFLAYER:
      if(cell.used) break;
      if(state.inventory.flamethrower > 0){
        state.inventory.flamethrower--;
        cell.used = true;
        addLog('🔥 Mind Flayer burned!', 'gold');
      } else {
        state.playerHP -= FLAYER_DAMAGE;
        cell.used = true;
        addLog(`🧠 Mind Flayer attack! −${FLAYER_DAMAGE} HP.`, 'bad');
        shakeAndFlash();
      }
      break;
    case TYPE.FLAMETHROWER:
      if(!cell.used){
        state.inventory.flamethrower++;
        cell.used = true;
        addLog('🔥 Picked up a flamethrower!', 'gold');
      }
      break;
    case TYPE.PSYCHIC:
      if(!cell.used){
        state.inventory.psychic++;
        cell.used = true;
        addLog('🌀 Picked up psychic power!', 'gold');
      }
      break;
  }
}

function usePsychic(){
  if(state.gameOver) return;
  if(state.inventory.psychic > 0 && !state.psychicActive){
    state.inventory.psychic--;
    state.psychicActive = true;
    addLog('🌀 Psychic power activated. Next roll = 10.', 'gold');
    renderInventory();
  }
}

function shakeAndFlash(){
  document.body.classList.add('shake','flash');
  setTimeout(() => document.body.classList.remove('shake','flash'), 400);
}


function startVecnaTimer(){
  state.startTime = Date.now();
  vecnaTimerId = setInterval(() => {
    if(state.gameOver) return;
    state.vecnaHP++;
    state.elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    renderHUD();
    tick();
    const vh = document.getElementById('vecna-hud');
    vh.classList.add('pulse');
    setTimeout(() => vh.classList.remove('pulse'), 500);
  }, 1000);
}

function tick(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = 220;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch(e){}
}


function checkGameOver(){
  if(state.playerHP <= 0){
    state.playerHP = 0;
    renderHUD();
    endGame();
  }
}

function endGame(){
  if(state.gameOver) return;
  state.gameOver = true;
  clearInterval(vecnaTimerId);
  const onExit = state.grid[state.player.row][state.player.col].type === TYPE.EXIT;
  const won = onExit && state.playerHP > state.vecnaHP;
  setTimeout(() => showEndModal(won, onExit), 400);
}

function showEndModal(won, onExit){
  const modal = document.getElementById('modal');
  modal.className = 'modal ' + (won ? 'win' : '');
  if(won){
    const score = state.playerHP - state.vecnaHP;
    modal.innerHTML = `
      <h2>You Closed the Gate</h2>
      <p>Player HP: <strong>${state.playerHP}</strong> vs Vecna HP: <strong>${state.vecnaHP}</strong></p>
      <p>Dominance Score: <strong style="color:var(--neon-gold);font-size:1.6rem">${score}</strong></p>
      <input type="text" id="player-name" placeholder="Enter your name" maxlength="20">
      <div class="modal-buttons">
        <button class="gold" onclick="saveScore(${score})">Save Score</button>
        <button onclick="restart()">Play Again</button>
      </div>
    `;
  } else {
    const reason = onExit
      ? 'Vecna outgrew your strength.'
      : (state.playerHP <= 0 ? 'The labyrinth consumed you.' : 'Hawkins is lost.');
    modal.innerHTML = `
      <h2>Vecna Claims Hawkins</h2>
      <p>Player HP: <strong>${state.playerHP}</strong> | Vecna HP: <strong>${state.vecnaHP}</strong></p>
      <p>${reason}</p>
      <div class="modal-buttons">
        <button onclick="restart()">Try Again</button>
      </div>
    `;
  }
  document.getElementById('modal-overlay').classList.add('show');
}


function saveScore(score){
  const name = document.getElementById('player-name').value.trim() || 'Anonymous';
  const board = JSON.parse(localStorage.getItem('hawkins-leaderboard') || '[]');
  board.push({ name, score, date: new Date().toISOString().split('T')[0] });
  board.sort((a,b) => b.score - a.score);
  localStorage.setItem('hawkins-leaderboard', JSON.stringify(board.slice(0,10)));
  showLeaderboard();
}

function showLeaderboard(){
  const board = JSON.parse(localStorage.getItem('hawkins-leaderboard') || '[]');
  const modal = document.getElementById('modal');
  modal.className = 'modal win';
  modal.innerHTML = `
    <h2>Most Dominant Victories</h2>
    <div class="leaderboard-list">
      ${board.length === 0
        ? '<p>No victories yet. Be the first to close the gate.</p>'
        : board.map((e,i) => `
            <div class="entry">
              <span class="rank">#${i+1}</span>
              <span class="name">${escapeHTML(e.name)}</span>
              <span class="score">${e.score}</span>
            </div>`).join('')}
    </div>
    <div class="modal-buttons">
      <button onclick="closeModal()">Close</button>
      <button class="gold" onclick="clearLeaderboard()">Clear</button>
      <button class="cyan" onclick="restart()">New Game</button>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('show');
}

function clearLeaderboard(){
  if(confirm('Clear all scores?')){
    localStorage.removeItem('hawkins-leaderboard');
    showLeaderboard();
  }
}

function closeModal(){
  document.getElementById('modal-overlay').classList.remove('show');
}

function escapeHTML(s){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}



function saveSnapshot(){
  const snap = JSON.parse(JSON.stringify({
    grid: state.grid,
    player: state.player,
    playerHP: state.playerHP,
    inventory: state.inventory,
    psychicActive: state.psychicActive
  }));
  state.history.push(snap);
  if(state.history.length > 30) state.history.shift();
}

function undo(){
  if(state.history.length === 0 || state.gameOver){
    addLog('⚠ Nothing to undo.', 'bad');
    return;
  }
  const snap = state.history.pop();
  state.grid = snap.grid;
  state.player = snap.player;
  state.playerHP = snap.playerHP;
  state.inventory = snap.inventory;
  state.psychicActive = snap.psychicActive;
  addLog('↶ Rewound last move.', 'gold');
  render();
}


function replayGame(){
  if(state.log.length === 0){
    addLog('⚠ No moves to replay.', 'bad');
    return;
  }
  const modal = document.getElementById('modal');
  modal.className = 'modal';
  modal.innerHTML = `
    <h2>Replay</h2>
    <p>Step-by-step record of your run:</p>
    <div class="leaderboard-list" id="replay-list"></div>
    <div class="modal-buttons">
      <button onclick="closeModal()">Close</button>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('show');
  const list = document.getElementById('replay-list');
  state.log.forEach((entry, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'entry';
      let txt = '';
      if(entry.type === 'unlock')
        txt = `Step ${i+1}: 🎲 ${entry.roll} → unlocked (${entry.to[0]},${entry.to[1]})`;
      else if(entry.type === 'fail')
        txt = `Step ${i+1}: 🎲 ${entry.roll} → failed at (${entry.target[0]},${entry.target[1]})`;
      else if(entry.type === 'move')
        txt = `Step ${i+1}: 🚶 moved to (${entry.to[0]},${entry.to[1]})`;
      div.innerHTML = `<span>${txt}</span>`;
      list.appendChild(div);
      list.scrollTop = list.scrollHeight;
    }, i * 250);
  });
}


function showHelp(){
  const modal = document.getElementById('modal');
  modal.className = 'modal';
  modal.innerHTML = `
    <h2>How to Survive</h2>
    <div class="help-content">
      <h3>Goal</h3>
      <p>Find the hidden 🚪 Exit Door and reach it with more HP than Vecna.</p>
      <h3>Each turn</h3>
      <ul>
        <li>Click <strong>Roll Dice</strong> (1–10)</li>
        <li>Click an adjacent cell (up/down/left/right)</li>
        <li>Locked cells need <em>roll ≥ unlock requirement</em></li>
        <li>Already revealed cells are free to walk back into</li>
      </ul>
      <h3>Block types</h3>
      <ul>
        <li>✨ Real World — safe</li>
        <li>🌿 Upside Down — −${UPSIDE_DAMAGE} HP</li>
        <li>👹 Demogorgon — −${DEMO_DAMAGE} HP (flamethrower kills it)</li>
        <li>🧠 Mind Flayer — −${FLAYER_DAMAGE} HP (flamethrower kills it)</li>
        <li>🔥 Flamethrower — pick up, auto-uses on next enemy</li>
        <li>🌀 Psychic — pick up, makes your next roll = 10</li>
        <li>🚪 Exit Door — ends the game</li>
      </ul>
      <h3>Vecna</h3>
      <p>Starts at 5 HP. Once you make your first move, he gains +1 HP every second. Move fast.</p>
    </div>
    <div class="modal-buttons">
      <button onclick="closeModal()">Got it</button>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('show');
}


function addLog(msg, cls=''){
  const log = document.getElementById('log');
  const p = document.createElement('p');
  if(cls) p.className = cls;
  p.textContent = msg;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}


function restart(){
  clearInterval(vecnaTimerId);
  closeModal();
  initState();
  document.getElementById('dice').textContent = '?';
  document.getElementById('log').innerHTML = '';
  addLog('A new labyrinth shifts into place. Roll the dice to begin.', 'gold');
  render();
}


document.getElementById('roll-btn').addEventListener('click', rollDice);
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('replay-btn').addEventListener('click', replayGame);
document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('help-btn').addEventListener('click', showHelp);
document.getElementById('restart-btn').addEventListener('click', restart);


document.addEventListener('keydown', (e) => {
  if(e.target.tagName === 'INPUT') return;
  if(e.key === 'p' || e.key === 'P') usePsychic();
  if(e.key === 'r' || e.key === 'R') rollDice();
  if(e.key === 'u' || e.key === 'U') undo();
});

document.addEventListener('click', () => {
  if(!audioCtx){
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  }
}, { once: true });

initState();
addLog('Welcome to Hawkins. Roll the dice to begin.', 'gold');
render();