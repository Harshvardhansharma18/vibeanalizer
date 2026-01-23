import express from 'express';
import cors from 'cors';
import { getContractInfo } from './lib/fetcher.js';
import { runAnalizerSimulation, calculateScore } from './lib/analizer.js';

const app = express();
const PORT = process.env.PORT || 3000;

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
        
        const findings = await runAnalizerSimulation(address, logCallback);
        
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
                logs
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
