import React, { useRef } from 'react';
import { Zap, Camera, Mic, Video, Send, Loader2, X } from 'lucide-react';

interface InputSectionProps {
  input: string;
  setInput: (input: string) => void;
  media: { data: string; mimeType: string } | null;
  setMedia: (media: { data: string; mimeType: string } | null) => void;
  isProcessing: boolean;
  handleProcess: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  input,
  setInput,
  media,
  setMedia,
  isProcessing,
  handleProcess,
  handleImageUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="glass-panel rounded-2xl overflow-hidden" aria-labelledby="input-heading">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" id="input-heading">
          <Zap className="w-4 h-4 text-google-green" aria-hidden="true" />
          Input Stream
        </div>
        <div className="text-[10px] text-white/40 uppercase font-mono">Awaiting unstructured data...</div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="relative">
          <label htmlFor="intelligence-input" className="sr-only">Intelligence Input</label>
          <textarea
            id="intelligence-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the situation, paste medical history, news alerts, or messy notes..."
            className="w-full h-48 bg-black/40 border border-white/5 rounded-xl p-5 text-sm focus:outline-none focus:border-google-green/50 transition-all resize-none placeholder:text-white/20 leading-relaxed"
            aria-describedby="input-desc"
          />
          <p id="input-desc" className="sr-only">Enter any unstructured text data for the AI to analyze for life-saving actions.</p>
          <div className="absolute bottom-5 right-5 flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all group relative border border-white/5"
              title="Upload Media"
              aria-label="Upload image, audio, or video for analysis"
            >
              <Camera className="w-5 h-5 text-white/60 group-hover:text-white" />
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
              <img src={media.data} alt="Uploaded evidence" className="h-40 rounded-xl border border-white/10 object-cover shadow-xl" />
            ) : media.mimeType.startsWith('audio/') ? (
              <div className="p-5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <Mic className="w-6 h-6 text-google-green" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Audio Data Loaded</span>
              </div>
            ) : (
              <div className="p-5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <Video className="w-6 h-6 text-google-green" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Video Data Loaded</span>
              </div>
            )}
            <button 
              onClick={() => setMedia(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-google-red rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              aria-label="Remove media"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={isProcessing || (!input && !media)}
          className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
            isProcessing || (!input && !media)
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-google-green text-black hover:bg-google-green/90 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-google-green/20'
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
  );
};
