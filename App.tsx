
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Leadership from './components/Leadership';
import Projects from './components/Projects';
import Awards from './components/Awards';
import Connect from './components/Connect';
import Contact from './components/Contact';
import AdminPanel from './components/AdminPanel';
import LoginPanel from './components/LoginPanel';
import NewsPage from './components/NewsPage';
import HomeNewsSection from './components/HomeNewsSection';
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

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'portfolio' | 'news'>('portfolio');
  const [isLoading, setIsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<{ ok: boolean; message: string }>({ ok: false, message: 'Initializing...' });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('is_admin_logged_in') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const dataRef = useRef<PortfolioData | null>(null);

  useEffect(() => {
    dataRef.current = portfolioData;
  }, [portfolioData]);

  const fetchFromCloud = async (): Promise<PortfolioData | null> => {
    try {
      // Prioritize freshness from the cloud
      const { data, error } = await supabase
        .from('portfolio_content')
        .select('content')
        .eq('id', 'main_config')
        .maybeSingle();
      
      if (error) throw error;
      return data?.content || null;
    } catch (err) {
      console.error("Cloud fetch error:", err);
      return null;
    }
  };

  const initializeApp = async () => {
    setIsLoading(true);

    try {
      // Step 1: Check Cloud Health & Fetch Fresh Data
      const [freshData, health] = await Promise.all([
        fetchFromCloud(),
        checkCloudHealth()
      ]);

      setCloudStatus(health);

      if (freshData) {
        // SUCCESS: Cloud data found
        setPortfolioData(freshData);
        await setLocalBackup(freshData);
        setIsLoading(false);
        return;
      }

      // Step 2: If Cloud returns nothing (empty DB), Bootstrap it
      if (health.ok && !freshData) {
        setCloudStatus({ ok: true, message: 'Bootstrapping Database...' });
        setPortfolioData(INITIAL_DATA);
        // Save the initial data to cloud so it's permanent
        await supabase
          .from('portfolio_content')
          .upsert({ id: 'main_config', content: INITIAL_DATA });
        await setLocalBackup(INITIAL_DATA);
        setIsLoading(false);
        return;
      }

      // Step 3: If Cloud is unreachable, try local backup
      const backup = await getLocalBackup();
      if (backup) {
        setPortfolioData(backup);
        setCloudStatus({ ok: false, message: 'Offline Mode (Local Cache)' });
      } else {
        // Absolute last resort
        setPortfolioData(INITIAL_DATA);
        setCloudStatus({ ok: false, message: 'Using Default Factory Data' });
      }
    } catch (err) {
      console.error("Initialization error:", err);
      const backup = await getLocalBackup();
      setPortfolioData(backup || INITIAL_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const persistData = async (newData: PortfolioData): Promise<boolean> => {
    try {
      // Attempt cloud sync first
      const { error } = await supabase
        .from('portfolio_content')
        .upsert({ id: 'main_config', content: newData }, { onConflict: 'id' });
      
      if (error) throw error;

      // Only update local state and backup on successful DB commit
      setPortfolioData(newData);
      await setLocalBackup(newData);
      setCloudStatus({ ok: true, message: 'Changes Committed to Cloud' });
      return true;
    } catch (err: any) {
      console.error("Persistence error:", err);
      setCloudStatus({ ok: false, message: 'Cloud Sync Failed!' });
      // Still update locally so user can continue, but warn them
      setPortfolioData(newData);
      await setLocalBackup(newData);
      return false;
    }
  };

  const handleSave = async (newData: PortfolioData): Promise<boolean> => {
    // Note: AdminPanel now handles its own closing based on this result
    return await persistData(newData);
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
    if (!portfolioData) return;
    const updatedNews = portfolioData.news.map(post => 
      post.id === postId 
        ? { ...post, likes: Math.max(0, post.likes + (increment ? 1 : -1)) } 
        : post
    );
    await persistData({ ...portfolioData, news: updatedNews });
  };

  const handleCommentNews = async (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => {
    if (!portfolioData) return;
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

  const handleReadMore = (postId: string) => {
    setCurrentView('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading || !portfolioData) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white p-6">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-brand-600/10 border-t-brand-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-cloud-arrow-down text-brand-500 text-xl animate-pulse"></i>
          </div>
        </div>
        <div className="space-y-4 w-full max-w-xs">
          <div className="h-4 bg-slate-800 rounded-full w-full animate-pulse"></div>
          <div className="h-4 bg-slate-800 rounded-full w-2/3 mx-auto animate-pulse"></div>
        </div>
        <p className="mt-8 text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
          Synchronizing with Master Database
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200">
      <Navbar 
        scrolled={scrolled} 
        name={portfolioData.profile.name} 
        profilePic={portfolioData.profile.profilePic}
        onViewChange={handleViewChange}
        currentView={currentView}
      />

      <main className={currentView === 'portfolio' ? 'animate-in fade-in slide-in-from-bottom-2 duration-700' : ''}>
        {currentView === 'portfolio' ? (
          <>
            <Hero profile={portfolioData.profile} projectCount={portfolioData.projects.length} />
            <About bio={portfolioData.profile.bio} name={portfolioData.profile.name} />
            <Skills skills={portfolioData.skills} />
            <Leadership timeline={portfolioData.timeline} />
            <Projects projects={portfolioData.projects} />
            <HomeNewsSection news={portfolioData.news} onReadMore={handleReadMore} />
            <Awards awards={portfolioData.awards} />
            <Connect profile={portfolioData.profile} />
            <Contact profile={portfolioData.profile} onAdminClick={handleAdminClick} />
          </>
        ) : (
          <NewsPage 
            news={portfolioData.news} 
            onLike={handleLikeNews} 
            onComment={handleCommentNews} 
          />
        )}
      </main>

      {isAdminOpen && (
        <AdminPanel 
          data={portfolioData} 
          onSave={handleSave} 
          onLogout={handleLogout} 
          onClose={() => setIsAdminOpen(false)} 
        />
      )}

      {isLoginOpen && (
        <LoginPanel 
          onLoginSuccess={handleLoginSuccess} 
          onClose={() => setIsLoginOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
