import React, { useState, useEffect } from 'react';
import { Profile } from '../types';

interface HeroProps {
  profile: Profile;
  projectCount: number;
}

const Hero: React.FC<HeroProps> = ({ profile, projectCount }) => {
  const [scrollY, setScrollY] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initialize visitor and connected counters
    const storedVisits = localStorage.getItem('portfolio_visits');
    const newVisitCount = storedVisits ? parseInt(storedVisits) + 1 : 1240; // High base for professional feel
    localStorage.setItem('portfolio_visits', newVisitCount.toString());
    setVisitorCount(newVisitCount);

    // Simulated connected people based on a base number + visits
    const baseConnections = 850;
    setConnectedCount(baseConnections + Math.floor(newVisitCount * 0.4));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const whatsappLink = `https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`;

  // Dynamic styles for the prominent background cover photo
  const fadeOpacity = Math.max(0, 1 - scrollY / 700);
  const blurValue = Math.min(25, scrollY / 15);
  const scaleEffect = 1 + (scrollY / 1500) * 0.08;

  const firstLine = "MD. Mukaddimul Haque";
  const secondLine = "Muneem";

  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-28 pb-12 px-4 relative overflow-hidden scroll-mt-20">
      
      {/* Prominent Cover Photo Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden bg-dark-900"
        style={{ 
          opacity: fadeOpacity,
          transform: `scale(${scaleEffect})`,
          filter: `blur(${blurValue}px)`,
          transition: 'filter 0.1s ease-out'
        }}
      >
        <img 
          src={profile.coverPhoto || profile.profilePic} 
          alt="Hero Cover" 
          className="w-full h-full object-cover opacity-[0.2] md:opacity-[0.25] grayscale contrast-110 brightness-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2070';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-transparent to-dark-900 opacity-60"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10 w-full">
        <div className="flex flex-col items-center mb-10">
          <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full border-4 border-brand-500 shadow-2xl shadow-brand-500/20 overflow-hidden mb-8 hover:scale-105 transition-transform duration-500 bg-dark-800">
            <img 
              src={profile.profilePic} 
              alt={profile.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${profile.name}&background=2563eb&color=fff&size=300`;
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-block px-4 py-1.5 rounded-full bg-brand-900/40 border border-brand-600/30 text-brand-400 text-[10px] md:text-sm font-bold tracking-widest uppercase backdrop-blur-md">
              Biomedical Engineer & Tech Innovator
            </div>
            <div className="flex gap-2">
              <a 
                href={`mailto:${profile.email}`}
                className="w-8 h-8 md:w-9 md:h-9 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-brand-400 hover:bg-brand-600 hover:text-white transition-all shadow-lg backdrop-blur-sm"
              >
                <i className="fa-solid fa-envelope text-xs"></i>
              </a>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 md:w-9 md:h-9 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-green-400 hover:bg-green-600 hover:text-white transition-all shadow-lg backdrop-blur-sm"
              >
                <i className="fa-brands fa-whatsapp text-xs"></i>
              </a>
            </div>
          </div>
        </div>

        <h1 className="text-[6.8vw] sm:text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold text-white mb-8 leading-[1.1] tracking-tighter drop-shadow-2xl px-2 uppercase text-center overflow-visible">
          <span className="block mb-2 whitespace-nowrap">{firstLine}</span>
          <span className="text-gradient block whitespace-nowrap">{secondLine}</span>
        </h1>

        <p className="max-w-3xl mx-auto text-base md:text-2xl text-slate-200 mb-12 leading-relaxed font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] px-4">
          {profile.bio}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4">
          <button 
            onClick={(e) => handleScrollTo(e, 'about')}
            className="bg-brand-600 hover:bg-brand-700 text-white px-8 md:px-10 py-4 rounded-full font-bold transition-all hover:scale-105 shadow-2xl shadow-brand-600/30 flex items-center justify-center gap-3 text-base md:text-lg w-full sm:w-auto"
          >
            View Portfolio <i className="fa-solid fa-arrow-right"></i>
          </button>

          <button 
            onClick={(e) => handleScrollTo(e, 'contact')}
            className="flex-1 sm:flex-none glass-card hover:bg-slate-800 text-slate-300 px-8 md:px-10 py-4 rounded-full font-bold transition-all hover:scale-105 border border-slate-700 flex items-center justify-center gap-3 text-base md:text-lg backdrop-blur-md w-full sm:w-auto"
          >
            Contact Me
          </button>
        </div>
        
        {/* Interactive Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4 mt-20 border-t border-slate-800/50 pt-10 max-w-6xl mx-auto px-4 relative">
          <button 
            onClick={(e) => handleScrollTo(e, 'leadership')}
            className="group text-center focus:outline-none"
          >
            <div className="text-xl md:text-3xl font-bold text-white group-hover:text-brand-400 transition-colors">GPA 5.0</div>
            <div className="text-[9px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-300 transition-colors">Academic</div>
          </button>
          
          <button 
            onClick={(e) => handleScrollTo(e, 'projects')}
            className="group text-center focus:outline-none"
          >
            <div className="text-xl md:text-3xl font-bold text-white group-hover:text-brand-400 transition-colors">{projectCount}+</div>
            <div className="text-[9px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-300 transition-colors">Projects</div>
          </button>
          
          <button 
            onClick={(e) => handleScrollTo(e, 'leadership')}
            className="group text-center focus:outline-none"
          >
            <div className="text-xl md:text-3xl font-bold text-white group-hover:text-brand-400 transition-colors">Top 50</div>
            <div className="text-[9px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-300 transition-colors">Leaders</div>
          </button>

          <button 
            onClick={(e) => handleScrollTo(e, 'awards')}
            className="group text-center focus:outline-none"
          >
            <div className="text-xl md:text-3xl font-bold text-white group-hover:text-brand-400 transition-colors">2023</div>
            <div className="text-[9px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-300 transition-colors">Intl. Award</div>
          </button>

          <div className="group text-center cursor-default">
            <div className="text-xl md:text-3xl font-bold text-brand-400 transition-colors">
              {visitorCount.toLocaleString()}
            </div>
            <div className="text-[9px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-300 transition-colors">Profile Views</div>
          </div>

          <div className="group text-center cursor-default">
            <div className="text-xl md:text-3xl font-bold text-brand-400 transition-colors">
              {connectedCount.toLocaleString()}+
            </div>
            <div className="text-[9px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-300 transition-colors">Connected</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;