
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
  const [cloudStatus, setCloudStatus] = useState<{ ok: boolean; message: string }>({ ok: false, message: 'Initializing Session...' });
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
      const { data, error } = await supabase
        .from('portfolio_content')
        .select('content')
        .eq('id', 'main_config')
        .maybeSingle();
      
      if (error) throw error;
      return data?.content || null;
    } catch (err) {
      console.error("Cloud fetch failed:", err);
      return null;
    }
  };

  const initializeApp = async () => {
    const backup = await getLocalBackup();
    if (backup) {
      setPortfolioData(backup);
      setIsLoading(false);
    }

    try {
      const fetchPromise = fetchFromCloud();
      const healthPromise = checkCloudHealth();

      const [freshData, health] = await Promise.all([fetchPromise, healthPromise]);
      setCloudStatus(health);

      if (freshData) {
        if (JSON.stringify(freshData) !== JSON.stringify(backup)) {
          setPortfolioData(freshData);
        }
        await setLocalBackup(freshData);
      } else if (health.ok && !backup) {
        setPortfolioData(INITIAL_DATA);
        await setLocalBackup(INITIAL_DATA);
      }
    } catch (err) {
      console.error("Session background sync failed:", err);
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
      setPortfolioData(newData);
      await setLocalBackup(newData);

      const { error } = await supabase
        .from('portfolio_content')
        .upsert({ id: 'main_config', content: newData }, { onConflict: 'id' });
      
      if (error) {
        if (error.code === '57014') {
            setCloudStatus({ ok: false, message: 'Update failed: Payload too large' });
            return false;
        }
        setCloudStatus({ ok: false, message: `Sync Failure: ${error.message}` });
        return false;
      }

      setCloudStatus({ ok: true, message: 'Cloud Synchronized' });
      return true;
    } catch (err: any) {
      console.error("Cloud persist failed:", err);
      setCloudStatus({ ok: false, message: 'Offline Persistence Active' });
      return false;
    }
  };

  const handleSave = async (newData: PortfolioData): Promise<boolean> => {
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
    const updatedNews = portfolioData.news.map(post => {
      if (post.id === postId) {
        const currentLikes = post.likes || 0;
        const newLikes = Math.max(0, currentLikes + (increment ? 1 : -1));
        return { ...post, likes: newLikes };
      }
      return post;
    });
    await persistData({ ...portfolioData, news: updatedNews });
  };

  const handleCommentNews = async (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => {
    if (!portfolioData) return;
    const newComment: NewsComment = {
      ...comment,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      replies: []
    };
    const updatedNews = portfolioData.news.map(post => 
      post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
    );
    await persistData({ ...portfolioData, news: updatedNews });
  };

  const handleDeleteNewsComment = async (postId: string, commentId: string) => {
    if (!portfolioData || !isLoggedIn) return;
    const updatedNews = portfolioData.news.map(post => {
      if (post.id === postId) {
        // Recursive deletion helper
        const filterComments = (comments: NewsComment[]): NewsComment[] => {
          return comments
            .filter(c => c.id !== commentId)
            .map(c => ({
              ...c,
              replies: c.replies ? filterComments(c.replies) : []
            }));
        };
        return { ...post, comments: filterComments(post.comments) };
      }
      return post;
    });
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
          <div className="w-16 h-16 border-2 border-brand-600/10 border-t-brand-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-bolt-lightning text-brand-500 text-lg animate-pulse"></i>
          </div>
        </div>
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
          {cloudStatus.message}
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
            isLoggedIn={isLoggedIn}
            profile={portfolioData.profile}
            onLike={handleLikeNews} 
            onComment={handleCommentNews} 
            onDeleteComment={handleDeleteNewsComment}
          />
        )}
      </main>

      {isLoggedIn && !isAdminOpen && (
        <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md shadow-xl transition-all duration-500 ${cloudStatus.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <i className={`fa-solid ${cloudStatus.ok ? 'fa-cloud-check' : 'fa-cloud-exclamation'} mr-2`}></i>
            {cloudStatus.message}
          </div>
        </div>
      )}

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
