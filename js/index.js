fetch('squads.json')
  .then(response => response.json())
  .then(data => {
    const list = document.getElementById('squadList');

    data.squads.forEach(squad => {
      const li = document.createElement('li');
      li.textContent = squad.squadName;

      li.onclick = () => {
        window.location.href = `squad.html?squadId=${squad.squadId}`;
      };

      list.appendChild(li);
    });
  });
