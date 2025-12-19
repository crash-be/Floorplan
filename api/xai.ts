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

    // ✅ Gebruik correcte Grok endpoint
    const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text();

    try {
      const data = JSON.parse(text);
      res.status(upstream.status).json(data);
    } catch {
      console.error('Upstream response is not valid JSON:', text);
      res.status(upstream.status).json({
        error: 'Invalid JSON response from upstream API',
        raw: text,
      });
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Handler Error:', message);
    res.status(500).json({ error: message });
  }
}
