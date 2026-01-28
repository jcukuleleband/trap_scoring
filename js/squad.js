document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const squadId = params.get('squadId');

  const STORAGE_KEY = `squad-${squadId}-posts`;
  const SINGLES_KEY = `squad-${squadId}-singles`;
  const HANDICAP_KEY = `squad-${squadId}-handicap`;

  const squadNameEl = document.getElementById('squadName');
  const postTableBody = document.getElementById('postTable');
  const errorMsgEl = document.getElementById('errorMsg');

  const backBtn = document.getElementById('backToIndexBtn');
  const submitBtn = document.getElementById('submitBtn');

  const modal = document.getElementById('confirmModal');
  const eraseBtn = document.getElementById('eraseBtn');
  const ignoreBtn = document.getElementById('ignoreBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  // Guard: required elements must exist
  if (!submitBtn || !backBtn || !postTableBody) {
    console.error('Squad page missing required elements.');
    return;
  }

  let pendingSelections = null;

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
  }

  function finalizeSubmit(selections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    closeModal();
    window.location.href = `dashboard.html?squadId=${squadId}`;
  }

  // Load squad + build dropdowns
  fetch('squads.json')
    .then(res => res.json())
    .then(data => {
      const squad = data.squads.find(s => String(s.squadId) === String(squadId));
      if (!squad) {
        if (squadNameEl) squadNameEl.textContent = 'Squad not found';
        return;
      }

      if (squadNameEl) squadNameEl.textContent = squad.squadName;

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

      // There are 5 rows already in the tbody
      for (let i = 0; i < 5; i++) {
        const row = postTableBody.rows[i];
        if (!row) continue;

        const cell = row.cells[1];
        cell.innerHTML = ''; // clear

        const select = document.createElement('select');

        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '-- Select Shooter --';
        select.appendChild(emptyOpt);

        squad.members.forEach(member => {
          const opt = document.createElement('option');
          opt.value = member.id;
          opt.textContent = member.name + (member.isBlind ? ' (Blind)' : '');
          select.appendChild(opt);
        });

        const existing = saved.find(p => p.post === i + 1);
        if (existing) select.value = existing.shooterId;

        cell.appendChild(select);
      }
    })
    .catch(err => {
      console.error('Failed to load squads.json', err);
      if (errorMsgEl) errorMsgEl.textContent = 'Error loading squad data.';
    });

  // Submit click
  submitBtn.addEventListener('click', () => {
    const rows = postTableBody.querySelectorAll('tr');
    const selections = [];
    const seen = new Map(); // shooterId -> shooterName

    for (let i = 0; i < rows.length; i++) {
      const select = rows[i].querySelector('select');
      if (!select) continue;

      const shooterId = select.value;
      if (!shooterId) continue;

      const shooterName = select.options[select.selectedIndex].text;

      if (seen.has(shooterId)) {
        if (errorMsgEl) {
          errorMsgEl.textContent =
            `Error: "${shooterName}" is assigned to more than one post.`;
        }
        return;
      }

      seen.set(shooterId, shooterName);
      selections.push({ post: i + 1, shooterId, name: shooterName });
    }

    if (errorMsgEl) errorMsgEl.textContent = '';

    const hasScores =
      localStorage.getItem(SINGLES_KEY) || localStorage.getItem(HANDICAP_KEY);

    if (hasScores && modal && eraseBtn && ignoreBtn && cancelBtn) {
      pendingSelections = selections;
      openModal();
      return;
    }

    // If no scores exist OR modal isn't available, proceed normally
    finalizeSubmit(selections);
  });

  // Modal buttons
  if (eraseBtn) {
    eraseBtn.addEventListener('click', () => {
      localStorage.removeItem(SINGLES_KEY);
      localStorage.removeItem(HANDICAP_KEY);
      if (pendingSelections) finalizeSubmit(pendingSelections);
    });
  }

  if (ignoreBtn) {
    ignoreBtn.addEventListener('click', () => {
      if (pendingSelections) finalizeSubmit(pendingSelections);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      pendingSelections = null;
      closeModal();
    });
  }

  // Back button
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});
