
import React, { useState } from 'react';
import { NewsPost, NewsComment } from '../types';

interface NewsPageProps {
  news: NewsPost[];
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => void;
}

const NewsPage: React.FC<NewsPageProps> = ({ news, onLike, onComment }) => {
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [sharingPost, setSharingPost] = useState<string | null>(null);

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!userName.trim() || !commentText.trim()) return;

    onComment(postId, { userName, text: commentText });
    setUserName('');
    setCommentText('');
    setCommentingOn(null);
  };

  const scrollToPost = (id: string) => {
    const element = document.getElementById(`post-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownloadPDF = (postId: string) => {
    setSharingPost(null);
    // Give time for state update/menu close before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const shareLinks = (post: NewsPost) => {
    const url = window.location.href;
    const text = `Read "${post.title}" on The Change Maker.`;
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`,
      instagram: `https://www.instagram.com/`
    };
  };

  // Render the newspaper-style news page
  return (
    <div className="pt-28 pb-20 px-4 bg-[#f8f9fa] min-h-screen text-slate-900 font-serif print:bg-white print:pt-0">
      <div className="max-w-6xl mx-auto border-4 border-slate-900 p-1 bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] print:shadow-none print:border-none">
        
        {/* Newspaper Header */}
        <header className="border-b-4 border-double border-slate-900 text-center py-12 px-2 md:px-4 mb-10 overflow-hidden relative">
          <div className="flex justify-between items-center text-[8px] sm:text-[10px] md:text-xs uppercase font-black tracking-[0.1em] sm:tracking-[0.3em] text-slate-500 mb-8 border-b border-slate-100 pb-4 px-2">
            <span className="hidden sm:inline">Engineering Archive Vol. 24</span>
            <span className="font-heading text-brand-600 font-extrabold tracking-widest mx-auto sm:mx-0">Innovation & Leadership</span>
            <span className="hidden sm:inline">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</span>
          </div>
          
          <div className="flex justify-center items-center overflow-visible w-full px-1">
            <h1 className="text-[7.6vw] sm:text-[8vw] md:text-7xl lg:text-8xl xl:text-9xl font-black font-heading uppercase tracking-tighter leading-[0.9] mb-8 italic whitespace-nowrap transition-all select-none transform-gpu drop-shadow-sm">
              The Change Maker
            </h1>
          </div>
          
          <div className="border-t-4 border-double border-slate-900 pt-6 mx-2">
            <p className="text-[8px] sm:text-[10px] md:text-sm font-bold uppercase tracking-[0.05em] sm:tracking-[0.2em] md:tracking-[0.4em] text-slate-800">Biomedical Engineering • Social Impact • Creative Vision</p>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 p-2 md:p-6">
          {/* Main Stories */}
          <div className="md:col-span-8 space-y-16 border-r-0 md:border-r border-slate-200 pr-0 md:pr-12">
            {news.length > 0 ? (
              news.map((post) => (
                <article key={post.id} id={`post-${post.id}`} className="group border-b border-slate-100 pb-16 last:border-0 scroll-mt-32 break-inside-avoid">
                  <h2 className="text-3xl md:text-6xl font-bold leading-[1.1] mb-6 hover:text-brand-600 transition-colors cursor-pointer decoration-brand-600/30 decoration-4 underline-offset-4" onClick={() => scrollToPost(post.id)}>
                    {post.title}
                  </h2>
                  
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 italic">
                    <span className="bg-brand-600 text-white px-2 py-0.5 not-italic rounded-sm">Special Correspondent</span>
                    <span>By {post.author}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-slate-900 font-bold">{post.date}</span>
                  </div>

                  {post.image && (
                    <div className="mb-8 relative group/img border border-slate-200 p-1 bg-white">
                      <div className="w-full relative overflow-hidden bg-slate-50">
                        {/* Branded Color Tint Overlay */}
                        <div className="absolute inset-0 bg-brand-600/5 mix-blend-multiply z-10 transition-opacity group-hover/img:opacity-0 print:hidden"></div>
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="w-full h-auto max-h-[800px] object-contain mx-auto transition-transform duration-700 block" 
                        />
                      </div>
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400 italic text-right">
                        Archive ID: BME-{post.id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                  )}

                  <div className="text-lg md:text-xl leading-relaxed text-slate-800 mb-10 first-letter:text-7xl first-letter:font-black first-letter:text-brand-600 first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                    {post.content}
                  </div>

                  {/* Interactivity Bar - Hidden during print */}
                  <div className="flex items-center justify-between border-y border-slate-900/10 py-6 print:hidden">
                    <div className="flex items-center gap-8">
                      <button 
                        onClick={() => onLike(post.id)}
                        className="flex items-center gap-3 text-xs font-black tracking-widest hover:text-brand-600 transition-all group/like"
                      >
                        <i className="fa-solid fa-heart text-slate-300 group-hover/like:text-red-500 scale-125 transition-all"></i>
                        <span>{post.likes} <span className="hidden sm:inline">ENDORSEMENTS</span></span>
                      </button>
                      <button 
                        onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                        className="flex items-center gap-3 text-xs font-black tracking-widest hover:text-brand-600 transition-all"
                      >
                        <i className="fa-solid fa-comment text-slate-300 scale-125 transition-all"></i>
                        <span>{post.comments.length} <span className="hidden sm:inline">RESPONSES</span></span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setSharingPost(sharingPost === post.id ? null : post.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-600 transition-colors flex items-center gap-2"
                      >
                        Share Report <i className="fa-solid fa-share-nodes"></i>
                      </button>
                      
                      {sharingPost === post.id && (
                        <div className="absolute right-0 bottom-full mb-4 bg-white border-2 border-slate-900 p-4 shadow-2xl z-50 flex flex-col gap-3 min-w-[200px] animate-in slide-in-from-bottom-2">
                          <button 
                            onClick={() => handleDownloadPDF(post.id)} 
                            className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:text-brand-600 transition-colors text-left"
                          >
                            <i className="fa-solid fa-file-pdf w-5 text-center text-red-600"></i> Download PDF
                          </button>
                          <a href={shareLinks(post).facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:text-brand-600 transition-colors">
                            <i className="fa-brands fa-facebook w-5 text-center text-blue-600"></i> Facebook
                          </a>
                          <a href={shareLinks(post).whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:text-brand-600 transition-colors">
                            <i className="fa-brands fa-whatsapp w-5 text-center text-green-600"></i> WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Section */}
                  {commentingOn === post.id && (
                    <div className="mt-8 p-6 bg-slate-50 border-2 border-slate-900 animate-in slide-in-from-top-4 print:hidden">
                      <h4 className="text-sm font-black uppercase tracking-widest mb-6">Leave a Response</h4>
                      <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Your Name" 
                          value={userName} 
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full p-3 border-2 border-slate-900 text-sm font-bold focus:bg-white outline-none"
                        />
                        <textarea 
                          placeholder="Your comments..." 
                          value={commentText} 
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={3}
                          className="w-full p-3 border-2 border-slate-900 text-sm focus:bg-white outline-none"
                        />
                        <button type="submit" className="bg-slate-900 text-white px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-brand-600 transition-colors">
                          Publish Response
                        </button>
                      </form>
                      
                      {post.comments.length > 0 && (
                        <div className="mt-10 space-y-6">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 pb-2">Previous Responses</h5>
                          {post.comments.map(comment => (
                            <div key={comment.id} className="border-l-4 border-slate-200 pl-4 py-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm">{comment.userName}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">{comment.date}</span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed italic">"{comment.text}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="text-center py-20 italic text-slate-400">
                <i className="fa-solid fa-newspaper text-5xl mb-6 opacity-20 block"></i>
                No articles published in this archive.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-4 space-y-12 print:hidden">
            <div className="p-6 bg-slate-50 border-2 border-slate-900">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass"></i> Search Archive
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Keywords..." 
                  className="w-full p-3 border-2 border-slate-900 text-sm font-bold focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="p-6 bg-white border-2 border-slate-900">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-fire text-orange-500"></i> Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {['#Biomedical', '#Leadership', '#CivicTech', '#YouthPower', '#SustainableBD', '#MedilinkX', '#PlastiXide'].map(tag => (
                  <span key={tag} className="text-[10px] font-black uppercase tracking-widest border border-slate-200 px-3 py-1 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 bg-brand-600 text-white">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b-2 border-white/30 pb-2">Support Independent Innovation</h3>
              <p className="text-xs font-medium leading-relaxed mb-6 opacity-90">
                Join our newsletter to receive the latest updates on biomedical engineering and social impact projects directly from the lab.
              </p>
              <button className="w-full bg-white text-brand-600 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
                Subscribe to Dispatch
              </button>
            </div>
            
            <div className="pt-10 border-t-2 border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                © {new Date().getFullYear()} The Change Maker <br/> 
                Published in Dhaka, Bangladesh
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
