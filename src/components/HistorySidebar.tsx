import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, X, Clock, Trash2 } from 'lucide-react';
import { SentinelResponse } from '../services/sentinelService';

interface HistoryItem extends SentinelResponse {
  id: string;
  timestamp: string;
  input: string;
}

interface HistorySidebarProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  history: HistoryItem[];
  setResponse: (response: SentinelResponse) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  showHistory,
  setShowHistory,
  history,
  setResponse,
}) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-google-red border-google-red bg-google-red/10';
      case 'HIGH': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'MEDIUM': return 'text-google-yellow border-google-yellow bg-google-yellow/10';
      default: return 'text-google-green border-google-green bg-google-green/10';
    }
  };

  return (
    <AnimatePresence>
      {showHistory && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-surface-card border-l border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
            aria-label="Analysis History"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-google-green" />
                Recent Intelligence
              </h2>
              <button 
                onClick={() => setShowHistory(false)} 
                className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
                aria-label="Close History"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-24 opacity-20">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-[10px] uppercase tracking-widest font-mono">No history found</p>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setResponse(item);
                      setShowHistory(false);
                    }}
                    className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-xl hover:border-google-green/30 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(item.riskLevel)}`}>
                        {item.riskLevel}
                      </span>
                      <span className="text-[9px] text-white/20 font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-bold line-clamp-1 mb-1 group-hover:text-google-green transition-colors">
                      {item.summary}
                    </p>
                    <p className="text-[10px] text-white/40 line-clamp-2 italic font-mono leading-relaxed">
                      "{item.input}"
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
