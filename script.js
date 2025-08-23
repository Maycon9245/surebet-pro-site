

async function buscarSurebets() {
  const corpo = document.getElementById("linhas");
  const loading = document.getElementById("loading");
  const search = document.getElementById("buscar").value.toLowerCase();
  const sportFilter = document.getElementById("sportFilter").value;
  const profitFilter = parseFloat(document.getElementById("profitFilter").value) || 0;

  loading.style.display = "block";
  corpo.innerHTML = "";

  try {
    const response = await fetch("https://maycon9245.github.io/surebet-data/surebets.json");
    if (!response.ok) throw new Error("Erro ao carregar dados");

    const data = await response.json();
    let surebets = data.surebets || [];

    // Filtros
    if (sportFilter !== "all") {
      surebets = surebets.filter(s => s.sport.toLowerCase().includes(sportFilter));
    }
    if (profitFilter > 0) {
      surebets = surebets.filter(s => s.profit >= profitFilter);
    }
    if (search) {
      surebets = surebets.filter(s => s.event.toLowerCase().includes(search));
    }

    if (surebets.length === 0) {
      corpo.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#8b949e;">🔍 Nenhuma surebet encontrada</td></tr>`;
      loading.style.display = "none";
      return;
    }

    const icons = {
      'Betfair': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Betfair.com-Logo.wine.svg',
      'William Hill': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/William_Hill_logo.svg',
      'Paddy Power': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Paddy_Power_logo.svg',
      'DraftKings': 'https://upload.wikimedia.org/wikipedia/commons/0/0a/DraftKings_Logo.svg',
      'FanDuel': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/FanDuel_Logo.svg',
      '888sport': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/888sport_Logo.svg',
      'Coral': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Coral_Logo.svg',
      'Bet365': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Bet365_logo.svg'
    };

    surebets.forEach(surebet => {
      const o1 = surebet.outcomes[0];
      const o2 = surebet.outcomes[1];
      const icon1 = icons[o1.bookmaker] || 'https://cdn-icons-png.flaticon.com/512/108/108755.png';
      const icon2 = icons[o2.bookmaker] || 'https://cdn-icons-png.flaticon.com/512/108/108755.png';

      corpo.innerHTML += `
        <tr>
          <td>${surebet.event}</td>
          <td>${surebet.start_time_br}</td>
          <td>${o1.team}</td>
          <td class="surebet">${o1.odd}</td>
          <td><img src="${icon1}" class="bookmaker-icon"> <span class="bookmaker">${o1.bookmaker}</span></td>
          <td>${o2.team}</td>
          <td class="surebet">${o2.odd}</td>
          <td><img src="${icon2}" class="bookmaker-icon"> <span class="bookmaker">${o2.bookmaker}</span></td>
          <td class="surebet">${surebet.profit}%</td>
          <td><button class="action-btn" onclick="abrirCasas(${JSON.stringify(surebet).replace(/"/g, '&quot;')})">🎯 Abrir</button></td>
        </tr>
      `;
    });

  } catch (error) {
    corpo.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#f85149;">❌ Erro: ${error.message}</td></tr>`;
  }

  loading.style.display = "none";
}

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

// Atualização automática a cada 30 segundos
setInterval(buscarSurebets, 30000);

// Carrega na primeira vez
buscarSurebets();
