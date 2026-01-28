const params = new URLSearchParams(window.location.search);
const squadId = params.get('squadId');

const postKey = `squad-${squadId}-posts`;
const singlesKey = `squad-${squadId}-singles`;
const handicapKey = `squad-${squadId}-handicap`;

// ---- Load squad first (required) ----
fetch('squads.json')
    .then(res => res.json())
    .then(squadData => {
        const squad = squadData.squads.find(s => s.squadId == squadId);
        if (!squad) return;

        document.getElementById('squadName').textContent = squad.squadName;

        // ---- Load shooter order (ALWAYS) ----
        const posts = JSON.parse(localStorage.getItem(postKey)) || [];
        const postList = document.getElementById('postList');
        postList.innerHTML = '';

        posts.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `Post ${p.post}: ${p.name}`;
            postList.appendChild(li);
        });

        // ---- Load scores ----
        updateScoreDisplay();

        // ---- Load schedule (OPTIONAL) ----
        fetch('data/schedule.json')
            .then(res => res.json())
            .then(scheduleData => {
                const normalize = str =>
                    str?.toLowerCase().trim().replace(/\s+/g, ' ');

                const schedule =
                    scheduleData.squads.find(s =>
                        normalize(s.squadName) === normalize(squad.squadName)
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

document.getElementById('submitBtn').onclick = () => {
    alert('Scores submitted (future SharePoint integration)');
};
