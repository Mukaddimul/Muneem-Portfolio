
import React from 'react';

interface AboutProps {
  bio: string;
  name: string;
}

const About: React.FC<AboutProps> = ({ bio, name }) => {
  return (
    <section id="about" className="py-24 bg-dark-900 scroll-mt-20 relative overflow-hidden">
      {/* Background subtle light effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand-600/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-brand-500 mb-4">Executive Briefing</h2>
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold text-white tracking-tighter">
            Vision & <span className="text-gradient">Mission</span>
          </h2>
        </div>
        
        {/* The Expanded "Rectangle Format" Bio Container */}
        <div className="relative group max-w-5xl mx-auto">
          {/* Animated Border Gradient */}
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/30 to-brand-400/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative glass-card rounded-2xl border-2 border-brand-500/20 p-8 md:p-14 bg-dark-800/80 backdrop-blur-xl shadow-2xl flex flex-col items-center">
            
            {/* Top accent icon */}
            <div className="mb-10 text-brand-500 bg-brand-500/10 w-12 h-12 rounded-xl flex items-center justify-center border border-brand-500/20 shadow-lg shadow-brand-500/10">
              <i className="fa-solid fa-feather-pointed text-xl"></i>
            </div>

            {/* Organized Bio Text with Justified Alignment & Expanded Width */}
            <div className="w-full max-w-4xl mx-auto">
              <p className="text-lg md:text-2xl text-slate-200 leading-[1.8] font-medium tracking-tight mb-12 text-justify">
                <span className="text-4xl font-serif text-brand-500 float-left mr-3 leading-none mt-1">“</span>
                {bio}
                <span className="text-4xl font-serif text-brand-500 ml-1 leading-none">”</span>
              </p>
            </div>
            
            {/* Integrated Stats Grid - Organized within the rectangle */}
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-slate-700/50">
              <div className="flex flex-col items-center md:items-start text-center md:text-left px-2">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 bg-brand-500 rounded-full"></span> Focus
                </span>
                <span className="text-white font-bold text-sm tracking-tight">Biomedical AI</span>
              </div>
              
              <div className="flex flex-col items-center md:items-start text-center md:text-left px-2 border-l border-slate-700/30">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 bg-brand-500 rounded-full"></span> Hometown
                </span>
                <span className="text-white font-bold text-sm tracking-tight">Natore, BD</span>
              </div>
              
              <div className="flex flex-col items-center md:items-start text-center md:text-left px-2 border-l border-slate-700/30">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 bg-brand-500 rounded-full"></span> Status
                </span>
                <span className="text-white font-bold text-sm tracking-tight">Undergraduate</span>
              </div>
              
              <div className="flex flex-col items-center md:items-start text-center md:text-left px-2 border-l border-slate-700/30">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 bg-brand-500 rounded-full"></span> Impact
                </span>
                <span className="text-white font-bold text-sm tracking-tight">National Level</span>
              </div>
            </div>

            {/* Bottom visual balance - subtle logo/brand mark */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-brand-600 rounded-full border-4 border-dark-900 flex items-center justify-center text-[10px] text-white font-black shadow-lg">
              M
            </div>
          </div>
        </div>

        {/* Floating background markers */}
        <div className="absolute -bottom-10 -right-20 text-[15rem] font-black text-white/5 select-none -rotate-12 pointer-events-none">
          MUNEEM
        </div>
      </div>
    </section>
  );
};

export default About;
