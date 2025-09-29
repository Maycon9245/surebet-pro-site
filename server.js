// server.js — versão SEM dependência da Odds API
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota de API com dados fake (não depende da Odds API)
app.get('/api/surebets', (req, res) => {
  const fakeSurebets = [
    {
      id: "1",
      sport: "futebol",
      homeTeam: "Flamengo",
      awayTeam: "Palmeiras",
      bookmaker1: { id: "stake", name: "Stake" },
      bookmaker2: { id: "betano", name: "Betano" },
      profitPercentage: "12.50"
    },
    {
      id: "2",
      sport: "basquete",
      homeTeam: "Lakers",
      awayTeam: "Celtics",
      bookmaker1: { id: "pinnacle", name: "Pinnacle" },
      bookmaker2: { id: "bet365", name: "Bet365" },
      profitPercentage: "8.75"
    }
  ];
  res.json(fakeSurebets);
});

// Fallback para SPA (serve index.html para qualquer rota)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ⚠️ OBRIGATÓRIO no Render: escutar em 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SUREBET PRO rodando na porta ${PORT}`);
});