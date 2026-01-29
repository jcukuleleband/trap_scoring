// =====================
// State
// =====================
let editMode = false;
let savedCursorIndex = null;
let editTargetIndex = null;

// Prevent double-tap zoom (iOS Safari)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });


const params = new URLSearchParams(window.location.search);
const squadId = params.get('squadId');
const eventType = params.get('event'); // singles | handicap

const postKey = `squad-${squadId}-posts`;
const scoreKey = `squad-${squadId}-${eventType}`;

const posts = JSON.parse(localStorage.getItem(postKey)) || [];
let shots = JSON.parse(localStorage.getItem(scoreKey)) || [];

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
      if (!editMode) return;

      editTargetIndex = col * TOTAL_POSTS + rowIndex;
      renderGrid();
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
}

// =====================
// Render
// =====================
function renderGrid() {
  document.querySelectorAll('#scoreGrid td[data-col]').forEach(td => {
    td.textContent = '';
    td.classList.remove('active');
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

document.getElementById('hitBtn').onclick = () => applyResult('H');
document.getElementById('lossBtn').onclick = () => applyResult('L');

document.getElementById('undoBtn').onclick = () => {
  if (editMode) return;

  shots.pop();
  save();
  renderGrid();
};

document.getElementById('doneBtn').onclick = () => {
  window.location.href = `dashboard.html?squadId=${squadId}`;
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
