// api/odds.js
export default async function handler(req) {
  const API_KEY = process.env.ODDS_API_KEY;

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Chave da API não configurada' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { sport = 'soccer_brazil_campeonato' } = Object.fromEntries(
    new URL(req.url).searchParams
  );

  try {
    // MUDAMOS regions=br PARA regions=eu (ou us)
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;

    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'SurebetPRO/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro no handler:', error);
    return new Response(
      JSON.stringify({ error: 'Falha ao buscar odds', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
