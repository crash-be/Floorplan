// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware voor grote afbeeldingen
app.use(express.json({ limit: '10mb' }));

// --- DE API ROUTE MOET HIER ---
app.post('/api/xai', async (req, res) => {
  try {
    const apiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
    
    if (!apiKey) {
      console.error("Configuratie fout: Geen API key gevonden.");
      return res.status(500).json({ error: "Server configuratie fout (API key)" });
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
      return res.status(response.status).send(text);
    }

    res.send(text);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Interne server fout" });
  }
});

// --- PAS DAARNA STATISCHE BESTANDEN ---
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server live op poort ${PORT}`));