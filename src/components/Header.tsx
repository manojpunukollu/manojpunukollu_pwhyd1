import React from 'react';
import { Shield, LogIn, LogOut, History, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  isAuthReady: boolean;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  handleLogin: () => void;
  handleLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAuthReady,
  showHistory,
  setShowHistory,
  handleLogin,
  handleLogout,
}) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50" role="banner">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-google-green rounded-lg flex items-center justify-center shadow-lg shadow-google-green/20">
            <Shield className="w-5 h-5 text-black" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Sentinel AI</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Intelligence Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end gap-0.5 text-[10px] font-mono text-white/40 border-r border-white/10 pr-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-google-green animate-pulse" />
              <span className="uppercase tracking-widest">Active System</span>
            </div>
            <div className="flex gap-2">
              <span>{new Date().toLocaleTimeString()}</span>
              <span className="opacity-60">{timezone}</span>
            </div>
          </div>

          {isAuthReady && (
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-2 rounded-lg transition-all ${showHistory ? 'bg-google-green text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                    aria-label="Toggle History"
                    aria-pressed={showHistory}
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-google-green" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[80px]">
                      {user.displayName?.split(' ')[0]}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 bg-google-red/10 text-google-red hover:bg-google-red/20 rounded-lg transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-google-green text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-google-green/90 transition-all shadow-lg shadow-google-green/20"
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
  );
};
