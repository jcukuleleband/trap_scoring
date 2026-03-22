// Load squads with offline fallback capability (T4-5.1.4.2)
loadSquadsWithOfflineFallback()
  .then(data => {
    const list = document.getElementById('squadList');
    const errorMsg = document.getElementById('errorMsg');

    data.squads.forEach(squad => {
      const li = document.createElement('li');
      li.textContent = squad.squadName;

      li.onclick = () => {
        window.location.href = `squad.html?squadId=${squad.squadId}`;
      };

      list.appendChild(li);
    });
  })
  .catch(error => {
    console.error('Error loading squads:', error);
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = 'Unable to load squads. Please ensure you have an internet connection or that the app was previously loaded with squad data.';
    }
  });
