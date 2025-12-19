import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Geen node-fetch nodig als je op Node 18+ zit, we gebruiken de globale fetch

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Limieten omhoog
app.use(express.json({ limit: '10mb' }));

// 2. DE API ROUTE (Moet boven de static files!)
app.post('/api/xai', async (req, res) => {
  try {
    const apiKey = process.env.VITE_XAI_API_KEY || process.env.XAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Geen API key gevonden op server" });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body) // Geef de body door die de frontend stuurt
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Server proxy error:", error);
    res.status(500).json({ error: "Interne server fout" });
  }
});

// 3. Statische bestanden serveren
app.use(express.static(path.join(__dirname, "dist")));

// 4. SPA Catch-all
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));