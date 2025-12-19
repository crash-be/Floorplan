import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render geeft automatisch een poort mee via process.env.PORT
const PORT = process.env.PORT || 10000;

// 1. Middleware voor grote payloads (cruciaal voor base64 afbeeldingen)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. De API Route
app.post('/api/xai', async (req, res) => {
  console.log('--- Nieuwe analyse aanvraag ontvangen ---');
  
  try {
    const apiKey = process.env.VITE_XAI_API_KEY || process.env.XAI_API_KEY; 
    
    if (!apiKey) {
      console.error('FOUT: VITE_XAI_API_KEY ontbreekt in environment variables.');
      return res.status(500).json({ error: 'API sleutel niet geconfigureerd op server.' });
    }

    const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    // Haal de response eerst als tekst op om te voorkomen dat .json() crasht bij lege data
    const rawText = await upstream.text();
    
    if (!upstream.ok) {
      console.error(`Upstream Fout (${upstream.status}):`, rawText);
      return res.status(upstream.status).json({ 
        error: 'Grok API fout', 
        details: rawText 
      });
    }

    // Stuur de JSON netjes terug naar de frontend
    const data = JSON.parse(rawText);
    res.status(200).json(data);

  } catch (err) {
    console.error('Server Error tijdens fetch:', err);
    res.status(500).json({ error: 'Interne server fout bij communicatie met Grok' });
  }
});

// 3. Serve static frontend (Zorg dat de 'dist' map bestaat na 'npm run build')
app.use(express.static(path.join(__dirname, "dist")));

// 4. Catch-all voor SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server draait op poort ${PORT}`);
});