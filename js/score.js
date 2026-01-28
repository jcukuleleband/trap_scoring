const params = new URLSearchParams(window.location.search);
const squadId = params.get('squadId');
const eventType = params.get('event'); // singles | handicap

const postKey = `squad-${squadId}-posts`;
const scoreKey = `squad-${squadId}-${eventType}`;

const posts = JSON.parse(localStorage.getItem(postKey)) || [];
let shots = JSON.parse(localStorage.getItem(scoreKey)) || [];

const SHOTS_PER_SHOOTER = 25;
const TOTAL_POSTS = posts.length;

const titleEl = document.getElementById('scoreTitle');
const handicapInfoEl = document.getElementById('handicapInfo');

titleEl.textContent =
    eventType === 'singles'
        ? 'Singles Score Sheet'
        : 'Handicap Score Sheet';

// ---- Load handicap yardage (if applicable) ----
if (eventType === 'handicap') {
    Promise.all([
        fetch('squads.json').then(r => r.json()),
        fetch('data/schedule.json').then(r => r.json())
    ])
        .then(([squadData, scheduleData]) => {
            const squad = squadData.squads.find(s =>
                String(s.squadId) === String(squadId)
            );

            if (!squad) {
                handicapInfoEl.textContent = 'Yardage: ---';
                return;
            }

            const normalize = str =>
                str?.toLowerCase().trim().replace(/\s+/g, ' ');

            const entry =
                scheduleData.squads.find(s =>
                    normalize(s.squadName) === normalize(squad.squadName)
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


// ---- Build grid ----
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

    for (let i = 0; i < SHOTS_PER_SHOOTER; i++) {
        const td = document.createElement('td');
        td.textContent = '';
        td.dataset.row = rowIndex;
        td.dataset.col = i;
        tr.appendChild(td);
    }

    const totalCell = document.createElement('td');
    totalCell.textContent = '0';
    totalCell.classList.add('total-col');
    totalCell.dataset.row = rowIndex;
    tr.appendChild(totalCell);

    tbody.appendChild(tr);
});

// ---- Helpers ----
function getCursor() {
    const index = shots.length;
    return {
        row: index % TOTAL_POSTS,
        col: Math.floor(index / TOTAL_POSTS)
    };
}

function renderGrid() {
    document.querySelectorAll('#scoreGrid td[data-col]').forEach(td => {
        td.classList.remove('active');
        td.textContent = '';
    });

    document.querySelectorAll('#scoreGrid td.total-col').forEach(td => {
        td.textContent = '0';
    });

    shots.forEach((result, i) => {
        const row = i % TOTAL_POSTS;
        const col = Math.floor(i / TOTAL_POSTS);

        const cell = document.querySelector(
            `td[data-row="${row}"][data-col="${col}"]`
        );

        cell.textContent = result === 'H' ? 'X' : 'O';

        if (result === 'H') {
            const totalCell = document.querySelector(
                `td.total-col[data-row="${row}"]`
            );
            totalCell.textContent =
                parseInt(totalCell.textContent, 10) + 1;
        }
    });

    const cursor = getCursor();
    if (cursor.col < SHOTS_PER_SHOOTER) {
        const active = document.querySelector(
            `td[data-row="${cursor.row}"][data-col="${cursor.col}"]`
        );
        if (active) active.classList.add('active');
    }

    updateHeader(cursor);
    scrollActiveCellIntoView();

}

function scrollActiveCellIntoView() {
    const activeCell = document.querySelector('#scoreGrid td.active');
    const container = document.querySelector('.score-grid-container');

    if (!activeCell || !container) return;

    activeCell.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
    });
}


function updateHeader(cursor) {
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

function save() {
    localStorage.setItem(scoreKey, JSON.stringify(shots));
}

// ---- Controls ----
document.getElementById('hitBtn').onclick = () => {
    shots.push('H');
    save();
    renderGrid();
};

document.getElementById('lossBtn').onclick = () => {
    shots.push('L');
    save();
    renderGrid();
};

document.getElementById('undoBtn').onclick = () => {
    shots.pop();
    save();
    renderGrid();
};

document.getElementById('doneBtn').onclick = () => {
    window.location.href = `dashboard.html?squadId=${squadId}`;
};

// Initial render
renderGrid();
