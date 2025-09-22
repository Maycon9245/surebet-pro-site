// server.js (CommonJS)
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// --- Rota principal de surebets ---
app.get('/api/surebets', async (req, res) => {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ODDS_API_KEY não configurada' });
    }

    // Lista de esportes que vamos consultar (pode ajustar conforme a documentação da sua conta The Odds API)
    const sports = [
      'soccer_brazil_serie_a',
      'soccer_epl',
      'basketball_nba'
    ];

    const allSurebets = [];

    for (const sport of sports) {
      try {
        const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us,br&markets=h2h&oddsFormat=decimal`;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`The Odds API respondeu ${response.status} para ${sport}`);
          continue;
        }
        const data = await response.json();
        if (!Array.isArray(data)) continue;

        for (const event of data) {
          const bookmakers = event.bookmakers || [];
          // comparar pares de bookmakers procurando discrepâncias
          for (let i = 0; i < bookmakers.length; i++) {
            for (let j = i + 1; j < bookmakers.length; j++) {
              const bm1 = bookmakers[i];
              const bm2 = bookmakers[j];

              // validações robustas
              const market1 = bm1 && bm1.markets && bm1.markets[0];
              const market2 = bm2 && bm2.markets && bm2.markets[0];
              const outcomes1 = market1 && Array.isArray(market1.outcomes) ? market1.outcomes : null;
              const outcomes2 = market2 && Array.isArray(market2.outcomes) ? market2.outcomes : null;
              if (!outcomes1 || !outcomes2) continue;

              // Para mercados h2h: outcomes[0] = home, outcomes[1] = away (quando disponível)
              const o1_home = outcomes1[0] && outcomes1[0].price;
              const o2_away = outcomes2[1] && outcomes2[1].price;
              if (!o1_home || !o2_away) continue;

              const odd1 = parseFloat(o1_home);
              const odd2 = parseFloat(o2_away);
              if (!odd1 || !odd2) continue;

              const margin = (1 / odd1) + (1 / odd2);
              if (margin < 1) {
                const profitPercentage = ((1 / margin) - 1) * 100;
                allSurebets.push({
                  id: `${event.id}-${bm1.key}-${bm2.key}`,
                  homeTeam: event.home_team,
                  awayTeam: event.away_team,
                  sport: event.sport_title || sport,
                  bookmaker1: { id: bm1.key, name: bm1.title, odd: odd1 },
                  bookmaker2: { id: bm2.key, name: bm2.title, odd: odd2 },
                  profitPercentage: profitPercentage.toFixed(2),
                  commenceTime: event.commence_time
                });
              }
            }
          }
        }
      } catch (innerErr) {
        console.error(`Erro consultando sport ${sport}:`, innerErr?.message || innerErr);
        // continuar com próximo esporte
      }
    }

    return res.json(allSurebets);
  } catch (err) {
    console.error('Erro ao buscar surebets reais:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// --- Rota de bookmakres (estática) ---
app.get('/api/bookmakers', (req, res) => {
  const bookmakers = [
    { id: 'bet365', name: 'Bet365', urlTemplate: 'https://www.bet365.com/#/AS/B{stake}/' },
    { id: 'sportingbet', name: 'Sportingbet', urlTemplate: 'https://www.sportingbet.com/pt-br/aposta-rapida?stake={stake}' },
    { id: 'betfair', name: 'Betfair', urlTemplate: 'https://www.betfair.bet.br/apostas?stake={stake}' },
    { id: 'pinnacle', name: 'Pinnacle', urlTemplate: 'https://www.pinnacle.com/pt/sports?stake={stake}' },
    { id: '1xbet', name: '1xBet', urlTemplate: 'https://1xbet.com/pt/live?amount={stake}' },
    { id: '22bet', name: '22Bet', urlTemplate: 'https://22bet.com/pt/live?stake={stake}' },
    { id: 'betway', name: 'Betway', urlTemplate: 'https://betway.com/sport?betamount={stake}' }
  ];
  res.json(bookmakers);
});

// --- Webhook Stripe (exemplo) ---
// Se for usar webhook, configure STRIPE_WEBHOOK_SECRET e valide eventos conforme a doc do Stripe.
// Aqui mantemos apenas a rota de exemplo (aceita raw body).
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    console.log('Webhook do Stripe recebido (exemplo). Signature:', sig ? 'presente' : 'ausente');
    // processamento real do webhook fica aqui...
    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook do Stripe:', error);
    res.status(400).send('Erro no webhook');
  }
});

// --- Servir SPA (fallback) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`🚀 SUREBET PRO rodando na porta ${PORT}`);
});
