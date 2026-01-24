import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getContractInfo } from './lib/fetcher.js';
import { runAnalizerSimulation, calculateScore } from './lib/analizer.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

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

// SPA Fallback: Serve index.html for any other route
app.get('*', (req, res) => {
    // Don't intercept API calls that missed
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Fallback to dist if public is missing
        const distIndexPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(distIndexPath)) {
            res.sendFile(distIndexPath);
        } else {
            res.status(404).send('Frontend not found. Please check build output.');
        }
    }
});

// Export app for Vercel
export default app;

// Only listen if run directly
// Robust check for main module execution
if (process.argv[1] === __filename || process.argv[1] === path.resolve(__filename)) {
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    server.on('error', (e) => {
        console.error('Server failed to start:', e);
});
}
