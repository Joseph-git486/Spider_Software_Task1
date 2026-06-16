const MAX_LIVES = 5;
const BOT_NAMES = ['Spider-A', 'Spider-B', 'Spider-C'];

let players, round;

function initGame() {
  round = 1;

  players = [
    { id: 'user', name: 'You', lives: MAX_LIVES, eliminated: false, isHuman: true },
    ...BOT_NAMES.map(n => ({ id: n, name: n, lives: MAX_LIVES, eliminated: false, isHuman: false }))
  ];

  document.getElementById('gameArea').style.display = '';
  document.getElementById('gameOverScreen').classList.remove('show');
  document.getElementById('resultPanel').classList.remove('show');
  document.getElementById('inputArea').style.display = '';
  document.getElementById('userInput').value = '';
  document.getElementById('errorMsg').textContent = '';
  document.getElementById('submitBtn').disabled = false;

  renderPlayers();
  updateRoundBadge();
}

function renderPlayers(numbers, spiderNumber, winnerIds) {
  const row = document.getElementById('playersRow');
  row.innerHTML = '';

  players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-card' + (p.eliminated ? ' eliminated' : '');
    if (winnerIds && winnerIds.includes(p.id)) card.classList.add('winner-highlight');

    // Hearts
    let heartsHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
      heartsHTML += `<span class="heart${i >= p.lives ? ' lost' : ''}">♥</span>`;
    }

    // Chosen number display
    let numHTML = '';
    if (numbers) {
      const n = numbers[p.id];
      if (p.eliminated) {
        numHTML = `<div class="player-number" style="font-size:0.9rem;color:var(--muted)">—</div>`;
      } else if (n !== undefined) {
        const diff = Math.abs(n - spiderNumber).toFixed(2);
        numHTML = `<div class="player-number">${n}</div><div class="player-label">Δ ${diff}</div>`;
      }
    }

    card.innerHTML = `
      <div class="player-name">${p.name}</div>
      <div class="player-lives">${heartsHTML}</div>
      ${numHTML}
      ${p.eliminated ? '<div class="elim-badge">Eliminated</div>' : ''}
    `;
    row.appendChild(card);
  });
}

function updateRoundBadge() {
  document.getElementById('roundNum').textContent = round;
}

function submitRound() {
  const input = document.getElementById('userInput');
  const val = parseInt(input.value);
  const err = document.getElementById('errorMsg');

  if (isNaN(val) || val < 0 || val > 100) {
    err.textContent = 'Enter a whole number between 0 and 100.';
    return;
  }
  err.textContent = '';

  // Generate bot numbers
  const numbers = {};
  numbers['user'] = val;
  players.forEach(p => {
    if (!p.isHuman && !p.eliminated) {
      numbers[p.id] = Math.floor(Math.random() * 101);
    }
  });

  // Compute average of active players only
  const activePlayers = players.filter(p => !p.eliminated);
  const activeNums = activePlayers.map(p => numbers[p.id]);
  const avg = activeNums.reduce((a, b) => a + b, 0) / activeNums.length;
  const spiderNumber = parseFloat((avg * 0.8).toFixed(2));

  // Find winner(s) — closest to spiderNumber
  let minDiff = Infinity;
  activePlayers.forEach(p => {
    const diff = Math.abs(numbers[p.id] - spiderNumber);
    if (diff < minDiff) minDiff = diff;
  });
  const winnerIds = activePlayers
    .filter(p => Math.abs(numbers[p.id] - spiderNumber) === minDiff)
    .map(p => p.id);

  // Apply lives penalty: everyone who didn't win loses 1 life
  activePlayers.forEach(p => {
    if (!winnerIds.includes(p.id)) {
      p.lives--;
      if (p.lives <= 0) {
        p.lives = 0;
        p.eliminated = true;
      }
    }
  });

  // Render updated state
  renderPlayers(numbers, spiderNumber, winnerIds);
  showResult(numbers, spiderNumber, winnerIds, activePlayers);
}

function showResult(numbers, spiderNumber, winnerIds, activePlayers) {
  document.getElementById('inputArea').style.display = 'none';
  const panel = document.getElementById('resultPanel');
  panel.classList.add('show');

  document.getElementById('targetDisplay').textContent = spiderNumber;

  // Build breakdown
  let rows = '';
  activePlayers.forEach(p => {
    const n = numbers[p.id];
    const diff = Math.abs(n - spiderNumber).toFixed(2);
    const isW = winnerIds.includes(p.id);
    rows += `<div class="row">
      <span class="name">${p.name}</span>
      <span class="val">${n}</span>
      <span class="diff">${isW ? '👑 Δ' : 'Δ'} ${diff}</span>
    </div>`;
  });
  document.getElementById('resultBreakdown').innerHTML = rows;

  // Winner announce
  const announce = document.getElementById('winnerAnnounce');
  const winnerNames = winnerIds.map(id => players.find(p => p.id === id).name).join(' & ');
  const userWon = winnerIds.includes('user');
  announce.textContent = userWon ? `You win this round! 👑` : `${winnerNames} wins the round!`;
  announce.className = 'winner-announce' + (userWon ? '' : ' lose');

  // Check game over
  const userPlayer = players.find(p => p.id === 'user');
  const activeBots = players.filter(p => !p.isHuman && !p.eliminated);

  const nextBtn = document.getElementById('nextBtn');

  if (userPlayer.eliminated) {
    nextBtn.textContent = 'See Result →';
    nextBtn.onclick = () => showGameOver(false);
  } else if (activeBots.length === 0) {
    nextBtn.textContent = 'See Result →';
    nextBtn.onclick = () => showGameOver(true);
  } else {
    nextBtn.textContent = 'Next Round →';
    nextBtn.onclick = nextRound;
  }
}

function nextRound() {
  round++;
  updateRoundBadge();
  document.getElementById('resultPanel').classList.remove('show');
  document.getElementById('inputArea').style.display = '';
  document.getElementById('userInput').value = '';
  document.getElementById('submitBtn').disabled = false;
  renderPlayers();
}

function showGameOver(victory) {
  document.getElementById('gameArea').style.display = 'none';
  const screen = document.getElementById('gameOverScreen');
  screen.classList.add('show');

  const title = document.getElementById('gameOverTitle');
  const msg = document.getElementById('gameOverMsg');

  if (victory) {
    title.textContent = '♦ You Are the King ♦';
    title.className = 'victory';
    msg.textContent = `All bots eliminated after ${round} rounds. You mastered the Keynesian Beauty Contest.`;
  } else {
    title.textContent = 'Game Over';
    title.className = 'defeat';
    msg.textContent = `You were eliminated in round ${round}. The bots outplayed you this time.`;
  }
}

// Allow Enter key to submit
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('userInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitRound();
  });
  initGame();
});