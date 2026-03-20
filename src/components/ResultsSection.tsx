import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { SentinelResponse } from '../services/sentinelService';

interface ResultsSectionProps {
  response: SentinelResponse;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  response,
  scrollRef,
}) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-google-red border-google-red bg-google-red/10';
      case 'HIGH': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'MEDIUM': return 'text-google-yellow border-google-yellow bg-google-yellow/10';
      default: return 'text-google-green border-google-green bg-google-green/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-google-red text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-google-yellow text-black';
      default: return 'bg-google-blue text-white';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
      ref={scrollRef}
      aria-live="polite"
    >
      {/* Situation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`md:col-span-2 p-8 rounded-2xl border ${getRiskColor(response.riskLevel)} flex flex-col justify-between shadow-xl`}>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest">Risk Assessment: {response.riskLevel}</span>
            </div>
            <p className="text-2xl font-bold leading-tight tracking-tight">{response.summary}</p>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10">
            <span className="text-[10px] uppercase text-white/40 block mb-3 tracking-widest font-mono">Detected Context</span>
            <p className="text-sm text-white/80 italic font-mono leading-relaxed">"{response.detectedContext}"</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <Activity className="w-16 h-16 text-google-green mb-6 animate-pulse" aria-hidden="true" />
          <div className="text-5xl font-bold mb-2 tracking-tighter">{response.actions.length}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Critical Actions Identified</div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest px-1">
          <CheckCircle2 className="w-5 h-5 text-google-green" aria-hidden="true" />
          Actionable Directives
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {response.actions.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group glass-panel rounded-2xl overflow-hidden hover:border-google-green/40 hover:bg-surface-hover transition-all"
            >
              <div className="flex flex-col sm:flex-row">
                <div className={`sm:w-40 p-6 flex flex-col items-center justify-center gap-3 border-b sm:border-b-0 sm:border-r border-white/10 ${getPriorityColor(item.priority)}`}>
                  <span className="text-xs font-black tracking-tighter uppercase">{item.priority}</span>
                  <span className="text-[9px] font-bold uppercase opacity-70 tracking-widest">{item.category}</span>
                </div>
                <div className="flex-1 p-8">
                  <div className="flex items-start justify-between gap-6 mb-3">
                    <h3 className="text-xl font-bold tracking-tight">{item.action}</h3>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${
                      item.verificationStatus === 'VERIFIED' ? 'border-google-green text-google-green' : 
                      item.verificationStatus === 'PENDING' ? 'border-google-yellow text-google-yellow' : 'border-white/20 text-white/20'
                    }`}>
                      {item.verificationStatus}
                    </div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed font-mono">{item.reasoning}</p>
                </div>
                <div className="p-6 bg-black/20 flex items-center justify-center">
                  <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-google-green transition-all group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
