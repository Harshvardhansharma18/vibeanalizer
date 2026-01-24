import express from 'express';
import cors from 'cors';
import { getContractInfo } from './lib/fetcher.js';
import { runAnalizerSimulation, calculateScore } from './lib/analizer.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

// API Endpoint to get basic info and analizer results
app.post('/api/analizer', async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        // 1. Get Basic Info
        const info = await getContractInfo(address);

        // 2. Run Analizer Simulation
        // We capture logs to send back to UI if needed, or just send final findings
        const logs = [];
        const logCallback = (msg) => logs.push(msg.replace(/\u001b\[\d+m/g, '')); // Strip ANSI codes for JSON
        
        // PASS contractInfo to the analyzer for real data usage
        const { findings, contractType, contractDescription } = await runAnalizerSimulation(address, logCallback, info);
        
        // 3. Calculate Score
        const scoreData = calculateScore(findings);

        // Remove ANSI codes from interpretation
        scoreData.interpretation = scoreData.interpretation.replace(/\u001b\[\d+m/g, '');

        res.json({
            info,
            analizer: {
                findings,
                score: scoreData.score,
                interpretation: scoreData.interpretation,
                logs,
                contractType,
                contractDescription
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ... imports

// Export app for Vercel
export default app;

// Only listen if run directly
import { fileURLToPath } from 'url';
import path from 'path';

// Robust check for main module execution
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename || process.argv[1] === path.resolve(__filename)) {
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    server.on('error', (e) => {
        console.error('Server failed to start:', e);
});

// Fallback for SPA (Single Page Application)
// This ensures that if Vercel routes a non-API request to the server, we return the frontend
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).send('VibeAudit: Index file not found. Build might have failed.');
        }
    });
});
}
