import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldAlert, CheckCircle, AlertTriangle, Terminal, Zap } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const handleAnalizer = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setData(null);
    setLogs([]);

    try {
      const response = await axios.post('/api/analizer', { address });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong, fam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vibe-dark text-white p-4 font-sans selection:bg-vibe-neon selection:text-black">
      <div className="max-w-4xl mx-auto pt-20">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-extrabold mb-4 tracking-tighter">
            VIBE<span className="text-vibe-neon">ANALIZER</span>
          </h1>
          <p className="text-xl text-gray-400 font-mono">
            Is your contract <span className="text-vibe-purple">based</span> or <span className="text-red-500">sus</span>?
          </p>
        </motion.div>

        {/* Input Section */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-gradient-to-r from-vibe-purple to-vibe-neon rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-vibe-gray rounded-xl p-2 flex items-center border border-gray-800 focus-within:border-vibe-neon transition-colors">
            <Search className="ml-4 text-gray-500 w-6 h-6" />
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..." 
              className="w-full bg-transparent border-none focus:ring-0 text-xl font-mono p-4 text-white placeholder-gray-600"
            />
            <button 
              onClick={handleAnalizer}
              disabled={loading}
              className="bg-white text-black font-bold px-8 py-4 rounded-lg hover:bg-vibe-neon hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'VIBING...' : 'CHECK VIBE'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-lg mb-8 text-center font-mono"
          >
            Error: {error}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {data && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Score Card */}
              <div className="md:col-span-1 bg-vibe-gray rounded-xl p-6 border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldAlert size={100} />
                </div>
                <h3 className="text-gray-400 font-mono mb-2">SECURITY SCORE</h3>
                <div className="text-7xl font-bold mb-4 flex items-baseline">
                  {data.analizer.score}
                  <span className="text-xl text-gray-500 ml-2">/100</span>
                </div>
                <p className={clsx(
                  "font-mono text-sm p-2 rounded",
                  data.analizer.score >= 90 ? "bg-green-900/30 text-green-400" :
                  data.analizer.score >= 70 ? "bg-yellow-900/30 text-yellow-400" :
                  "bg-red-900/30 text-red-400"
                )}>
                  {data.analizer.interpretation}
                </p>
              </div>

              {/* Basic Info */}
              <div className="md:col-span-2 bg-vibe-gray rounded-xl p-6 border border-gray-800 font-mono text-sm">
                <h3 className="text-gray-400 mb-4 flex items-center gap-2">
                  <Terminal size={16} /> CONTRACT INTEL
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/30 rounded">
                    <div className="text-gray-500 text-xs">NAME</div>
                    <div className="truncate">{data.info.contractName || 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-black/30 rounded">
                    <div className="text-gray-500 text-xs">CREATOR</div>
                    <div className="truncate" title={data.info.creator}>{data.info.creator}</div>
                  </div>
                  <div className="p-3 bg-black/30 rounded">
                    <div className="text-gray-500 text-xs">BALANCE</div>
                    <div>{data.info.balance} ETH</div>
                  </div>
                  <div className="p-3 bg-black/30 rounded">
                    <div className="text-gray-500 text-xs">TX COUNT</div>
                    <div>{data.info.txCount}</div>
                  </div>
                </div>
              </div>

              {/* Findings */}
              <div className="md:col-span-3 bg-vibe-gray rounded-xl p-6 border border-gray-800">
                <h3 className="text-gray-400 font-mono mb-6 flex items-center gap-2">
                  <Zap size={16} /> VIBE CHECK RESULTS
                </h3>
                
                <div className="space-y-3">
                  {data.analizer.findings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                      No major issues found. Contract is clean.
                    </div>
                  ) : (
                    data.analizer.findings.map((issue, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4 p-4 bg-black/20 rounded-lg hover:bg-black/40 transition"
                      >
                        <div className={clsx(
                          "mt-1 w-2 h-2 rounded-full shrink-0",
                          issue.severity === 'Critical' ? "bg-red-500 shadow-[0_0_10px_red]" :
                          issue.severity === 'High' ? "bg-orange-500" :
                          issue.severity === 'Medium' ? "bg-yellow-500" : "bg-blue-500"
                        )} />
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-200">{issue.description}</span>
                            <span className={clsx(
                              "text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider",
                              issue.severity === 'Critical' ? "bg-red-500/20 text-red-500" :
                              issue.severity === 'High' ? "bg-orange-500/20 text-orange-500" :
                              issue.severity === 'Medium' ? "bg-yellow-500/20 text-yellow-500" :
                              "bg-blue-500/20 text-blue-500"
                            )}>{issue.severity}</span>
                          </div>
                          <div className="text-xs text-gray-500 font-mono flex gap-4">
                            <span>TOOL: {issue.tool}</span>
                            <span>LOC: {issue.location}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default App
