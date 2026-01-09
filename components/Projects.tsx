
import React from 'react';
import { Project } from '../types';

interface ProjectsProps {
  projects: Project[];
}

const Projects: React.FC<ProjectsProps> = ({ projects }) => {
  return (
    <section id="projects" className="py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Featured Initiatives</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Direct solutions powered by engineering and social entrepreneurship.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="glass-card rounded-2xl overflow-hidden group hover:scale-[1.02] transition duration-300 border border-slate-700/50 flex flex-col">
              {/* Brand Visual Area - Transparent Container */}
              <a 
                href={project.link || '#'} 
                target={project.link ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`h-72 bg-gradient-to-br ${project.color} to-slate-900 flex items-center justify-center transition-all duration-700 relative overflow-hidden ${project.link ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              >
                {/* Visual Depth Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)] opacity-40"></div>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Logo Badge - No white background, forced visibility */}
                <div className="relative z-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3">
                  {project.logo ? (
                    <div className={`flex items-center justify-center w-48 h-48 md:w-56 md:h-56 transition-all transform-gpu`}>
                      <img 
                        src={project.logo} 
                        alt={`${project.title} official logo`} 
                        className={`w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all
                          ${(project.id === 'plastixide' || project.id === 'poster-shorai') ? 'brightness-125 saturate-150 contrast-125' : ''}`}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                        }}
                      />
                      <div className="fallback-icon hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-md rounded-full w-24 h-24 border border-white/20">
                        <i className={`fa-solid ${project.icon} text-5xl text-white`}></i>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-dark-900/60 p-12 rounded-full backdrop-blur-xl group-hover:scale-110 transition-transform duration-500 border border-white/20 shadow-2xl">
                      <i className={`fa-solid ${project.icon} text-7xl text-white`}></i>
                    </div>
                  )}
                  
                  {/* Status Label */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-dark-900/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 whitespace-nowrap">
                    Launch Site
                  </div>
                </div>

                {project.link && (
                  <div className="absolute top-8 right-8 bg-white/10 hover:bg-white text-white hover:text-brand-900 p-3.5 rounded-2xl transition-all backdrop-blur-2xl z-20 border border-white/20 shadow-2xl group/link">
                    <i className="fa-solid fa-arrow-up-right-from-square text-sm group-hover/link:scale-110 transition-transform"></i>
                  </div>
                )}
              </a>

              <div className="p-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-3xl font-black text-white leading-tight tracking-tight group-hover:text-brand-400 transition-colors">{project.title}</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="inline-block text-[10px] font-black tracking-widest text-brand-400 bg-brand-900/40 px-4 py-1.5 rounded-full uppercase border border-brand-500/30">
                    {project.category}
                  </span>
                </div>
                
                <p className="text-slate-400 text-base leading-relaxed mb-10 flex-grow font-medium">
                  {project.description}
                </p>

                {/* Achievements */}
                {project.achievements && project.achievements.length > 0 && (
                  <div className="mb-10 space-y-4 bg-white/[0.03] p-6 rounded-[2rem] border border-white/[0.05] shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Verified Milestones</p>
                    {project.achievements.map((achievement, idx) => (
                      <div key={idx} className="flex items-start gap-4 text-xs text-brand-100 font-bold italic leading-tight group/ach">
                        <i className="fa-solid fa-circle-check text-brand-500 mt-0.5 group-hover/ach:scale-110 transition-transform"></i>
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto">
                  {project.link ? (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full bg-slate-800 hover:bg-white text-white hover:text-slate-900 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all group/btn shadow-2xl hover:shadow-white/10 active:scale-95 border border-white/5"
                    >
                      Access Brand Site <i className="fa-solid fa-arrow-right group-hover/btn:translate-x-1.5 transition-transform"></i>
                    </a>
                  ) : (
                    <button className="w-full bg-slate-900/50 text-slate-600 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 cursor-not-allowed border border-slate-800/50">
                      Coming Soon <i className="fa-solid fa-lock text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
