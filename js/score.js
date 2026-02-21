// =====================
// State
// =====================
let editMode = false;
let savedCursorIndex = null;
let editTargetIndex = null;
let hapticsEnabled = localStorage.getItem('hapticsEnabled') !== 'false';

// Prevent double-tap zoom (iOS Safari)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// =====================
// Haptics
// =====================
function haptic(type) {
  if (!hapticsEnabled) return;

  // Android / Chrome
  if (navigator.vibrate) {
    if (type === 'hit') {
      navigator.vibrate(15);
    } else if (type === 'loss') {
      navigator.vibrate([30, 20, 30]);
    } else if (type === 'undo') {
      navigator.vibrate([10, 40, 10]);
    }
    return;
  }

  // iOS Safari fallback (best-effort)
  try {
    if (window.AudioContext) {
      new AudioContext().resume();
    }
  } catch (e) {
    // silently ignore
  }
}




const params = new URLSearchParams(window.location.search);
const squadId = params.get('squadId');
const eventType = params.get('event'); // singles | handicap

const postKey = `squad-${squadId}-posts`;
const scoreKey = `squad-${squadId}-${eventType}`;
const reviewKey = `squad-${squadId}-${eventType}-review`;

const posts = JSON.parse(localStorage.getItem(postKey)) || [];
let shots = JSON.parse(localStorage.getItem(scoreKey)) || [];
let reviewStates = JSON.parse(localStorage.getItem(reviewKey)) || [];

const SHOTS_PER_SHOOTER = 25;
const TOTAL_POSTS = posts.length;

// =====================
// Header
// =====================
const titleEl = document.getElementById('scoreTitle');
const handicapInfoEl = document.getElementById('handicapInfo');

titleEl.textContent =
  eventType === 'singles'
    ? 'Singles Score Sheet'
    : 'Handicap Score Sheet';

// Handicap yardage
if (eventType === 'handicap') {
  Promise.all([
    fetch('squads.json').then(r => r.json()),
    fetch('data/schedule.json').then(r => r.json())
  ])
    .then(([squadData, scheduleData]) => {
      const squad = squadData.squads.find(
        s => String(s.squadId) === String(squadId)
      );

      if (!squad) {
        handicapInfoEl.textContent = 'Yardage: ---';
        return;
      }

      const normalize = s =>
        s?.toLowerCase().trim().replace(/\s+/g, ' ');

      const entry =
        scheduleData.squads.find(
          s => normalize(s.squadName) === normalize(squad.squadName)
        ) || {};

      handicapInfoEl.textContent = entry.handicapYardage
        ? `Yardage: ${entry.handicapYardage} yards`
        : 'Yardage: ---';
    })
    .catch(() => {
      handicapInfoEl.textContent = 'Yardage: ---';
    });
} else {
  handicapInfoEl.style.display = 'none';
}

// =====================
// Build Grid
// =====================
const grid = document.getElementById('scoreGrid');
const theadRow = grid.querySelector('thead tr');
const tbody = grid.querySelector('tbody');

// Shot headers
for (let i = 1; i <= SHOTS_PER_SHOOTER; i++) {
  const th = document.createElement('th');
  th.textContent = i;
  theadRow.appendChild(th);
}

// Totals header
const totalHeader = document.createElement('th');
totalHeader.textContent = 'Total';
totalHeader.classList.add('total-col');
theadRow.appendChild(totalHeader);

// Shooter rows
posts.forEach((post, rowIndex) => {
  const tr = document.createElement('tr');

  const nameCell = document.createElement('td');
  nameCell.textContent = post.name;
  tr.appendChild(nameCell);

  for (let col = 0; col < SHOTS_PER_SHOOTER; col++) {
    const td = document.createElement('td');
    td.dataset.row = rowIndex;
    td.dataset.col = col;

    td.addEventListener('click', () => {
      const shotIndex = col * TOTAL_POSTS + rowIndex;

      if (editMode) {
        // Edit mode: modify score value, do not toggle review state
        editTargetIndex = shotIndex;
        renderGrid();
      } else {
        // Normal mode: toggle review state, do not modify score
        if (shotIndex < shots.length) {
          if (!reviewStates[shotIndex]) {
            reviewStates[shotIndex] = false;
          }
          reviewStates[shotIndex] = !reviewStates[shotIndex];
          save();
          renderGrid();
        }
      }
    });

    tr.appendChild(td);
  }

  const totalCell = document.createElement('td');
  totalCell.classList.add('total-col');
  totalCell.dataset.row = rowIndex;
  totalCell.textContent = '0';
  tr.appendChild(totalCell);

  tbody.appendChild(tr);
});

// =====================
// Helpers
// =====================
function getCursor() {
  const index = shots.length;
  return {
    row: index % TOTAL_POSTS,
    col: Math.floor(index / TOTAL_POSTS)
  };
}

function save() {
  localStorage.setItem(scoreKey, JSON.stringify(shots));
  localStorage.setItem(reviewKey, JSON.stringify(reviewStates));
}

// =====================
// Round Detection & Summary
// =====================
function getCompletedRounds() {
  // A round is complete when we have 5 shots per shooter (TOTAL_POSTS shooters)
  const shotsPerRound = TOTAL_POSTS * 5;
  const numCompleteRounds = Math.floor(shots.length / shotsPerRound);
  return numCompleteRounds;
}

function getRoundTotals(roundIndex) {
  // roundIndex is 0-based (0 = first round, 1 = second round, etc)
  const shotsPerRound = TOTAL_POSTS * 5;
  const startIndex = roundIndex * shotsPerRound;
  const endIndex = startIndex + shotsPerRound;

  const roundShots = shots.slice(startIndex, endIndex);
  
  // Calculate totals per shooter
  const totals = [];
  for (let shooterIndex = 0; shooterIndex < TOTAL_POSTS; shooterIndex++) {
    let total = 0;
    // Check 5 shots for this shooter in this round
    for (let shotNum = 0; shotNum < 5; shotNum++) {
      const index = shotNum * TOTAL_POSTS + shooterIndex;
      if (index < roundShots.length && roundShots[index] === 'H') {
        total++;
      }
    }
    totals.push(total);
  }
  
  return totals;
}

function getLatestCompletedRoundTotals() {
  const completedRounds = getCompletedRounds();
  if (completedRounds === 0) {
    return null;
  }
  return getRoundTotals(completedRounds - 1);
}

// =====================
// Render
// =====================
function renderGrid() {
  document.querySelectorAll('#scoreGrid td[data-col]').forEach(td => {
    td.textContent = '';
    td.classList.remove('active');
    td.classList.remove('review');
  });

  document.querySelectorAll('#scoreGrid td.total-col').forEach(td => {
    td.textContent = '0';
  });

  shots.forEach((result, index) => {
    const row = index % TOTAL_POSTS;
    const col = Math.floor(index / TOTAL_POSTS);

    const cell = document.querySelector(
      `td[data-row="${row}"][data-col="${col}"]`
    );
    if (!cell) return;

    cell.textContent = result === 'H' ? 'X' : 'O';

    // Apply review styling if marked
    if (reviewStates[index]) {
      cell.classList.add('review');
    }

    if (result === 'H') {
      const totalCell = document.querySelector(
        `td.total-col[data-row="${row}"]`
      );
      totalCell.textContent =
        Number(totalCell.textContent) + 1;
    }
  });

  if (editMode && editTargetIndex !== null) {
    const row = editTargetIndex % TOTAL_POSTS;
    const col = Math.floor(editTargetIndex / TOTAL_POSTS);
    const editCell = document.querySelector(
      `td[data-row="${row}"][data-col="${col}"]`
    );
    if (editCell) editCell.classList.add('active');
  } else {
    const cursor = getCursor();
    if (cursor.col < SHOTS_PER_SHOOTER) {
      const active = document.querySelector(
        `td[data-row="${cursor.row}"][data-col="${cursor.col}"]`
      );
      if (active) active.classList.add('active');
    }
  }

  updateHeader();
  scrollActiveCellIntoView();
}

function scrollActiveCellIntoView() {
  const activeCell = document.querySelector('#scoreGrid td.active');
  if (!activeCell) return;

  activeCell.scrollIntoView({
    behavior: 'smooth',
    inline: 'center',
    block: 'nearest'
  });
}

function updateHeader() {
  if (editMode) return;

  const cursor = getCursor();

  if (cursor.col >= SHOTS_PER_SHOOTER) {
    document.getElementById('currentShooter').textContent = '—';
    document.getElementById('currentPost').textContent = '—';
    document.getElementById('currentTarget').textContent = 'Complete';
    return;
  }

  document.getElementById('currentShooter').textContent =
    posts[cursor.row].name;
  document.getElementById('currentPost').textContent =
    posts[cursor.row].post;
  document.getElementById('currentTarget').textContent =
    cursor.col + 1;
}

// =====================
// Scoring
// =====================
function applyResult(result) {
  if (editMode) {
    if (editTargetIndex === null) return;
    if (editTargetIndex >= shots.length) return;

    shots[editTargetIndex] = result;
  } else {
    shots.push(result);
  }

  save();
  renderGrid();
}

document.getElementById('hitBtn').onclick = () => {
  haptic('hit');
  applyResult('H');
};

document.getElementById('lossBtn').onclick = () => {
  haptic('loss');
  applyResult('L');
};


document.getElementById('undoBtn').onclick = () => {
  if (editMode) return;

  shots.pop();
  save();
  renderGrid();
};

document.getElementById('doneBtn').onclick = () => {
  window.location.href = `dashboard.html?squadId=${squadId}`;
};

document.getElementById('clearReviewBtn').onclick = () => {
  reviewStates = [];
  save();
  renderGrid();
};

const hapticsBtn = document.getElementById('hapticsToggleBtn');

function updateHapticsButton() {
  hapticsBtn.textContent =
    `Haptics: ${hapticsEnabled ? 'On' : 'Off'}`;
}

updateHapticsButton();

hapticsBtn.onclick = () => {
  hapticsEnabled = !hapticsEnabled;
  localStorage.setItem('hapticsEnabled', hapticsEnabled);
  updateHapticsButton();

  // Optional confirmation pulse when turning ON
  if (hapticsEnabled) {
    haptic('hit');
  }
};


// =====================
// Round Summary Modal
// =====================
function showRoundSummary() {
  const roundTotals = getLatestCompletedRoundTotals();
  const modal = document.getElementById('roundSummaryModal');
  const content = document.getElementById('roundSummaryContent');

  if (!roundTotals) {
    content.innerHTML = '<p style="text-align: center; color: #6b7280;">No completed rounds yet.</p>';
    modal.classList.remove('hidden');
    return;
  }

  // Build table with shooter names and their round totals
  let tableHTML = '<table class="round-summary-table"><thead><tr><th>Shooter</th><th>Round Total</th></tr></thead><tbody>';
  
  posts.forEach((post, index) => {
    tableHTML += `<tr><td>${post.name}</td><td>${roundTotals[index]}</td></tr>`;
  });
  
  tableHTML += '</tbody></table>';
  content.innerHTML = tableHTML;
  modal.classList.remove('hidden');
}

function closeRoundSummary() {
  const modal = document.getElementById('roundSummaryModal');
  modal.classList.add('hidden');
}

document.getElementById('showRoundSummaryBtn').onclick = () => {
  showRoundSummary();
};

document.getElementById('closeRoundSummaryBtn').onclick = () => {
  closeRoundSummary();
};

// Close modal when clicking outside of it
document.getElementById('roundSummaryModal').onclick = (e) => {
  if (e.target.id === 'roundSummaryModal') {
    closeRoundSummary();
  }
};


// =====================
// Edit Mode Toggle
// =====================
document.getElementById('editBtn').onclick = () => {
  editMode = !editMode;

  const btn = document.getElementById('editBtn');
  btn.classList.toggle('active', editMode);

  if (editMode) {
    savedCursorIndex = shots.length;
    editTargetIndex = null;
  } else {
    editTargetIndex = null;
    renderGrid();
  }
};

// Initial render
renderGrid();
