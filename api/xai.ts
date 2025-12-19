import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.VITE_XAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    console.log('Request body size:', JSON.stringify(req.body).length, 'bytes');

    // Verstuur request naar Grok endpoint
    const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text();

    if (!text) {
      console.warn('Upstream API returned empty response');
      return res.status(upstream.status).json({ error: 'Empty response from upstream API' });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Upstream response is not valid JSON:', text);
      return res.status(upstream.status).json({
        error: 'Invalid JSON response from upstream API',
        raw: text,
      });
    }

    // Controleer dat het verwachte veld aanwezig is
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('Unexpected API response structure:', data);
      return res.status(upstream.status).json({
        error: 'Unexpected API response structure',
        raw: data,
      });
    }

    // Stuur de content terug naar de frontend
    res.status(upstream.status).json(data);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Handler Error:', message);
    res.status(500).json({ error: message });
  }
}
