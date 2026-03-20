/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Camera, 
  Mic, 
  FileText, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  X,
  Zap,
  ChevronRight,
  Info,
  Video,
  LogIn,
  LogOut,
  History,
  User as UserIcon,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processUnstructuredInput, SentinelResponse, ActionItem } from './services/sentinelService';
import { TestCases } from './components/TestCases';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit,
  Timestamp
} from 'firebase/firestore';

interface HistoryItem extends SentinelResponse {
  id: string;
  timestamp: string;
  input: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [input, setInput] = useState('');
  const [media, setMedia] = useState<{ data: string; mimeType: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<SentinelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // History Listener
  useEffect(() => {
    if (!user || !isAuthReady) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'reports'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as HistoryItem);
      });
      setHistory(items);
    }, (err) => {
      console.error("History Listener Error:", err);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError("Login failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setResponse(null);
      setShowHistory(false);
    } catch (err: any) {
      setError("Logout failed: " + err.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia({ data: reader.result as string, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!input && !media) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processUnstructuredInput(input, media || undefined);
      setResponse(result);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      let message = 'Failed to process input. Please try again.';
      try {
        const parsed = JSON.parse(err.message);
        message = `Intelligence Error: ${parsed.error} (${parsed.operationType})`;
      } catch {
        message = err.message || message;
      }
      setError(message);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestCaseSelect = async (input: string, mediaUrl?: string, mimeType?: string) => {
    setInput(input);
    if (mediaUrl && mimeType) {
      try {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(mediaUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Failed to fetch via proxy: ${response.statusText}`);
        
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setMedia({ data: reader.result as string, mimeType });
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load test media:", err);
        setError("Failed to load test media. This might be due to an external server restriction.");
      }
    } else {
      setMedia(null);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 border-red-500 bg-red-500/10';
      case 'HIGH': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'MEDIUM': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      default: return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E1E1E3] font-mono selection:bg-emerald-500/30">
      {/* Header / HUD */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50" role="banner">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Shield className="w-5 h-5 text-black" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase">Sentinel AI</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-tighter">Life-Saving Intelligence Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-[10px] tracking-widest uppercase text-white/60 border-r border-white/10 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Global Access Active
              </div>
              <div>{new Date().toLocaleTimeString()} UTC</div>
            </div>

            {isAuthReady && (
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className={`p-2 rounded-md transition-colors ${showHistory ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      aria-label="Toggle History"
                      aria-pressed={showHistory}
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-emerald-500" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[80px]">
                        {user.displayName?.split(' ')[0]}
                      </span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <LogIn className="w-4 h-4" />
                    Connect Identity
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8" role="main">
        {/* History Sidebar/Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed top-16 right-0 bottom-0 w-full md:w-80 bg-[#0F1012] border-l border-white/10 z-40 p-6 overflow-y-auto shadow-2xl"
              aria-label="Analysis History"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-500" />
                  Recent Intelligence
                </h2>
                <button onClick={() => setShowHistory(false)} className="text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 opacity-20">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[10px] uppercase tracking-widest">No history found</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setResponse(item);
                        setShowHistory(false);
                      }}
                      className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-lg hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getRiskColor(item.riskLevel)}`}>
                          {item.riskLevel}
                        </span>
                        <span className="text-[8px] text-white/20">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold line-clamp-1 mb-1 group-hover:text-emerald-500 transition-colors">
                        {item.summary}
                      </p>
                      <p className="text-[9px] text-white/40 line-clamp-2 italic">
                        "{item.input}"
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <TestCases onSelect={handleTestCaseSelect} />

        {/* Input Section */}
        <section className="bg-[#151619] border border-white/10 rounded-xl overflow-hidden shadow-2xl" aria-labelledby="input-heading">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" id="input-heading">
                <Zap className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                Input Stream
              </div>
              <div className="text-[10px] text-white/40 uppercase">Awaiting unstructured data...</div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="relative">
                <label htmlFor="intelligence-input" className="sr-only">Intelligence Input</label>
                <textarea
                  id="intelligence-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the situation, paste medical history, news alerts, or messy notes..."
                  className="w-full h-40 bg-black/40 border border-white/5 rounded-lg p-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none placeholder:text-white/20"
                  aria-describedby="input-desc"
                />
                <p id="input-desc" className="sr-only">Enter any unstructured text data for the AI to analyze for life-saving actions.</p>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors group relative"
                    title="Upload Media"
                    aria-label="Upload image, audio, or video for analysis"
                  >
                    <Camera className="w-4 h-4 text-white/60 group-hover:text-white" />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*,audio/*,video/*"
                    />
                  </button>
                </div>
              </div>

              {media && (
                <div className="relative inline-block group">
                  {media.mimeType.startsWith('image/') ? (
                    <img src={media.data} alt="Uploaded evidence" className="h-32 rounded-lg border border-white/10 object-cover" />
                  ) : media.mimeType.startsWith('audio/') ? (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                      <Mic className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs text-white/60">Audio Data Loaded</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                      <Video className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs text-white/60">Video Data Loaded</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setMedia(null)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove media"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

            <button
              onClick={handleProcess}
              disabled={isProcessing || (!input && !media)}
              className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                isProcessing || (!input && !media)
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Intelligence...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Execute Sentinel Analysis
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {response && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
              ref={scrollRef}
              aria-live="polite"
            >
              {/* Situation Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`md:col-span-2 p-6 rounded-xl border ${getRiskColor(response.riskLevel)} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                      <span className="text-xs font-bold uppercase tracking-widest">Risk Assessment: {response.riskLevel}</span>
                    </div>
                    <p className="text-xl font-bold leading-tight">{response.summary}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <span className="text-[10px] uppercase text-white/40 block mb-2 tracking-widest">Detected Context</span>
                    <p className="text-xs text-white/80 italic">"{response.detectedContext}"</p>
                  </div>
                </div>

                <div className="bg-[#151619] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <Activity className="w-12 h-12 text-emerald-500 mb-4" aria-hidden="true" />
                  <div className="text-3xl font-bold mb-1">{response.actions.length}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Critical Actions Identified</div>
                </div>
              </div>

              {/* Action Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                  Actionable Directives
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {response.actions.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-[#151619] border border-white/10 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className={`sm:w-32 p-4 flex flex-col items-center justify-center gap-2 border-b sm:border-b-0 sm:border-r border-white/10 ${getPriorityColor(item.priority)}`}>
                          <span className="text-[10px] font-black tracking-tighter uppercase">{item.priority}</span>
                          <span className="text-[8px] font-bold uppercase opacity-60">{item.category}</span>
                        </div>
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-lg font-bold">{item.action}</h3>
                            <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase border ${
                              item.verificationStatus === 'VERIFIED' ? 'border-emerald-500 text-emerald-500' : 
                              item.verificationStatus === 'PENDING' ? 'border-yellow-500 text-yellow-500' : 'border-white/20 text-white/20'
                            }`}>
                              {item.verificationStatus}
                            </div>
                          </div>
                          <p className="text-sm text-white/60 leading-relaxed">{item.reasoning}</p>
                        </div>
                        <div className="p-4 bg-black/20 flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-emerald-500 transition-colors" aria-hidden="true" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm flex items-center gap-3" role="alert">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-bold">System Error</p>
              <p className="opacity-80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Info */}
        {!response && !isProcessing && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-40">
            {[
              { icon: FileText, title: 'Unstructured Data', desc: 'Medical records, news, messy notes' },
              { icon: Camera, title: 'Visual Intelligence', desc: 'Photos of scenes, documents, symptoms' },
              { icon: Zap, title: 'Instant Action', desc: 'Verified life-saving directives' }
            ].map((item, i) => (
              <div key={i} className="p-4 border border-dashed border-white/20 rounded-xl text-center">
                <item.icon className="w-6 h-6 mx-auto mb-2" aria-hidden="true" />
                <h4 className="text-[10px] font-bold uppercase mb-1">{item.title}</h4>
                <p className="text-[9px] leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Background Grid/Effect */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
