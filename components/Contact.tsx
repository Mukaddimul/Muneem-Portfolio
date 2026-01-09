
import React from 'react';
import { Profile } from '../types';

interface ContactProps {
  profile: Profile;
}

const Contact: React.FC<ContactProps> = ({ profile }) => {
  const socialLinks = [
    { name: 'Facebook', icon: 'fa-brands fa-facebook-f', color: 'hover:bg-blue-700', href: 'https://www.facebook.com/mukaddimul.munna' },
    { name: 'Instagram', icon: 'fa-brands fa-instagram', color: 'hover:bg-pink-600', href: 'https://www.instagram.com/m.h.anzir10' },
    { name: 'Telegram', icon: 'fa-brands fa-telegram', color: 'hover:bg-sky-500', href: 'https://t.me/Mhanzir10' },
    { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: 'hover:bg-green-600', href: `https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}` },
    { name: 'Email', icon: 'fa-solid fa-envelope', color: 'hover:bg-brand-600', href: `mailto:${profile.email}` },
  ];

  return (
    <section id="contact" className="py-24 bg-dark-900 relative scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Let's Connect</h2>
        <p className="text-slate-400 mb-12 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          I am always open to discussing biomedical innovation, social impact projects, or creative design opportunities. Reach out if you want to collaborate!
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-16">
          {socialLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-14 h-14 md:w-16 md:h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl ${link.color} transition-all duration-300 shadow-lg border border-slate-700 hover:-translate-y-2 group`}
              title={link.name}
            >
              <i className={link.icon}></i>
            </a>
          ))}
        </div>

        {/* Enhanced background box with adaptive padding for mobile */}
        <div className="glass-card p-8 md:p-20 rounded-[2rem] md:rounded-[3rem] border border-slate-700/50 max-w-5xl mx-auto shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10">
            <p className="text-white text-xl md:text-3xl font-heading font-bold mb-10 italic leading-snug max-w-3xl mx-auto">
              "Transforming healthcare and society through engineering and leadership."
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-slate-300 text-sm md:text-base font-medium">
              <span className="flex items-center gap-3 hover:text-brand-400 transition cursor-default">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                  <i className="fa-solid fa-location-dot text-brand-400"></i>
                </div>
                <span className="text-left">{profile.location}</span>
              </span>
              <a href={`tel:${profile.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 hover:text-brand-400 transition group/link">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover/link:bg-brand-600/20 group-hover/link:border-brand-500/50 transition-all shrink-0">
                  <i className="fa-solid fa-phone text-brand-400"></i>
                </div>
                <span>{profile.phone}</span>
              </a>
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 hover:text-brand-400 transition group/link">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover/link:bg-brand-600/20 group-hover/link:border-brand-500/50 transition-all shrink-0">
                  <i className="fa-solid fa-envelope text-brand-400"></i>
                </div>
                <span className="break-all">{profile.email}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
