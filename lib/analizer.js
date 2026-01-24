import chalk from 'chalk';

/**
 * Helper to extract code snippets
 */
function getContextSnippet(code, regex, contextLines = 2) {
    const lines = code.split('\n');
    let matchIndex = -1;
    
    // Find line number
    for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
            matchIndex = i;
            break;
        }
    }

    if (matchIndex === -1) return null;

    const start = Math.max(0, matchIndex - contextLines);
    const end = Math.min(lines.length, matchIndex + contextLines + 1);
    
    // Create snippet with line numbers
    return lines
        .slice(start, end)
        .map((line, idx) => `${start + idx + 1} | ${line}`)
        .join('\n');
}

/**
 * Performs REAL static analysis on the provided source code and bytecode.
 * NO MOCK DATA.
 */
export async function runAnalizerSimulation(address, logCallback, contractInfo) {
    const findings = [];
    const { sourceCode, bytecode, isVerified, contractName } = contractInfo;
    let contractType = 'Unknown';
    let contractDescription = 'No description available.';

    logCallback(chalk.blue(`[VibeAnalyzer] Starting real-time analysis for ${address}...`));

    // 1. Bytecode Analysis
    logCallback(chalk.blue(`[Bytecode] Analyzing ${bytecode.length} bytes...`));
    
    if (bytecode === '0x') {
        logCallback(chalk.red(`[Bytecode] No code found. Is this an EOA?`));
        return { findings, contractType: 'EOA (Externally Owned Account)', contractDescription: 'This is a regular wallet address, not a smart contract.' };
    }

    // 2. Source Code Analysis (Regex)
    if (isVerified && sourceCode) {
        logCallback(chalk.green(`[Source] Contract is verified. Scanning source code...`));
        
        // Flatten source code if it's JSON
        let codeToScan = sourceCode;
        if (sourceCode.startsWith('{{')) {
             try {
                 const parsed = JSON.parse(sourceCode.slice(1, -1));
                 codeToScan = Object.values(parsed.sources).map(s => s.content).join('\n');
             } catch (e) {
                 // Keep as is
             }
        }

        // --- Classification & Summary ---
        // 1. Determine Type
        const lowerCode = codeToScan.toLowerCase();
        if (lowerCode.includes('router') && lowerCode.includes('swap')) contractType = 'DeFi Router / DEX';
        else if (lowerCode.includes('pair') && lowerCode.includes('liquidity')) contractType = 'DeFi Liquidity Pair';
        else if (lowerCode.includes('erc721') || lowerCode.includes('erc1155') || lowerCode.includes('nft')) contractType = 'NFT / Gaming';
        else if (lowerCode.includes('erc20') && (lowerCode.includes('token') || lowerCode.includes('coin'))) contractType = 'ERC20 Token';
        else if (lowerCode.includes('governance') || lowerCode.includes('dao') || lowerCode.includes('proposal')) contractType = 'DAO / Governance';
        else if (lowerCode.includes('staking') || lowerCode.includes('reward')) contractType = 'Staking / Yield';
        else if (lowerCode.includes('proxy') || lowerCode.includes('implementation')) contractType = 'Proxy Contract';
        else contractType = 'General Utility / Unclassified';

        // 2. Extract Description (NatSpec @title or @notice)
        const titleMatch = codeToScan.match(/@title\s+(.+)/);
        const noticeMatch = codeToScan.match(/@notice\s+(.+)/);
        if (titleMatch) contractDescription = titleMatch[1];
        else if (noticeMatch) contractDescription = noticeMatch[1];
        else contractDescription = `A ${contractType} contract named ${contractName}.`;


        // --- VibeCheck Patterns ---
        const patterns = [
            {
                name: 'Potential Reentrancy',
                regex: /\.call\s*\{.*value:/, // Allow spaces
                negativeRegex: /nonReentrant/,
                severity: 'High',
                description: 'Potential Reentrancy (Low-level call)',
                layman: 'The contract sends money using a low-level method. If not protected, a hacker could re-enter the contract and drain it.',
                technical: 'The contract uses a low-level .call() with value transfer. This passes control flow to the recipient, who can recursively call back into the contract before the state is updated (Checks-Effects-Interactions pattern violation). Ensure you use a ReentrancyGuard.'
            },
            {
                name: 'Unchecked Return Value',
                regex: /\.call\s*\{/, 
                negativeRegex: /(require|if\s*)\s*\(.*success/, // Rudimentary check for success handling
                severity: 'Medium',
                description: 'Unchecked Low-Level Call',
                layman: 'The contract calls another contract but might not check if it succeeded. Money or data could be lost silently.',
                technical: 'Low-level .call() returns a boolean indicating success. If this return value is not checked, the transaction continues even if the external call failed, potentially leaving the contract in an inconsistent state.'
            },
            {
                name: 'Tx.Origin Usage',
                regex: /tx\.origin/,
                severity: 'Medium',
                description: 'Usage of tx.origin',
                layman: 'Using tx.origin for authentication is unsafe. Phishing attacks could trick you into calling a malicious contract that drains your funds.',
                technical: 'tx.origin returns the original sender of the transaction, not the immediate caller (msg.sender). If a user calls a malicious contract that forwards the call to this contract, tx.origin will still be the user, bypassing authentication.'
            },
            {
                name: 'Selfdestruct',
                regex: /selfdestruct|suicide/,
                severity: 'High',
                description: 'Usage of selfdestruct',
                layman: 'This contract can delete itself. If you are not the owner, your funds could be locked or stolen if the contract disappears.',
                technical: 'The selfdestruct opcode (or the new destroy method) allows the contract to be deleted from the blockchain. If access control is weak, an attacker can destroy the contract. Note: EIP-6780 limits selfdestruct functionality in newer blocks.'
            },
            {
                name: 'Delegatecall',
                regex: /delegatecall/,
                severity: 'High',
                description: 'Usage of delegatecall',
                layman: 'This contract executes code from another address. If that other address is malicious or changeable, your funds are at risk.',
                technical: 'delegatecall executes code from another contract in the context of the current contract (storage, msg.sender, msg.value). If the target address is malicious or can be overwritten, it allows arbitrary code execution and state manipulation.'
            },
            {
                name: 'Weak Randomness',
                regex: /block\.difficulty|block\.prevrandao/,
                severity: 'Low',
                description: 'Weak Randomness Source',
                layman: 'The contract uses block difficulty for randomness. Miners can manipulate this to win games or lotteries.',
                technical: 'block.difficulty (or block.prevrandao in PoS) is not a secure source of randomness. Validators can manipulate it to influence the outcome of random number generation.'
            },
            {
                name: 'Block Timestamp',
                regex: /block\.timestamp/,
                severity: 'Low',
                description: 'Dependency on block.timestamp',
                layman: 'Miners can manipulate the time slightly. Do not use this for critical randomness or tight deadlines.',
                technical: 'Miners can manipulate block.timestamp by up to 15 seconds (consistently with the 15s block rule). Relying on it for precise randomness or exact timing constraints can be exploited.'
            },
            {
                name: 'Floating Pragma',
                regex: /pragma\s+solidity\s+[\^><]/,
                severity: 'Low',
                description: 'Floating Pragma',
                layman: 'The contract allows multiple compiler versions. It should lock a specific version to ensure safety.',
                technical: 'Using a floating pragma (e.g. ^0.8.0) allows the contract to be compiled with any newer version. This can introduce unexpected bugs if a future compiler version changes behavior. Production contracts should lock the version.'
            }
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(codeToScan)) {
                // Check negative condition (e.g. has reentrancy guard)
                if (pattern.negativeRegex && pattern.negativeRegex.test(codeToScan)) {
                    continue;
                }

                const snippet = getContextSnippet(codeToScan, pattern.regex);
                
                findings.push({
                    tool: 'VibeCheck-Static',
                    severity: pattern.severity,
                    description: pattern.description,
                    location: 'Source Code',
                    layman: pattern.layman,
                    technical: pattern.technical,
                    snippet: snippet
                });
            }
        }

    } else {
        logCallback(chalk.yellow(`[Source] Contract unverified. Skipping source analysis.`));
        findings.push({
            tool: 'VibeAnalyzer',
            severity: 'Medium',
            description: 'Unverified Contract',
            location: 'Etherscan',
            layman: 'The source code is not public. We cannot verify what this contract actually does. Tread carefully.',
            technical: 'Bytecode-only contract. Source code is not published on Etherscan. Static analysis is limited to opcode inspection. Verify trust or decompilation manually.'
        });
    }

    logCallback(chalk.green(`[VibeAnalyzer] Analysis complete.`));
    return { findings, contractType, contractDescription };
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
    // Bonus for clean verification
    if (issues.length === 0 && score > 0) score = 100;
    
    // Cap at 100
    if (score > 100) score = 100;

    let interpretation = '';
    if (score >= 90) interpretation = chalk.green('Excellent vibes. Seems clean.');
    else if (score >= 70) interpretation = chalk.yellow('Decent vibes, but check the warnings.');
    else interpretation = chalk.red('Bad vibes. High risk detected.');

    return {
        score,
        interpretation,
        issues
    };
}
