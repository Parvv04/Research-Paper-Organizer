// Simple Node.js Express backend to proxy Gemini API requests securely (ESM + built-in fetch)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Enable CORS for the frontend
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(cors());
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    const body = req.body;
    
    console.log('Sending request to Gemini API:', JSON.stringify(body));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Gemini API responded with ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Gemini API response:', data);
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.length) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    res.json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'Gemini API proxy error', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini proxy server running on port ${PORT}`);
});
