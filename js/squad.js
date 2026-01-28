const params = new URLSearchParams(window.location.search);
const squadId = params.get('squadId');

const MAX_POSTS = 5;
const STORAGE_KEY = `squad-${squadId}-posts`;

let selectedShooters = [];

// Load saved data if it exists
const savedPosts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

fetch('squads.json')
  .then(res => res.json())
  .then(data => {
    const squad = data.squads.find(s => s.squadId == squadId);
    document.getElementById('squadName').textContent = squad.squadName;

    const list = document.getElementById('memberList');

    squad.members.forEach(member => {
      const li = document.createElement('li');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';

      const label = document.createElement('label');
      label.textContent = member.name + (member.isBlind ? ' (Blind)' : '');

      // Restore checked state from storage
      const saved = savedPosts.find(p => p.shooterId === member.id);
      if (saved) {
        checkbox.checked = true;
        selectedShooters[saved.post - 1] = member;
      }

      li.onclick = () => {
        checkbox.checked = !checkbox.checked;
        handleSelection(member, checkbox);
      };

      checkbox.onclick = (e) => {
        e.stopPropagation();
        handleSelection(member, checkbox);
      };

      li.appendChild(checkbox);
      li.appendChild(label);
      list.appendChild(li);
    });

    renderPostTable();
  });

function handleSelection(member, checkbox) {
  if (checkbox.checked) {
    if (selectedShooters.includes(member)) return;

    if (selectedShooters.filter(Boolean).length >= MAX_POSTS) {
      checkbox.checked = false;
      return;
    }

    // Put shooter in first open post
    const openIndex = selectedShooters.findIndex(s => !s);
    selectedShooters[openIndex === -1 ? selectedShooters.length : openIndex] = member;
  } else {
    selectedShooters = selectedShooters.map(s =>
      s && s.id === member.id ? null : s
    );
  }

  renderPostTable();
}

function renderPostTable() {
  const rows = document.querySelectorAll('#postTable tbody tr');

  rows.forEach((row, index) => {
    row.cells[1].textContent =
      selectedShooters[index] ? selectedShooters[index].name : '';
  });
}

document.getElementById('clearBtn').onclick = () => {
  selectedShooters = [];

  document
    .querySelectorAll('#memberList input[type="checkbox"]')
    .forEach(cb => cb.checked = false);

  localStorage.removeItem(STORAGE_KEY);
  renderPostTable();
};

document.getElementById('submitBtn').onclick = () => {
  const payload = selectedShooters
    .map((shooter, index) => shooter && ({
      post: index + 1,
      shooterId: shooter.id,
      name: shooter.name,
      isBlind: shooter.isBlind
    }))
    .filter(Boolean);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  window.location.href = 'index.html';
};
