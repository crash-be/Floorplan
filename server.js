import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Zorg dat je 'node-fetch' hebt geïnstalleerd: npm install node-fetch

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Middleware voor grote payloads (Afbeeldingen)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. De API Route (Deze ontbrak nog in je voorbeeld)
app.post('/api/xai', async (req, res) => {
  try {
    const apiKey = process.env.VITE_XAI_API_KEY; 
    
    // We sturen de body die we van de frontend krijgen 1-op-1 door naar xAI
    const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Serve static frontend (zorg dat dit NA de API routes komt)
app.use(express.static(path.join(__dirname, "dist")));

// 4. Catch-all: stuur alle andere verzoeken naar index.html (voor SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});