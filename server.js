const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/surebets', async (req, res) => {
  try {
    const apiKey = 'aab8aaf30f7a54e6c28835b943dc4bc8';
    const url = `https://api.the-odds-api.com/v4/sports/soccer_brazil_campeonato_br/odds?apiKey=${apiKey}&regions=br&markets=h2h&oddsFormat=decimal`;
    const response = await axios.get(url);
    const events = response.data;
    const surebets = [];

    for (const event of events) {
      const bookmakers = event.bookmakers || [];
      for (let i = 0; i < bookmakers.length; i++) {
        for (let j = i + 1; j < bookmakers.length; j++) {
          const bm1 = bookmakers[i];
          const bm2 = bookmakers[j];
          const outcomes1 = bm1.markets?.[0]?.outcomes || [];
          const outcomes2 = bm2.markets?.[0]?.outcomes || [];
          if (outcomes1.length < 2 || outcomes2.length < 2) continue;
          const odd1 = parseFloat(outcomes1[0]?.price);
          const odd2 = parseFloat(outcomes2[1]?.price);
          if (!odd1 || !odd2) continue;
          const margin = (1 / odd1) + (1 / odd2);
          if (margin < 1) {
            const profit = ((1 / margin) - 1) * 100;
            surebets.push({
              id: `${event.id}-${bm1.key}-${bm2.key}`,
              sport: 'futebol',
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              bookmaker1: { id: bm1.key, name: bm1.title },
              bookmaker2: { id: bm2.key, name: bm2.title },
              profitPercentage: profit.toFixed(2)
            });
          }
        }
      }
    }
    res.json(surebets);
  } catch (err) {
    console.error('Erro na API:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SUREBET PRO rodando na porta ${PORT}`);
});