
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
import { PortfolioData, NewsPost, NewsComment } from './types';

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'portfolio' | 'news'>('portfolio');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('is_admin_logged_in') === 'true';
  });

  const [portfolioData, setPortfolioData] = useState<PortfolioData>(() => {
    const saved = localStorage.getItem('portfolio_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSave = (newData: PortfolioData) => {
    setPortfolioData(newData);
    localStorage.setItem('portfolio_data', JSON.stringify(newData));
    setIsAdminOpen(false);
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

  const handleLikeNews = (postId: string) => {
    const updatedNews = portfolioData.news.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    );
    const newData = { ...portfolioData, news: updatedNews };
    setPortfolioData(newData);
    localStorage.setItem('portfolio_data', JSON.stringify(newData));
  };

  const handleCommentNews = (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => {
    const newComment: NewsComment = {
      ...comment,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };
    const updatedNews = portfolioData.news.map(post => 
      post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
    );
    const newData = { ...portfolioData, news: updatedNews };
    setPortfolioData(newData);
    localStorage.setItem('portfolio_data', JSON.stringify(newData));
  };

  const handleViewChange = (view: 'portfolio' | 'news') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-x-hidden min-h-screen">
      {/* Decorative Background Blobs - Hidden during print */}
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
            {isLoggedIn ? 'Dashboard Access Granted' : 'Admin Dashboard'}
          </button>

          <div className="text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} {portfolioData.profile.fullName}.</p>
            <p className="mt-2 flex items-center justify-center gap-1.5">
              Made with <i className="fa-solid fa-heart text-red-500 animate-pulse"></i> in Bangladesh
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
