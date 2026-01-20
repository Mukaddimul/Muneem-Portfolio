
import React from 'react';
import { Profile } from '../types';

interface ContactProps {
  profile: Profile;
  onAdminClick?: () => void;
}

const Contact: React.FC<ContactProps> = ({ profile, onAdminClick }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="py-16 bg-dark-900 relative border-t border-slate-800/50 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-400 rounded-full blur-[160px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center">
          
          {/* Contact Pills Container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 w-full max-w-4xl">
            {/* Phone Pill */}
            <a 
              href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-3 bg-slate-800/40 hover:bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700/50 transition-all duration-300 group shadow-lg w-full sm:w-auto"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-600/10 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-phone text-xs"></i>
              </div>
              <span className="text-slate-300 font-sans font-bold text-sm tracking-tight whitespace-nowrap">
                {profile.phone}
              </span>
            </a>

            {/* Email Pill */}
            <a 
              href={`mailto:${profile.email}`}
              className="flex items-center gap-3 bg-slate-800/40 hover:bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700/50 transition-all duration-300 group shadow-lg w-full sm:w-auto"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-600/10 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-envelope text-xs"></i>
              </div>
              <span className="text-slate-300 font-sans font-bold text-sm tracking-tight whitespace-nowrap">
                {profile.email}
              </span>
            </a>
          </div>

          {/* Interactive Status Line Link */}
          <a 
            href="#admin-login"
            onClick={(e) => {
              if (onAdminClick) {
                e.preventDefault();
                onAdminClick();
              }
            }}
            className="flex items-center justify-center gap-2 text-slate-600 mb-12 px-4 py-1.5 bg-slate-800/10 rounded-full border border-slate-800/30 backdrop-blur-sm transition-all hover:text-slate-400 hover:border-slate-700 cursor-pointer no-underline group"
          >
            <i className="fa-solid fa-lock text-[10px] group-hover:scale-110 transition-transform"></i>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
              Dashboard Access Secured
            </span>
          </a>

          {/* Footer Credits */}
          <div className="w-full text-center border-t border-slate-800/30 pt-10">
            <p className="text-slate-400 font-sans font-bold text-xs md:text-sm mb-3">
              © {currentYear} MD. Mukaddimul Haque Muneem. All Rights Reserved.
            </p>
            <p className="text-slate-600 text-[8px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
              ENGINEERED WITH <i className="fa-solid fa-heart text-red-500/50 animate-pulse"></i> IN BANGLADESH
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Contact;
