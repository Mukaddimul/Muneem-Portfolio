
import React, { useState, useMemo } from 'react';
import InteractiveTimeline from './InteractiveTimeline';
import { TimelineItem } from '../types';

interface LeadershipProps {
  timeline: TimelineItem[];
}

const Leadership: React.FC<LeadershipProps> = ({ timeline }) => {
  const [filter, setFilter] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Experience', icon: 'fa-border-all' },
    { id: 'education', label: 'Education', icon: 'fa-graduation-cap' },
    { id: 'professional', label: 'Professional', icon: 'fa-briefcase' },
    { id: 'leadership', label: 'Leadership', icon: 'fa-users' },
    { id: 'volunteer', label: 'Volunteer', icon: 'fa-hand-holding-heart' },
    { id: 'creative', label: 'Creative', icon: 'fa-palette' },
  ];

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return timeline;
    return timeline.filter(item => item.type === filter);
  }, [timeline, filter]);

  return (
    <section id="leadership" className="py-24 bg-dark-900 relative scroll-mt-20">
      <div className="absolute top-40 left-0 text-[10rem] font-black text-white/5 select-none -translate-x-1/2 pointer-events-none uppercase">
        History
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-brand-900/40 rounded-full text-brand-400 text-[10px] font-bold tracking-widest uppercase mb-4 border border-brand-500/20">
            Professional Journey
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">Experience & Leadership</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10">Explore my diverse background across corporate, academic, and social sectors.</p>
          
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  filter === cat.id 
                    ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/20' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <i className={`fa-solid ${cat.icon}`}></i>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTimeline.length > 0 ? (
          <InteractiveTimeline timeline={filteredTimeline} />
        ) : (
          <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
            <i className="fa-solid fa-folder-open text-4xl text-slate-600 mb-4 block"></i>
            <p className="text-slate-500">No items found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Leadership;
