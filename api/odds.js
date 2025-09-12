// api/odds.js
export default async function handler(req, res) {
  // Pega a chave das variáveis de ambiente do Vercel
  const API_KEY = process.env.ODDS_API_KEY;

  // Se não tiver chave, retorna erro claro
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'Chave da API não configurada nas variáveis de ambiente' 
    });
  }

  // Define o esporte (padrão: campeonato brasileiro)
  const { sport = 'soccer_brazil_campeonato' } = req.query;

  try {
    // Monta a URL sem espaços extras
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${API_KEY}&regions=br&markets=h2h&oddsFormat=decimal`;

    // Faz a requisição para a The Odds API
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'SurebetPRO/1.0',
        'Accept': 'application/json'
      }
    });

    // Se a resposta falhar, lança erro
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro da The Odds API: ${response.status} - ${errorText}`);
    }

    // Converte para JSON
    const data = await response.json();

    // Retorna os dados ao front-end
    res.status(200).json(data);
  } catch (error) {
    console.error('Erro no handler /api/odds:', error);
    res.status(500).json({ 
      error: 'Falha ao buscar odds', 
      details: error.message 
    });
  }
}

// Configuração obrigatória para rodar como Edge Function no Vercel
export const config = {
  runtime: 'edge',
};
