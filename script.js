async function buscarSurebets() {
  const resultsDiv = document.getElementById('results');
  const loading = document.getElementById('loading');

  loading.style.display = 'block';
  resultsDiv.innerHTML = '';

  try {
    const response = await fetch('https://maycon9245.github.io/surebet-data/surebets.json');
    
    if (!response.ok) {
      throw new Error("Erro ao carregar as surebets.");
    }

    const data = await response.json();
    let surebets = data.surebets;

    if (surebets.length === 0) {
      resultsDiv.innerHTML = '<p>Nenhuma surebet encontrada no momento.</p>';
    } else {
      let table = `
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Esporte</th>
              <th>Horário (BR)</th>
              <th>Oportunidade</th>
              <th class="surebet">Lucro %</th>
            </tr>
          </thead>
          <tbody>
      `;

      surebets.forEach(s => {
        let opportunities = '';
        s.outcomes.forEach(outcome => {
          opportunities += `<strong>${outcome.team}:</strong> @${outcome.odd} (${outcome.bookmaker})<br>`;
        });

        table += `
          <tr>
            <td>${s.event}</td>
            <td>${s.sport}</td>
            <td>${s.start_time_br}</td>
            <td>${opportunities}</td>
            <td class="surebet">${s.profit}%</td>
          </tr>
        `;
      });

      table += `</tbody></table>`;
      resultsDiv.innerHTML = table;
    }
  } catch (error) {
    resultsDiv.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
  } finally {
    loading.style.display = 'none';
  }
}
