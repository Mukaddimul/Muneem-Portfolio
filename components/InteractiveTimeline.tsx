
import React, { useState } from 'react';
import { TimelineItem } from '../types';

interface InteractiveTimelineProps {
  timeline: TimelineItem[];
}

const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ timeline }) => {
  const [activeId, setActiveId] = useState<string | null>(timeline.length > 0 ? timeline[0].id : null);

  const toggleItem = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <div className="relative py-12 max-w-5xl mx-auto">
      <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-600 via-purple-600 to-slate-800 -translate-x-1/2 hidden md:block"></div>
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-800 md:hidden"></div>

      <div className="space-y-12">
        {timeline.map((item, index) => {
          const isActive = activeId === item.id;
          const isEven = index % 2 === 0;

          return (
            <div key={item.id} className={`relative flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              
              <button 
                onClick={() => toggleItem(item.id)}
                className={`absolute left-8 md:left-1/2 w-6 h-6 rounded-full border-4 border-dark-900 z-10 -translate-x-1/2 transition-all duration-500 outline-none
                  ${isActive ? 'bg-brand-400 scale-125 shadow-[0_0_20px_rgba(96,165,250,0.8)]' : 'bg-slate-600 hover:bg-brand-500'}`}
              >
                {isActive && <div className="absolute inset-0 rounded-full animate-ping bg-brand-400/50"></div>}
              </button>

              <div className={`hidden md:flex flex-1 ${isEven ? 'justify-end pr-12' : 'justify-start pl-12'}`}>
                <span className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-brand-400' : 'text-slate-500'}`}>
                  {item.date}
                </span>
              </div>

              <div className="flex-1 w-full pl-16 md:pl-0">
                <div 
                  onClick={() => toggleItem(item.id)}
                  className={`glass-card p-6 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden
                    ${isActive ? 'border-brand-500/50 bg-slate-800/80 shadow-2xl' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'}`}
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                      ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <div>
                      <h3 className={`font-bold transition-colors ${isActive ? 'text-white text-xl' : 'text-slate-200'}`}>{item.title}</h3>
                      <p className="text-brand-400 text-sm font-semibold">{item.subtitle}</p>
                    </div>
                  </div>

                  <p className={`text-slate-400 text-sm leading-relaxed mb-4 transition-all ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                    {item.description}
                  </p>

                  <div className={`grid transition-all duration-500 ease-in-out ${isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                    <div className="overflow-hidden">
                      <ul className="space-y-3 pt-2 border-t border-slate-700/50">
                        {item.details.map((detail, dIdx) => (
                          <li key={dIdx} className="flex gap-3 text-xs text-slate-300 items-start">
                            <i className="fa-solid fa-circle-check text-brand-500 mt-0.5"></i>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex gap-2">
                        <span className="text-[10px] bg-dark-900/50 px-2 py-1 rounded text-slate-500 font-mono uppercase">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:hidden mt-4 text-[10px] font-bold text-slate-500 tracking-tighter uppercase">
                    {item.date}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveTimeline;
