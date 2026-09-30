import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleArchitectRequest } from './src/server/geminiBackend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

app.post('/api/architect', async (req, res) => {
  try {
    const result = await handleArchitectRequest(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Serve static frontend assets from dist in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Software Research & Planning Architect server running on http://0.0.0.0:${PORT}`);
});
