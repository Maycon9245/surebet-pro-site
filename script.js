async function buscarSurebets() {
  const resultsDiv = document.getElementById('results');
  const loading = document.getElementById('loading');

  loading.style.display = 'block';
  resultsDiv.innerHTML = '';

  try {
    // 🔗 Carrega o JSON do GitHub Pages
    const response = await fetch('https://maycon9245.github.io/surebet-data/surebets.json');
    
    if (!response.ok) {
      throw new Error("Erro ao carregar as surebets.");
    }

    const data = await response.json();
    const surebets = data.surebets;

    if (surebets.length === 0) {
      resultsDiv.innerHTML = '<p>Nenhuma surebet encontrada no momento.</p>';
      loading.style.display = 'none';
      return;
    }

    // Cria a tabela
    let table = `
      <table>
        <thead>
          <tr>
            <th>Evento</th>
            <th>Horário (BR)</th>
            <th>Time 1</th>
            <th>Odd</th>
            <th>Casa</th>
            <th>Time 2</th>
            <th>Odd</th>
            <th>Casa</th>
            <th>Lucro</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
    `;

    surebets.forEach(surebet => {
      const outcome1 = surebet.outcomes[0];
      const outcome2 = surebet.outcomes[1];

      table += `
        <tr>
          <td>${surebet.event}</td>
          <td>${surebet.start_time_br}</td>
          <td>${outcome1.team}</td>
          <td class="surebet">${outcome1.odd}</td>
          <td><span class="bookmaker">${outcome1.bookmaker}</span></td>
          <td>${outcome2.team}</td>
          <td class="surebet">${outcome2.odd}</td>
          <td><span class="bookmaker">${outcome2.bookmaker}</span></td>
          <td class="profit surebet">${surebet.profit}%</td>
          <td>
            <button onclick="abrirCasas(${JSON.stringify(surebet).replace(/"/g, '&quot;')})" style="
              background: #4ade80;
              color: #000;
              border: none;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
            ">
              🎯 Abrir Casas
            </button>
          </td>
        </tr>
      `;
    });

    table += `</tbody></table>`;
    resultsDiv.innerHTML = table;
    loading.style.display = 'none';

  } catch (error) {
    resultsDiv.innerHTML = `<p>❌ Erro: ${error.message}</p>`;
    loading.style.display = 'none';
  }
}

// Função para enviar dados para a extensão
function abrirCasas(surebet) {
  const dados = {
    event: surebet.event,
    team1: surebet.outcomes[0].team,
    odd1: surebet.outcomes[0].odd,
    bookmaker1: surebet.outcomes[0].bookmaker,
    team2: surebet.outcomes[1].team,
    odd2: surebet.outcomes[1].odd,
    bookmaker2: surebet.outcomes[1].bookmaker,
    profit: surebet.profit
  };

  chrome.storage.local.set({ surebetData: dados, ready: true }, () => {
    alert(`✅ Dados enviados para a extensão!\n\nAbra a extensão "Surebet PRO - AutoBet".`);
  });
}