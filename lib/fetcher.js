import { ethers } from 'ethers';
import axios from 'axios';
import chalk from 'chalk';

// Public RPC - fallback list
const RPC_URLS = [
    'https://rpc.ankr.com/eth',
    'https://eth.llamarpc.com',
    'https://cloudflare-eth.com',
    'https://1rpc.io/eth',
    'https://eth-mainnet.public.blastapi.io',
    'https://rpc.flashbots.net'
];

export async function getContractInfo(address) {
    if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address format.');
    }

    let balanceWei, code, txCount;
    let providerSuccess = false;

    // Try each RPC provider until one works for the actual data fetching
    for (const url of RPC_URLS) {
        try {
            const provider = new ethers.JsonRpcProvider(url);
            
            // Set a timeout for the request to avoid hanging
            const dataPromise = Promise.all([
                provider.getBalance(address),
                provider.getCode(address),
                provider.getTransactionCount(address, 'latest')
            ]);

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('RPC Request Timeout')), 5000)
            );

            [balanceWei, code, txCount] = await Promise.race([dataPromise, timeoutPromise]);
            
            providerSuccess = true;
            break; // Success, exit loop
        } catch (e) {
            // console.warn(`RPC ${url} failed: ${e.message}`); // Optional: debug log
            continue; // Try next provider
        }
    }

    if (!providerSuccess) {
        throw new Error('Failed to fetch contract data from all available RPC providers. Please try again later.');
    }

    const isContract = code !== '0x';
    const balance = ethers.formatEther(balanceWei);

    // 2. Attempt to fetch source code from Blockscout (Primary) or Etherscan (Fallback)
    let sourceCode = null;
    let contractName = 'Unknown';
    let isVerified = false;

    // Helper to try multiple source code providers
    const fetchSource = async () => {
        // Priority 1: Blockscout (Reliable, no key required)
        try {
            const response = await axios.get(`https://eth.blockscout.com/api`, {
                params: { module: 'contract', action: 'getsourcecode', address: address },
                timeout: 8000
            });
            if (response.data.status === '1' && response.data.result[0]?.SourceCode) {
                return {
                    source: response.data.result[0].SourceCode,
                    name: response.data.result[0].ContractName,
                    verified: true
                };
            }
        } catch (e) { /* Ignore */ }

        // Priority 2: Etherscan (Often rate limited without key)
        try {
            const response = await axios.get(`https://api.etherscan.io/v2/api`, {
                params: { chainid: 1, module: 'contract', action: 'getsourcecode', address: address, apikey: 'YourApiKeyToken' },
                timeout: 5000
            });
            if (response.data.status === '1' && response.data.result[0]?.SourceCode) {
                 return {
                    source: response.data.result[0].SourceCode,
                    name: response.data.result[0].ContractName,
                    verified: true
                };
            }
        } catch (e) { /* Ignore */ }
        
        // Priority 3: Sourcify (Open source alternative)
        try {
            const response = await axios.get(`https://sourcify.dev/server/files/1/${address}`, { timeout: 5000 });
            if (response.data.files && response.data.files.length > 0) {
                 // Concatenate all files
                 const combinedSource = response.data.files.map(f => `// File: ${f.path}\n${f.content}`).join('\n');
                 return {
                    source: combinedSource,
                    name: 'SourcifyVerified',
                    verified: true
                };
            }
        } catch (e) { /* Ignore */ }

        return { source: null, name: 'Unknown', verified: false };
    };

    const sourceData = await fetchSource();
    sourceCode = sourceData.source;
    contractName = sourceData.name;
    isVerified = sourceData.verified;

    // 3. Fetch Analytics Data (Recent Transactions)
    let recentTxs = [];
    let analytics = {
        volume: 0,
        uniqueInteractors: 0,
        lastActive: 'Never',
        txs: []
    };

    try {
        // Use Blockscout for reliable, key-less access to recent transactions
        const txResponse = await axios.get(`https://eth.blockscout.com/api`, {
            params: {
                module: 'account',
                action: 'txlist',
                address: address,
                page: 1,
                offset: 50, // Get last 50 for better stats
                sort: 'desc'
            },
            timeout: 8000
        });

        if (txResponse.data.status === '1' && Array.isArray(txResponse.data.result)) {
            recentTxs = txResponse.data.result;
            
            // Process Analytics
            const uniqueSenders = new Set();
            let totalVolume = BigInt(0);
            
            recentTxs.forEach(tx => {
                uniqueSenders.add(tx.from);
                if (tx.value) totalVolume += BigInt(tx.value);
            });

            analytics.volume = ethers.formatEther(totalVolume);
            analytics.uniqueInteractors = uniqueSenders.size;
            if (recentTxs.length > 0) {
                const lastTs = parseInt(recentTxs[0].timeStamp) * 1000;
                analytics.lastActive = new Date(lastTs).toLocaleDateString();
            }
            analytics.txs = recentTxs.slice(0, 5).map(tx => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                time: new Date(parseInt(tx.timeStamp) * 1000).toLocaleTimeString(),
                isError: tx.isError === '1' || tx.txreceipt_status === '0'
            }));
        }
    } catch (e) {
        // console.warn('Failed to fetch analytics:', e.message);
    }

    return {
        address,
        isContract,
        balance,
        bytecode: code,
        creator: 'Unknown', // Hard to get without expensive archive node queries
        txCount,
        isVerified,
        contractName,
        sourceCode,
        analytics // Add analytics to output
    };
}
