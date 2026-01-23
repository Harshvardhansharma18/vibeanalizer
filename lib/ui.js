import Table from 'cli-table3';
import chalk from 'chalk';

export function formatBasicInfo(info) {
    let output = `
# Smart Contract Report: ${info.address}

## Basic Information
`;

    const table = new Table({
        head: [chalk.cyan('Key'), chalk.cyan('Value')],
        colWidths: [20, 60]
    });

    table.push(
        ['Contract Name', info.contractName || 'N/A'],
        ['Creator', info.creator],
        ['Balance', `${info.balance} ETH`],
        ['Transactions', info.txCount],
        ['Verified', info.isVerified ? chalk.green('Yes') : chalk.red('No')],
        ['Bytecode Size', `${info.bytecode.length} bytes`]
    );

    output += table.toString();
    output += `\n\n### [VIBE ANALIZER Button] - Respond with 'analizer' to proceed.`;
    
    return output;
}

export function formatAnalizerResults(results) {
    let output = `\n# VIBE ANALIZER RESULTS\n`;

    const table = new Table({
        head: [chalk.cyan('Tool'), chalk.cyan('Severity'), chalk.cyan('Issue'), chalk.cyan('Location')],
        wordWrap: true
    });

    results.issues.forEach(issue => {
        let severityColor = chalk.white;
        if (issue.severity === 'Critical') severityColor = chalk.red.bold;
        else if (issue.severity === 'High') severityColor = chalk.red;
        else if (issue.severity === 'Medium') severityColor = chalk.yellow;
        else if (issue.severity === 'Low') severityColor = chalk.blue;

        table.push([
            issue.tool,
            severityColor(issue.severity),
            issue.description,
            issue.location || 'N/A'
        ]);
    });

    output += table.toString();

    // Summary Score
    output += `\n\n## Security Score: ${results.score}/100\n`;
    output += `Interpretation: ${results.interpretation}\n`;
    output += chalk.gray('\nDisclaimer: This is an automated estimate; not a substitute for manual review.\n');

    return output;
}
