import React, { useState, useMemo, useEffect } from 'react';
import { NewsPost, NewsComment } from '../types';

interface NewsPageProps {
  news: NewsPost[];
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => void;
}

interface DateFilter {
  year: number | null;
  month: number | null;
}

const ITEMS_PER_PAGE = 10;

const LinkifiedText: React.FC<{ text: string }> = ({ text }) => {
  const urlRegex = /(https?:\/\/[^\s,;?!<>"]+[^\s,;?!<>".])/g;
  const handleRegex = /(@[a-zA-Z0-9_.-]+)/g;
  const parts = text.split(/(https?:\/\/[^\s,;?!<>"]+[^\s,;?!<>".]|@[a-zA-Z0-9_.-]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.match(urlRegex)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" 
               className="text-brand-600 hover:text-brand-700 underline decoration-1 underline-offset-4 transition-colors break-all font-semibold">
              {part}
            </a>
          );
        }
        if (part.match(handleRegex)) {
          return (
            <a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(part.substring(1))}`} 
               target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 font-bold transition-colors">
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};

const NewsPage: React.FC<NewsPageProps> = ({ news, onLike, onComment }) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ year: null, month: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShareId, setActiveShareId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (platform: string, post: NewsPost) => {
    const url = window.location.href;
    const text = encodeURIComponent(`Check out this dispatch: ${post.title}`);
    let shareUrl = '';

    switch (platform) {
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
      case 'instagram': alert('To share on Instagram, copy the link and paste it in your story/bio!'); return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
    setActiveShareId(null);
  };

  const archiveStructure = useMemo(() => {
    const structure: Record<number, Set<number>> = {};
    news.forEach(post => {
      const d = new Date(post.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      if (!structure[year]) structure[year] = new Set();
      structure[year].add(month);
    });
    return Object.keys(structure).map(Number).sort((a, b) => b - a).map(year => ({
      year, months: Array.from(structure[year]).sort((a, b) => b - a)
    }));
  }, [news]);

  const filteredNews = useMemo(() => {
    let result = [...news];
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (dateFilter.year !== null) result = result.filter(post => new Date(post.date).getFullYear() === dateFilter.year);
    if (dateFilter.month !== null) result = result.filter(post => new Date(post.date).getMonth() === dateFilter.month);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(post => post.title.toLowerCase().includes(q) || post.content.toLowerCase().includes(q));
    }
    return result;
  }, [news, dateFilter, searchQuery]);

  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNews, currentPage]);

  const selectedPost = useMemo(() => news.find(p => p.id === selectedPostId), [news, selectedPostId]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const ActionButtons = ({ post, variant = 'list' }: { post: NewsPost, variant?: 'list' | 'single' }) => {
    const [commentText, setCommentText] = useState('');
    const [showCommentInput, setShowCommentInput] = useState(false);

    return (
      <div className={`flex items-center gap-4 ${variant === 'single' ? 'mt-8 pt-6 border-t border-slate-200' : 'opacity-0 group-hover:opacity-100 transition-all duration-300'}`}>
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-600 hover:scale-110 transition-transform">
          <i className="fa-solid fa-heart text-red-500"></i> {post.likes} <span className="hidden sm:inline">Love</span>
        </button>
        <button onClick={() => setShowCommentInput(!showCommentInput)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600">
          <i className="fa-solid fa-comment"></i> {post.comments.length} <span className="hidden sm:inline">Comment</span>
        </button>
        
        <div className="relative">
          <button onClick={() => setActiveShareId(activeShareId === post.id ? null : post.id)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600">
            <i className="fa-solid fa-share-nodes"></i> Share
          </button>
          {activeShareId === post.id && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border-2 border-slate-900 p-2 flex flex-col gap-2 shadow-2xl z-50 animate-in slide-in-from-bottom-2">
              <button onClick={() => handleShare('facebook', post)} className="text-[9px] font-black uppercase hover:text-brand-600 flex items-center gap-2 pr-4"><i className="fa-brands fa-facebook"></i> Facebook</button>
              <button onClick={() => handleShare('whatsapp', post)} className="text-[9px] font-black uppercase hover:text-green-600 flex items-center gap-2 pr-4"><i className="fa-brands fa-whatsapp"></i> WhatsApp</button>
              <button onClick={() => handleShare('instagram', post)} className="text-[9px] font-black uppercase hover:text-pink-600 flex items-center gap-2 pr-4"><i className="fa-brands fa-instagram"></i> Instagram</button>
              <button onClick={() => handleShare('linkedin', post)} className="text-[9px] font-black uppercase hover:text-blue-600 flex items-center gap-2 pr-4"><i className="fa-brands fa-linkedin"></i> LinkedIn</button>
            </div>
          )}
        </div>

        {variant === 'single' && (
          <button onClick={handlePrint} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700">
            <i className="fa-solid fa-file-pdf"></i> PDF Download
          </button>
        )}

        {showCommentInput && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-slate-900 p-6 w-full max-w-md shadow-2xl">
              <h4 className="text-xs font-black uppercase tracking-widest mb-4">Post Comment</h4>
              <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your thoughts..."
                className="w-full border-2 border-slate-200 p-3 text-sm focus:border-slate-900 outline-none mb-4 min-h-[100px]"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCommentInput(false)} className="flex-1 text-[10px] font-black uppercase border-2 border-slate-200 py-2">Cancel</button>
                <button 
                  onClick={() => {
                    onComment(post.id, { userName: 'Verified Guest', text: commentText });
                    setCommentText('');
                    setShowCommentInput(false);
                  }}
                  className="flex-1 text-[10px] font-black uppercase bg-slate-900 text-white py-2"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TickerItems = () => (
    <>
      {news.map((n) => (
        <React.Fragment key={`${n.id}-copy`}>
          <span className="cursor-pointer hover:text-brand-400 transition-colors" onClick={() => setSelectedPostId(n.id)}>
            {n.title}
          </span>
          <span className="text-slate-700 mx-2">•</span>
        </React.Fragment>
      ))}
      <span className="text-brand-400 font-black">MD. MUKADDIMUL HAQUE MUNEEM PORTFOLIO</span>
      <span className="text-slate-700 mx-2">•</span>
    </>
  );

  return (
    <div className="pt-28 pb-20 px-4 bg-[#f4f1ea] min-h-screen text-slate-900 font-serif print:bg-white print:pt-0 overflow-visible relative">
      <div className="max-w-6xl mx-auto border-[1px] border-slate-300 p-0 bg-white shadow-2xl print:shadow-none print:border-none overflow-visible">
        
        <div className="hidden md:flex justify-between items-center px-4 py-1 text-[9px] font-black uppercase tracking-widest border-b border-slate-200 text-slate-500 bg-slate-50/50 print:hidden">
          <span>Registered Portfolio Archive • Dhaka, Bangladesh</span>
          <span>Weather: Engineering Outlook Bright</span>
        </div>

        <header className="border-b-4 border-double border-slate-900 text-center pt-6 md:pt-10 pb-0 mb-0 overflow-hidden relative">
          <div className="flex justify-between items-center px-4 text-[9px] md:text-xs uppercase font-black tracking-[0.2em] text-slate-500 mb-6 border-b border-slate-100 pb-2">
            <span className="hidden sm:inline">Dispatch Vol. {new Date().getFullYear()}</span>
            <span className="font-heading text-brand-600 font-extrabold tracking-[0.4em] mx-auto sm:mx-0">IMPACT JOURNAL</span>
            <span className="hidden sm:inline">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</span>
          </div>
          
          <div className="w-full flex flex-col justify-center items-center">
            <h1 className="headline headline-animated italic select-none transform-gpu cursor-pointer" onClick={() => { setSelectedPostId(null); setDateFilter({ year: null, month: null }); setSearchQuery(''); }}>
              The Change Maker
            </h1>

            {/* Tagline 1: Engineering Excellence Section */}
            <div className="w-full py-4 border-t border-slate-200 flex justify-center items-center">
               <p className="text-[10px] md:text-sm uppercase font-bold italic tracking-[0.3em] text-slate-800">
                 ENGINEERING EXCELLENCE • LEADERSHIP INSIGHTS • COMMUNITY WELFARE
               </p>
            </div>

            {/* Tagline 2: Latest Dispatch Ticker Bar */}
            <div className="w-full bg-[#0f172a] flex items-center border-t-2 border-b-2 border-slate-900">
               <div className="bg-brand-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest shrink-0 z-10 border-r border-slate-800">
                 LATEST DISPATCH
               </div>
               <div className="flex-1 overflow-hidden relative h-full flex items-center">
                 <div className="animate-marquee py-2">
                   <div className="flex items-center gap-4 px-4 whitespace-nowrap text-white text-[10px] md:text-xs font-bold uppercase tracking-widest">
                     <TickerItems />
                   </div>
                   {/* Duplicate for seamless looping */}
                   <div className="flex items-center gap-4 px-4 whitespace-nowrap text-white text-[10px] md:text-xs font-bold uppercase tracking-widest">
                     <TickerItems />
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </header>

        {selectedPostId && selectedPost ? (
          <div className="p-4 md:p-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <button onClick={() => setSelectedPostId(null)} className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-600 flex items-center gap-2 group print:hidden">
              <i className="fa-solid fa-arrow-left"></i> Back to Edition
            </button>

            <article>
              <h2 className="text-4xl md:text-7xl font-bold leading-[1.05] mb-6 italic border-b border-slate-100 pb-6">{selectedPost.title}</h2>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-500 mb-8 italic">
                <span>By {selectedPost.author}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-slate-900">{formatDate(selectedPost.date)}</span>
              </div>
              {selectedPost.image && (
                <div className="mb-10 border border-slate-200 p-1 bg-slate-50 shadow-inner">
                  <img src={selectedPost.image} className="w-full h-auto max-h-[600px] object-contain mx-auto" alt="post" />
                </div>
              )}
              <div className="text-lg md:text-2xl leading-[1.7] text-slate-800 mb-12 columns-1 md:columns-2 gap-10">
                <LinkifiedText text={selectedPost.content} />
              </div>
              <ActionButtons post={selectedPost} variant="single" />
            </article>
          </div>
        ) : (
          <div className="p-0 border-t-2 border-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-8 p-4 md:p-6 border-r-0 md:border-r-[1px] border-slate-200 news-print-container">
                {paginatedNews.map((post, idx) => (
                  <article key={post.id} className={`group border-b-2 border-double border-slate-100 pb-8 mb-8 news-article-print ${idx === 0 ? 'border-b-4' : ''}`}>
                    <h2 className={`font-black hover:text-brand-600 transition-colors cursor-pointer italic mb-4 ${idx === 0 ? 'text-3xl md:text-6xl leading-[1]' : 'text-2xl'}`} onClick={() => setSelectedPostId(post.id)}>
                      {post.title}
                    </h2>
                    <div className={idx === 0 ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
                      {post.image && (
                        <div className="border border-slate-200 p-1 bg-white mb-4" onClick={() => setSelectedPostId(post.id)}>
                          <img src={post.image} className="w-full h-auto transition-all duration-700" alt="post" />
                        </div>
                      )}
                      <div>
                        <p className={`text-slate-700 line-clamp-[6] mb-4 ${idx === 0 ? 'text-base md:text-lg leading-relaxed' : 'text-sm'}`}>
                          <LinkifiedText text={post.content} />
                        </p>
                        <div className="flex items-center justify-between">
                          <button onClick={() => setSelectedPostId(post.id)} className="text-[9px] font-black uppercase tracking-[0.2em] border border-slate-900 px-3 py-1 hover:bg-slate-900 hover:text-white transition-all print:hidden">Read Details</button>
                          <ActionButtons post={post} variant="list" />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="md:col-span-4 bg-slate-50/50 p-4 md:p-6 space-y-10 print:hidden">
                <div className="border-2 border-slate-900 p-4 bg-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">Archive Search</h4>
                  <input type="text" placeholder="Keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 border border-slate-300 text-xs font-bold outline-none" />
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-slate-900 pb-1">Editorial Shorts</h4>
                  {news.slice(0, 5).map(p => (
                    <div key={p.id} className="border-b border-slate-200 pb-4 group cursor-pointer" onClick={() => setSelectedPostId(p.id)}>
                      <h5 className="text-sm font-bold group-hover:text-brand-600 italic uppercase tracking-tighter">{p.title}</h5>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{formatDate(p.date)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-2 border-slate-900 p-4 bg-slate-900 text-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/20 pb-1">Annual Index</h4>
                  {archiveStructure.map(({ year, months }) => (
                    <div key={year} className="mb-4">
                      <div className="text-xs font-black text-brand-400 mb-2">{year} Edition</div>
                      <div className="flex flex-wrap gap-1">
                        {months.map(m => (
                          <button key={m} onClick={() => setDateFilter({ year, month: m })} className="text-[8px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/30 px-2 py-1 transition-all">
                            {new Date(2000, m).toLocaleString(undefined, { month: 'short' }).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setDateFilter({ year: null, month: null })} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white mt-2">Clear Selection</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Print Icon at the Bottom */}
      <button 
        onClick={handlePrint} 
        className="fixed bottom-10 left-10 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-[70] print:hidden border border-white/20"
        title="Print Edition"
      >
        <i className="fa-solid fa-print"></i>
      </button>

      <div className="max-w-6xl mx-auto mt-4 flex justify-between px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest print:hidden">
        <span>MUNEEM IMPACT NETWORK</span>
        <span>© {new Date().getFullYear()} THE CHANGE MAKER</span>
      </div>
    </div>
  );
};

export default NewsPage;