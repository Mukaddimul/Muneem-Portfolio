
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Leadership from './components/Leadership';
import Projects from './components/Projects';
import Awards from './components/Awards';
import Contact from './components/Contact';
import AdminPanel from './components/AdminPanel';
import LoginPanel from './components/LoginPanel';
import NewsPage from './components/NewsPage';
import { INITIAL_DATA } from './constants';
import { PortfolioData, NewsComment } from './types';
import { supabase, checkCloudHealth } from './supabaseClient';

// --- IndexedDB Utility ---
const DB_NAME = 'MuneemPortfolioDB';
const STORE_NAME = 'backups';
const KEY = 'portfolio_data';

const getLocalBackup = (): Promise<PortfolioData | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(KEY);
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

const setLocalBackup = (data: PortfolioData): Promise<void> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(data, KEY);
      transaction.oncomplete = () => resolve();
    };
    request.onerror = () => resolve();
  });
};
// --- End IndexedDB Utility ---

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'portfolio' | 'news'>('portfolio');
  const [isLoading, setIsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<{ ok: boolean; message: string }>({ ok: false, message: 'Checking Cloud...' });
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; isTableMissing?: boolean } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('is_admin_logged_in') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [portfolioData, setPortfolioData] = useState<PortfolioData>(INITIAL_DATA);

  const withRetry = useCallback(async <T,>(fn: () => Promise<T>, retries = 2, delay = 800): Promise<T> => {
    try {
      return await fn();
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isNetworkError = 
        err instanceof TypeError || 
        errorMsg.toLowerCase().includes('fetch') || 
        errorMsg.toLowerCase().includes('network') ||
        errorMsg.toLowerCase().includes('failed to load') ||
        errorMsg.toLowerCase().includes('aborted');
      
      if (retries <= 0 || !isNetworkError) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
  }, []);

  const syncCloudData = async () => {
    try {
      const health = await checkCloudHealth();
      setCloudStatus(health);

      if (health.ok) {
        const { data, error } = await supabase
          .from('portfolio_content')
          .select('content')
          .eq('id', 'main_config')
          .maybeSingle();

        if (error) throw error;

        if (data?.content) {
          setPortfolioData(data.content);
          await setLocalBackup(data.content);
        } else {
          // Sync current local to cloud if cloud is empty
          const local = await getLocalBackup();
          await supabase.from('portfolio_content').upsert({ id: 'main_config', content: local || INITIAL_DATA });
        }
      } else if (health.message.includes('Table Missing')) {
        setErrorInfo({ message: "Database table missing. Please run migration.", isTableMissing: true });
      }
    } catch (err: any) {
      setCloudStatus({ ok: false, message: 'Cloud Unavailable' });
    }
  };

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // 1. Load Local Data Immediately (Zero latency for user)
      const backup = await getLocalBackup();
      if (backup) {
        setPortfolioData(backup);
      }
      setIsLoading(false); // Show UI immediately

      // 2. Perform Cloud Sync in background
      syncCloudData();
    } catch (err: any) {
      setIsLoading(false);
      setCloudStatus({ ok: false, message: 'Local Mode' });
    }
  };

  useEffect(() => {
    initializeApp();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const persistData = async (newData: PortfolioData): Promise<boolean> => {
    setPortfolioData(newData);
    let success = false;
    
    await setLocalBackup(newData);

    if (!cloudStatus.ok) {
      setCloudStatus({ ok: false, message: 'Saved Locally' });
      return false;
    }

    try {
      const { error } = await withRetry<any>(() => 
        supabase
          .from('portfolio_content')
          .upsert({ id: 'main_config', content: newData })
      );
      
      if (error) throw error;
      success = true;
      setCloudStatus({ ok: true, message: 'Cloud Synced' });
    } catch (err: any) {
      setCloudStatus({ ok: false, message: 'Sync Pending' });
    }
    return success;
  };

  const handleSave = async (newData: PortfolioData) => {
    const success = await persistData(newData);
    setIsAdminOpen(false);
    if (!success) {
      console.info("Notice: Changes saved to local database. Cloud sync will resume when connection is restored.");
    }
  };

  const handleAdminClick = () => {
    if (isLoggedIn) setIsAdminOpen(true);
    else setIsLoginOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('is_admin_logged_in', 'true');
    setIsLoginOpen(false);
    setIsAdminOpen(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('is_admin_logged_in');
    setIsAdminOpen(false);
  };

  const handleLikeNews = async (postId: string, increment: boolean) => {
    const updatedNews = portfolioData.news.map(post => 
      post.id === postId 
        ? { ...post, likes: Math.max(0, post.likes + (increment ? 1 : -1)) } 
        : post
    );
    await persistData({ ...portfolioData, news: updatedNews });
  };

  const handleCommentNews = async (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => {
    const newComment: NewsComment = {
      ...comment,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };
    const updatedNews = portfolioData.news.map(post => 
      post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
    );
    await persistData({ ...portfolioData, news: updatedNews });
  };

  const handleViewChange = (view: 'portfolio' | 'news') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualRetry = () => {
    setCloudStatus({ ok: false, message: 'Retrying...' });
    syncCloudData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white p-6">
        <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="mt-8 text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Restoring Local Session</p>
      </div>
    );
  }

  if (errorInfo?.isTableMissing) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white p-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-2xl">
          <i className="fa-solid fa-database-circle-exclamation text-red-500 text-3xl"></i>
        </div>
        <h1 className="text-2xl font-heading font-black mb-4 uppercase tracking-tighter text-red-400">Cloud Setup Required</h1>
        <p className="max-w-md text-slate-400 text-sm leading-relaxed mb-8">
          Project connected, but the database schema is missing.
        </p>
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 max-w-lg text-left shadow-2xl">
          <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap p-4 bg-black/40 rounded-xl border border-white/5">
            {`CREATE TABLE IF NOT EXISTS public.portfolio_content (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
          </pre>
        </div>
        <div className="flex gap-4 mt-10">
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-brand-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-lg">Retry Link</button>
          <button onClick={() => setErrorInfo(null)} className="px-8 py-3 bg-slate-800 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Work Locally</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden min-h-screen">
      <div className="blob bg-brand-600 w-96 h-96 rounded-full top-0 left-0 -translate-x-1/2 -translate-y-1/2 print:hidden"></div>
      <div className="blob bg-purple-600 w-[500px] h-[500px] rounded-full top-1/2 right-0 translate-x-1/2 -translate-y-1/2 print:hidden"></div>
      
      <Navbar scrolled={scrolled} name={portfolioData.profile.name} profilePic={portfolioData.profile.profilePic} onViewChange={handleViewChange} currentView={currentView} />
      
      <main className="transition-opacity duration-300">
        {currentView === 'portfolio' ? (
          <>
            <Hero profile={portfolioData.profile} projectCount={portfolioData.projects.length} />
            <About bio={portfolioData.profile.bio} name={portfolioData.profile.name} />
            <Leadership timeline={portfolioData.timeline} />
            <Skills skills={portfolioData.skills} />
            <Projects projects={portfolioData.projects} />
            <Awards awards={portfolioData.awards} />
            <Contact profile={portfolioData.profile} />
          </>
        ) : (
          <NewsPage 
            news={portfolioData.news} 
            onLike={handleLikeNews} 
            onComment={handleCommentNews} 
          />
        )}
      </main>

      <footer className="py-20 bg-dark-900 border-t border-slate-800/30 print:hidden font-sans">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 px-6 py-3 rounded-full transition-all hover:bg-slate-800/60 shadow-lg group">
              <i className="fa-solid fa-phone text-brand-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-white text-sm font-semibold tracking-wide">+880 1876 343423</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 px-6 py-3 rounded-full transition-all hover:bg-slate-800/60 shadow-lg group">
              <i className="fa-solid fa-envelope text-brand-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-white text-sm font-semibold tracking-wide">mukaddimulmunna@gmail.com</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 mb-10">
             <button 
                onClick={handleAdminClick} 
                className="flex items-center justify-center gap-2 text-slate-500 hover:text-brand-400 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
             >
                <i className={`fa-solid ${isLoggedIn ? 'fa-lock-open' : 'fa-lock'} text-xs`}></i>
                {isLoggedIn ? 'DASHBOARD ACCESS GRANTED' : 'DASHBOARD ACCESS SECURED'}
             </button>
             
             <div className="flex items-center gap-2 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${cloudStatus.ok ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></span>
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{cloudStatus.message}</span>
                {!cloudStatus.ok && (
                  <button 
                    onClick={handleManualRetry}
                    className="text-[8px] font-black text-brand-500 hover:underline uppercase tracking-tighter"
                  >
                    Sync Now
                  </button>
                )}
             </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-slate-500 text-sm font-medium">
              © 2026 MD. Mukaddimul Haque Muneem.
            </p>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
              Made with ❤️ via Supabase
            </p>
          </div>
        </div>
      </footer>

      {isLoginOpen && <LoginPanel onLoginSuccess={handleLoginSuccess} onClose={() => setIsLoginOpen(false)} />}
      {isAdminOpen && <AdminPanel data={portfolioData} onSave={handleSave} onLogout={handleLogout} onClose={() => setIsAdminOpen(false)} />}
    </div>
  );
};

export default App;
