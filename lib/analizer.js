import chalk from 'chalk';

const TOOLS = [
    'Slither', 'Solhint', 'Aderyn', 'Oyente', 'Securify2', 
    'Mythril', 'Manticore', 'Echidna', 'Medusa', 'Halmos', 'Certora Prover'
];

// Mock vulnerabilities database
const VULNERABILITIES = [
    { tool: 'Slither', severity: 'High', description: 'Reentrancy vulnerability in withdraw function', location: 'Line 42' },
    { tool: 'Slither', severity: 'Low', description: 'Unused state variable', location: 'Line 12' },
    { tool: 'Mythril', severity: 'Medium', description: 'Integer overflow potential', location: 'Line 88' },
    { tool: 'Solhint', severity: 'Low', description: 'Code style indentation mismatch', location: 'Line 5' },
    { tool: 'Aderyn', severity: 'High', description: 'Unprotected selfdestruct', location: 'Line 105' },
    { tool: 'Securify2', severity: 'Medium', description: 'Unchecked return value', location: 'Line 66' },
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runAnalizerSimulation(address, logCallback) {
    const findings = [];
    
    for (const tool of TOOLS) {
        logCallback(chalk.blue(`[${tool}] Starting analysis...`));
        await sleep(800); // Simulate startup time

        // Simulate tool-specific "thinking"
        if (tool === 'Slither') {
            logCallback(chalk.gray(`[${tool}] Checking for reentrancy...`));
            await sleep(500);
            logCallback(chalk.gray(`[${tool}] Analysing state variable shadowing...`));
        } else if (tool === 'Mythril') {
            logCallback(chalk.gray(`[${tool}] Executing symbolic execution...`));
            await sleep(600);
        } else if (tool === 'Echidna') {
            logCallback(chalk.gray(`[${tool}] Running fuzzing campaign...`));
            await sleep(600);
        }

        // Randomly decide if this tool found something (deterministic for demo based on address char)
        // For simulation, we'll just pick some random issues from our DB
        const foundIssue = Math.random() > 0.5;
        
        if (foundIssue) {
            const issue = VULNERABILITIES.find(v => v.tool === tool) || 
                          { tool, severity: 'Low', description: 'Minor warning found', location: 'N/A' };
            
            logCallback(chalk.yellow(`[${tool}] Found issue: ${issue.description}`));
            findings.push(issue);
        } else {
            logCallback(chalk.green(`[${tool}] No critical issues found.`));
        }
        
        await sleep(300);
    }

    return findings;
}

export function calculateScore(issues) {
    let score = 100;
    let criticalCount = 0;

    issues.forEach(issue => {
        switch (issue.severity) {
            case 'Critical':
                score -= 20;
                criticalCount++;
                break;
            case 'High':
                score -= 10;
                break;
            case 'Medium':
                score -= 5;
                break;
            case 'Low':
                score -= 1;
                break;
        }
    });

    if (score < 0) score = 0;
    if (criticalCount === 0 && score > 0) score += 10; // Bonus
    if (score > 100) score = 100;

    let interpretation = '';
    if (score >= 90) interpretation = chalk.green('Excellent security posture.');
    else if (score >= 70) interpretation = chalk.yellow('Good, but requires attention to identified issues.');
    else interpretation = chalk.red('High risk! Immediate remediation required.');

    return {
        score,
        interpretation,
        issues
    };
}
