import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuratie voor ES Modules __dirname ondersteuning
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render gebruikt automatisch process.env.PORT
const PORT = process.env.PORT || 10000;

// 1. MIDDLEWARE (MOET BOVENAAN)
// Belangrijk: De JSON limiet moet hoog genoeg zijn voor de base64 afbeeldingen
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. DE API ROUTE (MOET BOVEN DE STATIC FILES)
// We luisteren naar '/xai' omdat je browser-screenshot laat zien dat dit het aangeroepen pad is
app.post('/xai', async (req, res) => {
  console.log('--- Nieuwe analyse aanvraag ontvangen ---');
  
  try {
    // Gebruik de sleutel uit het Render Dashboard (Environment Variables)
    const apiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
    
    if (!apiKey) {
      console.error('Configuratiefout: Geen API key gevonden op de server.');
      return res.status(500).json({ error: 'Server configuratie fout (API key mist)' });
    }

    // De eigenlijke fetch naar de xAI (Grok) API
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

    // Stuur het antwoord van Grok 1-op-1 terug naar de frontend
    res.send(text);

  } catch (error) {
    console.error('Proxy Server Error:', error.message);
    res.status(500).json({ error: 'Interne server fout tijdens communicatie met xAI' });
  }
});

// 3. STATISCHE BESTANDEN (VOOR DE FRONTEND)
// Serveer de bestanden uit de 'dist' map die Vite heeft gebouwd
app.use(express.static(path.join(__dirname, "dist")));

// 4. CATCH-ALL ROUTE (VOOR SPA ROUTING)
// Zorgt dat de React/Vite app blijft werken bij refreshes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server is live op poort ${PORT}`);
});