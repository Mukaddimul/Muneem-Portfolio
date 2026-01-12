import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Leadership from './components/Leadership';
import Projects from './components/Projects';
import Awards from './components/Awards';
import Contact from './components/Contact';
import AIAssistant from './components/AIAssistant';
import AdminPanel from './components/AdminPanel';
import LoginPanel from './components/LoginPanel';
import NewsPage from './components/NewsPage';
import { INITIAL_DATA } from './constants';
import { PortfolioData, NewsComment } from './types';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'portfolio' | 'news'>('portfolio');
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; isTableMissing?: boolean } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('is_admin_logged_in') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Initialize with local storage if available, otherwise constants
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(() => {
    try {
      const saved = localStorage.getItem('portfolio_data_backup');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      return INITIAL_DATA;
    }
  });

  // Helper for exponential backoff retries on network failures
  const withRetry = async <T,>(fn: () => Promise<T>, retries = 2, delay = 800): Promise<T> => {
    try {
      return await fn();
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isNetworkError = 
        err instanceof TypeError || 
        errorMsg.toLowerCase().includes('fetch') || 
        errorMsg.toLowerCase().includes('network') ||
        errorMsg.toLowerCase().includes('failed to load');
      
      if (retries <= 0 || !isNetworkError) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
  };

  // Sync data from Supabase
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const result = (await withRetry(() => 
          supabase
            .from('portfolio_content')
            .select('content')
            .eq('id', 'main_config')
            .maybeSingle()
        )) as any;

        const { data, error } = result;

        if (error) {
          const errorMsg = (typeof error.message === 'string') ? error.message : JSON.stringify(error);
          const isTableMissing = 
            error.code === '42P01' || 
            errorMsg.toLowerCase().includes('portfolio_content') || 
            errorMsg.toLowerCase().includes('schema cache');
          
          const isNetworkError = 
            errorMsg.toLowerCase().includes('fetch') || 
            errorMsg.toLowerCase().includes('network') ||
            errorMsg.toLowerCase().includes('failed to load');

          if (isTableMissing) {
            setErrorInfo({
              message: "The 'portfolio_content' table was not found in Supabase. Please run the SQL migration.",
              code: error.code,
              isTableMissing: true
            });
          } else if (isNetworkError) {
            // Silently use local data for network failures to keep the portfolio alive
            console.warn("Supabase unreachable. Operating in Offline/Local mode.", errorMsg);
          } else {
            // Log other errors but don't block render
            console.error("Supabase Config Error:", errorMsg);
          }
        } else if (data && data.content) {
          setPortfolioData(data.content);
          // Update local backup
          try {
            localStorage.setItem('portfolio_data_backup', JSON.stringify(data.content));
          } catch (e) {}
        } else if (!data) {
          console.log("Config row missing. Initializing cloud record...");
          try {
            await supabase.from('portfolio_content').upsert({ id: 'main_config', content: INITIAL_DATA });
          } catch (e) {}
        }
      } catch (err: any) {
        // Broad catch-all for any failed request
        console.warn("Using Local Data Cache. Network reason:", err?.message || String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const persistData = async (newData: PortfolioData): Promise<boolean> => {
    setPortfolioData(newData);
    let success = false;
    
    // Always save locally first
    try {
      localStorage.setItem('portfolio_data_backup', JSON.stringify(newData));
    } catch (e) {}

    try {
      const { error } = (await withRetry(() => 
        supabase
          .from('portfolio_content')
          .upsert({ id: 'main_config', content: newData })
      )) as any;
      
      if (error) throw error;
      success = true;
    } catch (err: any) {
      console.error("Cloud Persist Failed (Network):", err.message || err);
    }
    return success;
  };

  const handleSave = async (newData: PortfolioData) => {
    const success = await persistData(newData);
    setIsAdminOpen(false);
    if (!success) {
      alert("Note: Changes saved locally but couldn't sync with cloud. They will be uploaded when connection is restored.");
    }
  };

  const handleAdminClick = () => {
    if (isLoggedIn) {
      setIsAdminOpen(true);
    } else {
      setIsLoginOpen(true);
    }
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

  const handleLikeNews = async (postId: string) => {
    const updatedNews = portfolioData.news.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    );
    const newData = { ...portfolioData, news: updatedNews };
    await persistData(newData);
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
    const newData = { ...portfolioData, news: updatedNews };
    await persistData(newData);
  };

  const handleViewChange = (view: 'portfolio' | 'news') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white p-6">
        <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="mt-8 text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Synchronizing Interface</p>
      </div>
    );
  }

  // Only show error screen for actionable structural database errors
  if (errorInfo && errorInfo.isTableMissing) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white p-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-2xl">
          <i className="fa-solid fa-database-circle-exclamation text-red-500 text-3xl"></i>
        </div>
        <h1 className="text-2xl font-heading font-black mb-4 uppercase tracking-tighter text-red-400">Database Schema Missing</h1>
        <p className="max-w-md text-slate-400 text-sm leading-relaxed mb-8">
          The Supabase connection is active, but the required table doesn't exist.
        </p>
        
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 max-w-lg text-left shadow-2xl">
          <p className="text-[10px] font-black uppercase text-brand-400 tracking-widest mb-3 flex items-center gap-2">
            <i className="fa-solid fa-terminal"></i> SQL Editor Patch
          </p>
          <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap p-4 bg-black/40 rounded-xl border border-white/5">
            {`CREATE TABLE IF NOT EXISTS public.portfolio_content (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-brand-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-lg">Retry Sync</button>
          <button onClick={() => setErrorInfo(null)} className="px-8 py-3 bg-slate-800 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Browse Offline</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden min-h-screen">
      <div className="blob bg-brand-600 w-96 h-96 rounded-full top-0 left-0 -translate-x-1/2 -translate-y-1/2 print:hidden"></div>
      <div className="blob bg-purple-600 w-[500px] h-[500px] rounded-full top-1/2 right-0 translate-x-1/2 -translate-y-1/2 print:hidden"></div>
      <div className="blob bg-blue-600 w-96 h-96 rounded-full bottom-0 left-0 -translate-x-1/2 translate-y-1/2 print:hidden"></div>
      
      <Navbar 
        scrolled={scrolled} 
        name={portfolioData.profile.name} 
        profilePic={portfolioData.profile.profilePic} 
        onViewChange={handleViewChange}
        currentView={currentView}
      />
      
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

      <footer className="py-12 bg-dark-900 border-t border-slate-800 print:hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-10 text-slate-400 text-sm font-medium">
            <a href={`tel:${portfolioData.profile.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 hover:text-brand-400 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-brand-600/20 transition-colors shrink-0">
                <i className="fa-solid fa-phone text-brand-500"></i>
              </div>
              <span className="break-all">{portfolioData.profile.phone}</span>
            </a>
            <a href={`mailto:${portfolioData.profile.email}`} className="flex items-center gap-3 hover:text-brand-400 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-brand-600/20 transition-colors shrink-0">
                <i className="fa-solid fa-envelope text-brand-500"></i>
              </div>
              <span className="break-all">{portfolioData.profile.email}</span>
            </a>
          </div>
          
          <button 
            onClick={handleAdminClick}
            className="mb-8 text-[10px] text-slate-600 hover:text-brand-400 uppercase tracking-[0.2em] font-black flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <i className={`fa-solid ${isLoggedIn ? 'fa-unlock' : 'fa-lock'}`}></i>
            {isLoggedIn ? ' Dashboard Access Granted' : ' Admin Dashboard'}
          </button>

          <div className="text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} {portfolioData.profile.fullName}.</p>
            <p className="mt-2 flex items-center justify-center gap-1.5">
              Made with <i className="fa-solid fa-heart text-red-500 animate-pulse"></i> via Supabase
            </p>
          </div>
        </div>
      </footer>

      {isLoginOpen && (
        <LoginPanel 
          onLoginSuccess={handleLoginSuccess} 
          onClose={() => setIsLoginOpen(false)} 
        />
      )}

      {isAdminOpen && (
        <AdminPanel 
          data={portfolioData} 
          onSave={handleSave} 
          onLogout={handleLogout}
          onClose={() => setIsAdminOpen(false)} 
        />
      )}

      <div className="print:hidden">
        <AIAssistant profile={portfolioData.profile} />
      </div>
    </div>
  );
};

export default App;