
import React from 'react';
import { Profile } from '../types';

interface ConnectProps {
  profile: Profile;
}

const Connect: React.FC<ConnectProps> = ({ profile }) => {
  const whatsappLink = `https://wa.me/+8801876343423`;

  const socials = [
    { 
      icon: 'fa-linkedin', 
      type: 'brands', 
      href: profile.linkedin || 'https://www.linkedin.com/in/md-mukaddimul-haque-muneem', 
      label: 'LinkedIn',
      brandColor: '#0077B5',
      glow: 'shadow-blue-600/20'
    },
    { 
      icon: 'fa-facebook', 
      type: 'brands', 
      href: profile.facebook || 'https://www.facebook.com/mukaddimul.muneem', 
      label: 'Facebook',
      brandColor: '#1877F2',
      glow: 'shadow-blue-500/20'
    },
    { 
      icon: 'fa-instagram', 
      type: 'brands', 
      href: profile.instagram || 'https://www.instagram.com/m.h.anzir10', 
      label: 'Instagram',
      brandColor: '#E1306C',
      glow: 'shadow-pink-600/20'
    },
    { 
      icon: 'fa-telegram', 
      type: 'brands', 
      href: profile.telegram || 'https://t.me/Mhanzir10', 
      label: 'Telegram',
      brandColor: '#0088CC',
      glow: 'shadow-cyan-600/20'
    },
    { 
      icon: 'fa-whatsapp', 
      type: 'brands', 
      href: whatsappLink, 
      label: 'WhatsApp',
      brandColor: '#25D366',
      glow: 'shadow-green-500/20'
    },
    { 
      icon: 'fa-envelope', 
      type: 'solid', 
      href: `mailto:${profile.email || 'mukaddimulmunna@gmail.com'}`, 
      label: 'Email',
      brandColor: '#EA4335',
      glow: 'shadow-red-600/20'
    },
  ];

  return (
    <section id="connect" className="py-24 bg-dark-900 overflow-hidden relative border-t border-slate-800/50 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 relative z-10 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-16 flex flex-col items-center">
          <h2 className="text-4xl md:text-6xl font-heading font-black tracking-tighter uppercase mb-4">
            <span className="text-white">LET'S </span>
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">CONNECT</span>
          </h2>
          <div className="w-16 h-1 bg-brand-500 rounded-full mt-1"></div>
        </div>

        {/* Social Media Links Grid */}
        <div className="flex flex-wrap justify-center gap-5 md:gap-6 mb-20 w-full max-w-3xl">
          {socials.map((social, idx) => (
            <a
              key={idx}
              href={social.href}
              target={social.href.startsWith('mailto') ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-white transition-all duration-300 shadow-xl group backdrop-blur-md hover:-translate-y-2 hover:border-slate-600 ${social.glow}`}
              aria-label={social.label}
              style={{ '--brand-color': social.brandColor } as React.CSSProperties}
            >
              <i 
                className={`fa-${social.type} ${social.icon} text-xl md:text-2xl transition-all duration-300 group-hover:scale-110`}
                style={{ color: 'inherit' }} // Default
                onMouseEnter={(e) => (e.currentTarget.style.color = social.brandColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
              ></i>
            </a>
          ))}
        </div>

        {/* Feature Card (The Quote Box) */}
        <div className="w-full max-w-4xl px-4">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/10 to-cyan-400/10 rounded-[2.5rem] blur-2xl opacity-40"></div>
            
            <div className="relative bg-[#1a2333] border border-slate-700/50 rounded-[2rem] md:rounded-[3rem] p-10 md:p-20 text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center">
              
              {/* Decorative Large Quotes */}
              <div className="absolute top-10 left-10 text-white/5 text-[12rem] font-serif leading-none pointer-events-none select-none italic">
                “
              </div>

              <blockquote className="text-2xl md:text-4xl font-heading font-bold italic text-white leading-tight md:leading-snug mb-10 relative z-10 max-w-2xl">
                "Transforming healthcare and society through engineering and leadership."
              </blockquote>

              <div className="flex items-center justify-center gap-3 text-slate-500 relative z-10 bg-dark-900/50 px-6 py-2.5 rounded-full border border-slate-700/50 backdrop-blur-sm group-hover:text-slate-300 transition-colors">
                <i className="fa-solid fa-location-dot text-brand-500 text-sm"></i>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">
                  MIRPUR 14, DHAKA, BANGLADESH
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Connect;
