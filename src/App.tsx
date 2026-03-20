/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  X,
  FileText, 
  Camera, 
  Zap,
} from 'lucide-react';
import { processUnstructuredInput, SentinelResponse, HistoryItem } from './services/sentinelService';
import { fetchMediaViaProxy } from './services/mediaService';
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
} from 'firebase/firestore';

// Modular Components
import { Header } from './components/Header';
import { HistorySidebar } from './components/HistorySidebar';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Input State
  const [input, setInput] = useState('');
  const [media, setMedia] = useState<{ data: string; mimeType: string } | null>(null);
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<SentinelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
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

  const handleLogin = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError("Login failed: " + err.message);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setResponse(null);
      setShowHistory(false);
    } catch (err: any) {
      setError("Logout failed: " + err.message);
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 5MB Limit
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit. Please upload a smaller file.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia({ data: reader.result as string, mimeType: file.type });
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleProcess = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && !media) {
      setError("Please provide either text input or media for analysis.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processUnstructuredInput(trimmedInput, media || undefined);
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
  }, [input, media]);

  const handleTestCaseSelect = useCallback(async (input: string, mediaUrl?: string, mimeType?: string) => {
    setInput(input);
    if (mediaUrl && mimeType) {
      try {
        const { data } = await fetchMediaViaProxy(mediaUrl);
        setMedia({ data, mimeType });
        setError(null);
      } catch (err) {
        console.error("Failed to load test media:", err);
        setError("Failed to load test media. This might be due to an external server restriction.");
      }
    } else {
      setMedia(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-dark text-[#E1E1E3] font-sans selection:bg-google-green/30">
      <Header 
        user={user}
        isAuthReady={isAuthReady}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-12" role="main">
        <HistorySidebar 
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          history={history}
          setResponse={setResponse}
        />

        <TestCases onSelect={handleTestCaseSelect} />

        <InputSection 
          input={input}
          setInput={setInput}
          media={media}
          setMedia={setMedia}
          isProcessing={isProcessing}
          handleProcess={handleProcess}
          handleImageUpload={handleImageUpload}
        />

        {response && (
          <ResultsSection 
            response={response}
            scrollRef={scrollRef}
          />
        )}

        {error && (
          <div className="p-5 bg-google-red/10 border border-google-red/30 rounded-2xl text-google-red text-sm flex items-center gap-4 shadow-xl shadow-google-red/5" role="alert">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold uppercase tracking-widest text-[10px] mb-1">System Intelligence Error</p>
              <p className="opacity-90 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="p-2 hover:bg-white/5 rounded-full transition-all"
              aria-label="Clear Error"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Footer Info */}
        {!response && !isProcessing && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-40">
            {[
              { icon: FileText, title: 'Unstructured Data', desc: 'Medical records, news, messy notes' },
              { icon: Camera, title: 'Visual Intelligence', desc: 'Photos of scenes, documents, symptoms' },
              { icon: Zap, title: 'Instant Action', desc: 'Verified life-saving directives' }
            ].map((item, i) => (
              <div key={i} className="p-6 border border-dashed border-white/10 rounded-2xl text-center group hover:border-google-green/30 transition-all">
                <item.icon className="w-8 h-8 mx-auto mb-4 text-white/60 group-hover:text-google-green transition-colors" aria-hidden="true" />
                <h4 className="text-[10px] font-bold uppercase mb-2 tracking-widest">{item.title}</h4>
                <p className="text-[11px] leading-relaxed font-mono">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Background Grid/Effect */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,168,83,0.03)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
    </div>
  );
}
