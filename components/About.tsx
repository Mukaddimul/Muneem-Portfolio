
import React from 'react';

interface AboutProps {
  bio: string;
  name: string;
}

const About: React.FC<AboutProps> = ({ bio, name }) => {
  return (
    <section id="about" className="py-24 bg-dark-800 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-8">
          The Journey of <span className="text-gradient">{name}</span>
        </h2>
        
        <div className="glass-card p-10 rounded-[2.5rem] border border-slate-700 max-w-4xl mx-auto shadow-2xl relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl pointer-events-none">
            <i className="fa-solid fa-quote-right"></i>
          </div>
          
          <p className="text-xl text-slate-300 leading-relaxed mb-10 italic">
            "{bio}"
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-dark-900/50 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Focus</span>
              <span className="text-white font-medium text-sm">Biomedical AI</span>
            </div>
            <div className="p-4 bg-dark-900/50 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Hometown</span>
              <span className="text-white font-medium text-sm">Natore, BD</span>
            </div>
            <div className="p-4 bg-dark-900/50 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Status</span>
              <span className="text-white font-medium text-sm">Undergraduate</span>
            </div>
            <div className="p-4 bg-dark-900/50 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Impact</span>
              <span className="text-white font-medium text-sm">National Level</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
