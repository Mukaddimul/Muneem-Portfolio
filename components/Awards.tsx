
import React from 'react';
import { Award } from '../types';

interface AwardsProps {
  awards: Award[];
}

const Awards: React.FC<AwardsProps> = ({ awards }) => {
  return (
    <section id="awards" className="py-24 bg-brand-600 relative overflow-hidden scroll-mt-20">
      {/* Decorative inner elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-12">
          <i className="fa-solid fa-medal mr-3"></i> Global Recognition
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {awards.map((award, i) => (
            <div key={award.id || i} className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all group">
              <div className="text-3xl text-white mb-4 group-hover:scale-110 transition-transform">
                <i className={`fa-solid ${award.icon}`}></i>
              </div>
              <h3 className="font-bold text-white text-xl mb-1">{award.title}</h3>
              <p className="text-blue-100/80 text-sm font-medium">{award.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Awards;
