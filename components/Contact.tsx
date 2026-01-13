
import React from 'react';
import { Profile } from '../types';

interface ContactProps {
  profile: Profile;
}

const Contact: React.FC<ContactProps> = ({ profile }) => {
  const socialLinks = [
    { name: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', color: 'hover:bg-blue-600', href: 'https://www.linkedin.com/in/md-mukaddimul-haque-muneem' },
    { name: 'Facebook', icon: 'fa-brands fa-facebook-f', color: 'hover:bg-blue-700', href: 'https://www.facebook.com/mukaddimul.munna' },
    { name: 'Instagram', icon: 'fa-brands fa-instagram', color: 'hover:bg-pink-600', href: 'https://www.instagram.com/m.h.anzir10' },
    { name: 'Telegram', icon: 'fa-brands fa-telegram', color: 'hover:bg-sky-500', href: 'https://t.me/Mhanzir10' },
    { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: 'hover:bg-green-600', href: `https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}` },
    { name: 'Email', icon: 'fa-solid fa-envelope', color: 'hover:bg-brand-600', href: `mailto:${profile.email}` },
  ];

  return (
    <section id="contact" className="py-24 bg-dark-900 relative scroll-mt-20 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-400 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center space-y-10">
          
          {/* Section Heading */}
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-heading font-black text-white uppercase tracking-tighter mb-4">
              Let's <span className="text-gradient">Connect</span>
            </h2>
            <div className="w-16 h-1 bg-brand-600 mx-auto rounded-full opacity-50 mb-2"></div>
          </div>

          {/* Social Links Row */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {socialLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-12 h-12 md:w-14 md:h-14 bg-slate-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-lg md:text-xl ${link.color} transition-all duration-300 shadow-xl border border-slate-700 hover:-translate-y-2 group`}
                title={link.name}
              >
                <i className={`${link.icon} group-hover:scale-110 transition-transform`}></i>
              </a>
            ))}
          </div>

          {/* Minimalist Branded Card */}
          <div className="glass-card w-full max-w-3xl p-8 md:p-14 rounded-[2.5rem] border border-slate-700/50 shadow-2xl relative overflow-hidden group">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-50"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Centered Professional Tagline */}
              <p className="text-white text-lg md:text-3xl font-heading font-bold mb-6 italic leading-tight text-center max-w-2xl drop-shadow-2xl">
                "Transforming healthcare and society through engineering and leadership."
              </p>
              
              {/* Location centered exactly under tagline */}
              <div className="flex items-center gap-3 text-slate-400 hover:text-brand-400 transition-colors duration-500">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800 shadow-inner group-hover:border-brand-500/50 transition-colors">
                  <i className="fa-solid fa-location-dot text-brand-500 text-sm"></i>
                </div>
                <p className="text-[10px] md:text-sm font-black text-slate-300 tracking-widest uppercase">
                  {profile.location}
                </p>
              </div>
            </div>
          </div>

          {/* Simple footer indicator */}
          <div className="pt-4 opacity-10 hover:opacity-100 transition-opacity">
            <div className="w-1 h-10 bg-gradient-to-b from-brand-600 to-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
