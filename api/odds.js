

// api/odds.js
export default async function handler(req, res) {
  const API_KEY = process.env.ODDS_API_KEY;
  const { sport = 'soccer_brazil_campeonato' } = req.query;

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${API_KEY}&regions=br&markets=h2h&oddsFormat=decimal`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SurebetPRO/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao buscar odds:', error);
    res.status(500).json({ 
      error: 'Falha ao buscar odds', 
      details: error.message 
    });
  }
}

export const config = {
  runtime: 'edge',
};
