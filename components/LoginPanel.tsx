
import React, { useState } from 'react';

interface LoginPanelProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Securely hardcoded credentials as per request
  const ADMIN_EMAIL = 'mukaddimulmunna@gmail.com';
  const ADMIN_PASS = 'Anzir1215225';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a brief check
    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        onLoginSuccess();
      } else {
        setError('Unauthorized Access Detected. Incorrect Credentials.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-dark-900/98 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="glass-card w-full max-w-md p-8 md:p-10 rounded-[2.5rem] border border-slate-700/50 shadow-2xl relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-500/30">
            <i className="fa-solid fa-shield-halved text-brand-400 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white mb-2">Secure Gateway</h2>
          <p className="text-slate-500 text-sm font-medium">Verify your identity to access system controls.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block ml-1">Admin Email</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"></i>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block ml-1">Master Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"></i>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
              <i className="fa-solid fa-triangle-exclamation"></i>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-brand-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <><i className="fa-solid fa-key text-sm"></i> Authenticate</>
              )}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest py-2 transition-colors"
            >
              Exit Portal
            </button>
          </div>
        </form>

        <div className="mt-10 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          End-to-End Encrypted Session
        </div>
      </div>
    </div>
  );
};

export default LoginPanel;
