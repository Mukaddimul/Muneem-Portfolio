
import React, { useState, useEffect, useRef } from 'react';
import { Skill } from '../types';

interface SkillsProps {
  skills: Skill[];
}

const Skills: React.FC<SkillsProps> = ({ skills }) => {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax calculation for background elements
  const parallaxStyle = (factor: number) => ({
    transform: `translateY(${(scrollY - (sectionRef.current?.offsetTop || 0)) * factor}px)`,
  });

  return (
    <section 
      id="skills" 
      ref={sectionRef}
      className="py-32 relative overflow-hidden bg-dark-900 scroll-mt-20"
    >
      {/* Dynamic Background Accents */}
      <div 
        className="absolute top-40 -left-20 text-brand-500/5 text-[20rem] font-black pointer-events-none select-none hidden lg:block"
        style={parallaxStyle(-0.15)}
      >
        <i className="fa-solid fa-microchip"></i>
      </div>
      <div 
        className="absolute bottom-40 -right-20 text-purple-500/5 text-[18rem] font-black pointer-events-none select-none hidden lg:block"
        style={parallaxStyle(0.12)}
      >
        <i className="fa-solid fa-bolt-lightning"></i>
      </div>
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-900/30 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8 animate-pulse">
            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
            Expertise Matrix
          </div>
          <h2 className="text-5xl md:text-7xl font-heading font-black text-white mb-8 tracking-tighter uppercase leading-tight">
            The <span className="text-gradient">Core Engine</span> <br/> of My Innovation
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
            A fusion of biomedical science and creative engineering, designed to solve complex global challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {skills.map((skill, index) => (
            <div 
              key={skill.id} 
              className="group relative"
            >
              {/* Card Outer Container with custom border glow on hover */}
              <div className="relative h-full glass-card p-[1px] rounded-[3rem] transition-all duration-700 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:-translate-y-4">
                
                {/* Gradient Border Overlay */}
                <div className={`absolute inset-0 rounded-[3rem] bg-gradient-to-br from-slate-700/50 to-transparent opacity-100 group-hover:from-brand-500/50 group-hover:to-purple-500/50 transition-all duration-700`}></div>

                {/* Main Card Body */}
                <div className="relative bg-dark-900/80 backdrop-blur-xl rounded-[2.9rem] p-10 h-full flex flex-col overflow-hidden">
                  
                  {/* Subtle Grid Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

                  {/* Icon Section */}
                  <div className="mb-10 relative">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-800/50 flex items-center justify-center text-4xl text-slate-400 border border-slate-700/50 transition-all duration-500 group-hover:bg-brand-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-[10deg] group-hover:shadow-2xl group-hover:shadow-brand-600/40 relative z-10">
                      <i className={`fa-solid ${skill.icon}`}></i>
                    </div>
                    {/* Ghost Icon behind on hover */}
                    <div className="absolute top-0 left-0 w-20 h-20 text-brand-500/0 group-hover:text-brand-500/20 text-6xl flex items-center justify-center transition-all duration-700 scale-50 group-hover:scale-150 blur-sm pointer-events-none">
                      <i className={`fa-solid ${skill.icon}`}></i>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-brand-400 transition-colors">
                      {skill.title}
                    </h3>
                    <div className="w-12 h-1 bg-brand-600/30 mt-3 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 w-0 group-hover:w-full transition-all duration-700"></div>
                    </div>
                  </div>

                  {/* Skill Items with Interactive Elements */}
                  <div className="space-y-4 flex-1 mb-10">
                    {skill.items.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-4 group/item cursor-default"
                      >
                        <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-brand-500 transition-colors duration-300"></div>
                        <span className="text-slate-400 group-hover:text-slate-100 font-semibold text-sm transition-all duration-300 transform group-hover/item:translate-x-1">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Efficiency Visualizer */}
                  <div className="pt-8 border-t border-slate-800/50 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aptitude</span>
                      <span className="text-[10px] font-black text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">HIGH LEVEL</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-600 to-cyan-400 transition-all duration-1000 ease-out"
                        style={{ width: '0%', '--target-val': `${80 + (index * 4)}%` } as any}
                        ref={(el) => {
                          if (el) {
                            const observer = new IntersectionObserver((entries) => {
                              if (entries[0].isIntersecting) {
                                setTimeout(() => {
                                  el.style.width = el.style.getPropertyValue('--target-val');
                                }, index * 150);
                              }
                            });
                            observer.observe(el);
                          }
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Collaboration Footer Section */}
        <div className="mt-24 p-1 rounded-[3.5rem] bg-gradient-to-r from-brand-600/20 via-purple-600/20 to-brand-600/20 glass-card">
          <div className="bg-dark-900/80 backdrop-blur-3xl p-12 md:p-16 rounded-[3.4rem] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
            
            {/* Animated background lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
            </div>

            <div className="max-w-2xl relative z-10">
              <h4 className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tight leading-tight">
                Seeking a <span className="text-gradient">Versatile Collaborator</span>?
              </h4>
              <p className="text-slate-400 text-lg md:text-xl font-medium">
                I integrate diverse skill sets to build solutions that don't just work—they inspire. Let's engineer the future together.
              </p>
            </div>

            <a 
              href="#contact"
              className="px-12 py-6 bg-brand-600 hover:bg-white text-white hover:text-dark-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-brand-600/30 hover:shadow-white/10 active:scale-95 group shrink-0 relative z-10"
            >
              Initialize Connection
              <i className="fa-solid fa-arrow-right ml-3 group-hover:translate-x-2 transition-transform"></i>
            </a>

            {/* Subtle Floating Icon */}
            <div className="absolute -bottom-10 -right-10 text-[12rem] text-brand-500/5 -rotate-12 transition-transform duration-1000 group-hover:rotate-0">
              <i className="fa-solid fa-hand-fist"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
