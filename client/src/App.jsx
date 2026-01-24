import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, AlertTriangle, CheckCircle, Terminal, Search, Activity, Lock, TrendingUp, ExternalLink } from 'lucide-react';

function App() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  const runAnalyzer = async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    setLogs([]);
    setData(null);

    // Real log stream effect (sync with actual backend progress if possible, or simple loading)
    // Since backend is fast now (no sleep), we just show a "Fetching..." state
    const loadingSteps = ['Connecting to RPC...', 'Fetching Contract Data...', 'Analyzing Bytecode...', 'Scanning Source Code...'];
    let stepIndex = 0;
    
    setLogs(['[VibeAnalyzer] Initializing...']);
    
    const logInterval = setInterval(() => {
        if (stepIndex < loadingSteps.length) {
            setLogs(prev => [...prev, `[System] ${loadingSteps[stepIndex]}`]);
            stepIndex++;
        }
    }, 500);

    try {
      const response = await axios.post('/api/analizer', { address });
      clearInterval(logInterval);
      
      // Merge our UI logs with actual backend logs
      const backendLogs = response.data.analizer.logs || [];
      setLogs(prev => [...prev, ...backendLogs, '[System] Analysis Complete.']);
      
      setData(response.data);
    } catch (err) {
      clearInterval(logInterval);
      setError(err.response?.data?.error || 'Analysis failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-green-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black pointer-events-none" />
      
      <main className="relative container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 blur-xl opacity-50 animate-pulse" />
              <Shield className="w-16 h-16 text-green-400 relative z-10" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
            VIBE ANALYZER
          </h1>
          <p className="text-gray-400 text-lg">
            "No cap, is your contract clean?"
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 shadow-2xl shadow-green-900/20"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-green-400 placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <button
              onClick={runAnalyzer}
              disabled={loading || !address}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
              {loading ? 'ANALYZING...' : 'CHECK VIBES'}
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Live Logs Terminal */}
        <AnimatePresence>
          {(loading || logs.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8"
            >
              <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-sm h-48 overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-2 text-gray-500 mb-2 sticky top-0 bg-black pb-2 border-b border-gray-900">
                  <Terminal className="w-4 h-4" />
                  <span>SYSTEM LOGS</span>
                </div>
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-green-500/80 mb-1"
                  >
                    <span className="text-gray-600 mr-2">{new Date().toLocaleTimeString()}</span>
                    {log}
                  </motion.div>
                ))}
                {loading && (
                  <div className="animate-pulse text-green-500">_</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Contract Metadata Card */}
              <div className="md:col-span-3 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Shield className="w-32 h-32 text-green-500" />
                  </div>
                  <div className="flex-1 z-10">
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                          {data.info.contractName || 'Unknown Contract'}
                          {data.info.isVerified && <CheckCircle className="w-5 h-5 text-green-400" />}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                           <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 font-bold uppercase tracking-wider">
                              {data.analizer.contractType}
                           </span>
                           <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-400 text-xs border border-gray-700 font-mono">
                              {address}
                           </span>
                      </div>
                      
                      <div className="bg-black/30 rounded-xl p-4 border border-gray-800/50 mb-6">
                          <p className="text-gray-400 text-sm leading-relaxed italic">
                              "{data.analizer.contractDescription}"
                          </p>
                      </div>

                      {/* Live Stats & Analytics */}
                      <div className="flex flex-wrap gap-4 items-center">
                          <div className="bg-black/40 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
                              <Activity className="w-4 h-4 text-blue-400" />
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Transactions</p>
                                  <p className="text-white font-mono">{data.info.txCount}</p>
                              </div>
                          </div>
                          <div className="bg-black/40 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
                              <div className="text-purple-400 font-bold text-lg">Ξ</div>
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Balance</p>
                                  <p className="text-white font-mono">{parseFloat(data.info.balance).toFixed(4)} ETH</p>
                              </div>
                          </div>
                          <div className="bg-black/40 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
                              <Terminal className="w-4 h-4 text-green-400" />
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Size</p>
                                  <p className="text-white font-mono">{((data.info.bytecode.length - 2) / 2 / 1024).toFixed(2)} KB</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Analytics & Activity Section */}
            {data.info.analytics && (
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Activity Stats */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            Activity (Last 50 Txs)
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-2xl font-bold text-white">{parseFloat(data.info.analytics.volume).toFixed(4)} ETH</p>
                                <p className="text-xs text-gray-500">Recent Volume</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{data.info.analytics.uniqueInteractors}</p>
                                <p className="text-xs text-gray-500">Unique Interactors (Recent)</p>
                            </div>
                            <div>
                                <p className="text-lg font-mono text-blue-400">{data.info.analytics.lastActive}</p>
                                <p className="text-xs text-gray-500">Last Active Date</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="md:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-400" />
                            Recent Transactions
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-gray-500 border-b border-gray-800">
                                        <th className="py-2 font-normal">Hash</th>
                                        <th className="py-2 font-normal">From</th>
                                        <th className="py-2 font-normal">Value (ETH)</th>
                                        <th className="py-2 font-normal">Time</th>
                                        <th className="py-2 font-normal">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {data.info.analytics.txs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-4 text-center text-gray-500 italic">No recent transactions found.</td>
                                        </tr>
                                    ) : (
                                        data.info.analytics.txs.map((tx, i) => (
                                            <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-white/5 transition-colors">
                                                <td className="py-3 font-mono text-blue-400">
                                                    <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="hover:underline">
                                                        {tx.hash.substring(0, 8)}...
                                                    </a>
                                                </td>
                                                <td className="py-3 font-mono text-gray-400" title={tx.from}>
                                                    {tx.from.substring(0, 6)}...{tx.from.substring(38)}
                                                </td>
                                                <td className="py-3 text-white font-mono">
                                                    {parseFloat(tx.value).toFixed(4)}
                                                </td>
                                                <td className="py-3 text-gray-500 text-xs">
                                                    {tx.time}
                                                </td>
                                                <td className="py-3">
                                                    {tx.isError ? (
                                                        <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/20">Failed</span>
                                                    ) : (
                                                        <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Success</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
              )}

              {/* Score Card */}
              <div className="md:col-span-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Security Score</h3>
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-800"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * data.analizer.score) / 100}
                      className={getScoreColor(data.analizer.score)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-4xl font-bold ${getScoreColor(data.analizer.score)}`}>
                      {data.analizer.score}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-400">{data.analizer.interpretation}</p>
              </div>

              {/* Details Card */}
              <div className="md:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-400" />
                    Analysis Report
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-gray-800 text-xs text-gray-400 border border-gray-700">
                    {data.analizer.findings.length} Issues Found
                  </span>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {data.analizer.findings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No issues found. Contract looks clean!</p>
                    </div>
                  ) : (
                    data.analizer.findings.map((finding, i) => (
                      <div key={i} className="group bg-black/40 border border-gray-800 rounded-lg p-4 flex gap-4 hover:border-gray-600 transition-all duration-300 relative overflow-hidden">
                        {/* Severity Indicator */}
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          finding.severity === 'Critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                          finding.severity === 'High' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                          finding.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        
                        <div className="w-full">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-white">{finding.tool}</span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${
                              finding.severity === 'Critical' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                              finding.severity === 'High' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                              finding.severity === 'Medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : 
                              'border-blue-500/30 text-blue-400 bg-blue-500/10'
                            }`}>
                              {finding.severity}
                            </span>
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-2">{finding.description}</p>
                          
                          {/* Code Snippet */}
                          {finding.snippet && (
                            <div className="mb-3 bg-gray-950 rounded border border-gray-800 p-3 overflow-x-auto group-hover:border-gray-700 transition-colors">
                                <pre className="text-[10px] text-gray-400 font-mono leading-relaxed">
                                    {finding.snippet}
                                </pre>
                            </div>
                          )}

                          {finding.layman && (
                            <div className="bg-gray-800/50 p-3 rounded-lg mb-1 border-l-2 border-green-500/50">
                                <p className="text-green-400/90 text-xs italic">
                                    <span className="font-bold not-italic mr-1">💡 Vibe Check:</span>
                                    {finding.layman}
                                </p>
                            </div>
                          )}

                          {/* Technical Details (Reveal on Hover) */}
                          {finding.technical && (
                            <div className="max-h-0 group-hover:max-h-[200px] opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden">
                                <div className="mt-2 pt-2 border-t border-gray-800/50">
                                    <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1 flex items-center gap-1">
                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                                        Technical Details
                                    </p>
                                    <p className="text-gray-400 text-xs font-mono leading-relaxed">
                                        {finding.technical}
                                    </p>
                                </div>
                            </div>
                          )}

                          {finding.location && (
                            <p className="text-gray-600 text-[10px] font-mono mt-2 text-right">{finding.location}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
