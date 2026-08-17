exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Método não permitido' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return respond(500, { error: 'GROQ_API_KEY não configurada nas variáveis de ambiente do Netlify' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return respond(400, { error: 'JSON inválido no corpo da requisição' });
  }

  const { message, systemPrompt } = payload;
  if (!message || typeof message !== 'string') {
    return respond(400, { error: 'Campo "message" é obrigatório' });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt || 'Você é uma assistente pessoal brasileira. Responda em português, de forma curta, direta e natural (máximo 2 frases).' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return respond(res.status, { error: data?.error?.message || 'Erro na API da Groq' });
    }

    const reply = data.choices?.[0]?.message?.content || '';
    return respond(200, { reply });
  } catch (e) {
    return respond(500, { error: 'Falha ao contatar a API da Groq' });
  }
};

function respond(statusCode, bodyObj) {
  return { statusCode, headers: corsHeaders(), body: JSON.stringify(bodyObj) };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
        }
