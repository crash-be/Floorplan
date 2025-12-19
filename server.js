import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Middleware voor grote JSON payloads (base64 afbeeldingen)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. De API Route (moet exact '/xai' zijn zoals in je screenshot)
app.post('/xai', async (req, res) => {
  console.log('--- Nieuwe analyse aanvraag ontvangen ---');
  
  try {
    const apiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
    
    if (!apiKey) {
      console.error('Configuratiefout: Geen API key gevonden.');
      return res.status(500).json({ error: 'API key niet geconfigureerd op server.' });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    
    if (!response.ok) {
      console.error(`Grok API Fout (${response.status}):`, text);
      return res.status(response.status).send(text);
    }

    // Stuur de JSON string terug
    res.send(text);

  } catch (error) {
    console.error('Proxy Server Error:', error.message);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// 3. Statische bestanden (Pas NA de API route!)
app.use(express.static(path.join(__dirname, "dist")));

// 4. Catch-all voor SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server draait op poort ${PORT}`);
});