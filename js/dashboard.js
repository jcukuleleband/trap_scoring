const params = new URLSearchParams(window.location.search);
const squadId = params.get('squadId');

const postKey = `squad-${squadId}-posts`;
const singlesKey = `squad-${squadId}-singles`;
const handicapKey = `squad-${squadId}-handicap`;

let squadMetadata = null;
let posts = [];

// ---- Load squad first (required) ----
fetch('squads.json')
    .then(res => res.json())
    .then(squadData => {
        squadMetadata = squadData.squads.find(s => s.squadId == squadId);
        if (!squadMetadata) return;

        document.getElementById('squadName').textContent = squadMetadata.squadName;

        // ---- Load shooter order (ALWAYS) ----
        posts = JSON.parse(localStorage.getItem(postKey)) || [];
        const postList = document.getElementById('postList');
        postList.innerHTML = '';

        posts.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `Post ${p.post}: ${p.name}`;
            postList.appendChild(li);
        });

        // ---- Load scores ----
        updateScoreDisplay();

        // ---- Prepare print report content ----
        renderPrintReport();

        // ---- Load schedule (OPTIONAL) ----
        fetch('data/schedule.json')
            .then(res => res.json())
            .then(scheduleData => {
                const normalize = str =>
                    str?.toLowerCase().trim().replace(/\s+/g, ' ');

                const schedule =
                    scheduleData.squads.find(s =>
                        normalize(s.squadName) === normalize(squadMetadata.squadName)
                    ) || {};

                applySchedule(schedule);
            })
            .catch(() => {
                // Schedule not available — show placeholders
                applySchedule({});
            });
    });

// ---- Apply schedule safely ----
function applySchedule(schedule) {
    document.getElementById('scheduledDate').textContent =
        schedule.date || '---';

    document.getElementById('scheduledTime').textContent =
        schedule.time || '---';

    document.getElementById('trapNumber').textContent =
        schedule.trap !== undefined ? schedule.trap : '---';

    document.getElementById('singlesHandicap').textContent =
        schedule.singlesHandicap !== undefined
            ? schedule.singlesHandicap
            : '---';

    document.getElementById('handicapYardage').textContent =
        schedule.handicapYardage
            ? `${schedule.handicapYardage} yd`
            : '---';

    document.getElementById('opponentName').textContent =
        schedule.opponent || '---';
}

// ---- Score helpers ----
function updateScoreDisplay() {
    const singles = JSON.parse(localStorage.getItem(singlesKey)) || [];
    const handicap = JSON.parse(localStorage.getItem(handicapKey)) || [];

    document.getElementById('singlesScore').textContent =
        `${countHits(singles)} / 125`;

    document.getElementById('handicapScore').textContent =
        `${countHits(handicap)} / 125`;
}

function countHits(shots) {
    return shots.filter(s => s === 'H').length;
}

function formatShotCell(value) {
    if (value === 'H') return 'X';
    if (value === 'L') return 'O';
    return '';
}

function buildEventScoreTable(eventName, shots) {
    const totalShots = 25;
    const shooterCount = posts.length;
    const rows = [];

    if (shooterCount === 0) {
        return `<div class="print-section"><strong>${eventName}</strong><p>No shooter order available.</p></div>`;
    }

    let table = `<h3>${eventName}</h3><table class="print-score-table"><thead><tr><th>Shooter</th><th>Total</th>`;
    for (let shotNum = 1; shotNum <= totalShots; shotNum++) {
        table += `<th>${shotNum}</th>`;
    }
    table += `</tr></thead><tbody>`;

    posts.forEach((post, shooterIndex) => {
        let total = 0;
        let row = `<tr><td>${post.name}</td><td>`;

        const shotCells = [];
        for (let shotNum = 0; shotNum < totalShots; shotNum++) {
            const scoreIndex = shotNum * shooterCount + shooterIndex;
            const value = scoreIndex < shots.length ? formatShotCell(shots[scoreIndex]) : '';
            if (value === 'X') total += 1;
            shotCells.push(`<td>${value}</td>`);
        }

        row += `${total}</td>${shotCells.join('')}</tr>`;
        table += row;
    });

    table += `</tbody></table>`;
    return `<div class="print-section">${table}</div>`;
}

function renderPrintReport() {
    const reportContainer = document.getElementById('printReportContent');
    if (!reportContainer) return;

    const singles = JSON.parse(localStorage.getItem(singlesKey)) || [];
    const handicap = JSON.parse(localStorage.getItem(handicapKey)) || [];

    const singlesSection = buildEventScoreTable('Singles (16 yd)', singles);
    const handicapSection = buildEventScoreTable('Handicap', handicap);

    reportContainer.innerHTML = `
        <div class="print-report-header">
            <h2>${squadMetadata?.squadName || 'Squad Report'}</h2>
        </div>
        ${singlesSection}
        ${handicapSection}
    `;
}


// ---- Navigation ----
document.getElementById('singlesBtn').onclick = () => {
    window.location.href = `score.html?squadId=${squadId}&event=singles`;
};

document.getElementById('handicapBtn').onclick = () => {
    window.location.href = `score.html?squadId=${squadId}&event=handicap`;
};

document.getElementById('backBtn').onclick = () => {
    window.location.href = `squad.html?squadId=${squadId}`;
};

document.getElementById('printBtn').onclick = () => {
    renderPrintReport();
    window.print();
};

document.getElementById('submitBtn').onclick = () => {
    alert('Scores submitted (future SharePoint integration)');
};
