import readline from 'readline';
import { getContractInfo } from './lib/fetcher.js';
import { formatBasicInfo, formatAnalizerResults } from './lib/ui.js';
import { runAnalizerSimulation, calculateScore } from './lib/analizer.js';
import chalk from 'chalk';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function performAnalizer(address) {
    // Stage 2: Analizer
    console.log(chalk.magenta('\nStarting VIBE ANALIZER protocols...\n'));
    
    const findings = await runAnalizerSimulation(address, (msg) => {
        console.log(msg);
    });

    // Stage 3: Score
    const results = calculateScore(findings);
    console.log(formatAnalizerResults(results));
}

async function main() {
    const args = process.argv.slice(2);
    let address = args[0];
    const autoMode = args.includes('--auto');

    if (address && address.startsWith('--')) {
        // Handle case where address might be missing or mixed up
        address = undefined;
    }

    if (!address) {
        console.log(chalk.red('Please provide a smart contract address.'));
        console.log('Usage: node index.js <address> [--auto]');
        process.exit(1);
    }

    console.log(chalk.blue(`\nFetching data for ${address}...\n`));

    try {
        // Stage 1: Basic Info
        const info = await getContractInfo(address);
        console.log(formatBasicInfo(info));

        if (autoMode) {
             console.log(chalk.yellow('\n> analizer (auto-triggered)'));
             await performAnalizer(address);
             rl.close();
             process.exit(0);
        }

        // Interactive Prompt
        rl.question(chalk.yellow('\n> '), async (answer) => {
            if (answer.trim().toLowerCase() === 'analizer') {
                await performAnalizer(address);
                rl.close();
            } else {
                console.log('Exiting...');
                rl.close();
            }
        });

    } catch (error) {
        console.error(chalk.red('Error:', error.message));
        rl.close();
    }
}

main();
