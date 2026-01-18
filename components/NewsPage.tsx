
import React, { useState, useMemo, useEffect } from 'react';
import { NewsPost, NewsComment } from '../types';

interface NewsPageProps {
  news: NewsPost[];
  onLike: (postId: string, increment: boolean) => void;
  onComment: (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => void;
}

interface DateFilter {
  year: number | null;
  month: number | null;
}

const ITEMS_PER_PAGE = 6;

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

const ImageCollage: React.FC<{ images: string[], onImageClick: (img: string) => void, contentLen: number }> = ({ images, onImageClick, contentLen }) => {
  if (!images || images.length === 0) return null;

  const count = images.length;
  const isCompressed = contentLen > 500;
  
  const getGridClass = () => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count >= 4) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-1';
  };

  return (
    <div 
      className={`grid ${getGridClass()} gap-2 md:gap-3 mb-8 overflow-hidden rounded-xl border border-slate-200 p-1 bg-slate-50 shadow-inner transition-all duration-500 ${isCompressed ? 'max-h-[300px] md:max-h-[400px]' : 'max-h-[500px] md:max-h-[700px]'}`}
    >
      {images.slice(0, 6).map((img, idx) => {
        const isMain = idx === 0 && (count === 3 || count >= 5);
        return (
          <div 
            key={idx} 
            onClick={(e) => { e.stopPropagation(); onImageClick(img); }}
            className={`relative overflow-hidden cursor-zoom-in transition-all duration-500 hover:brightness-90 ${isMain ? 'md:col-span-2 md:row-span-2' : 'aspect-square'}`}
          >
            <img 
              src={img} 
              className="w-full h-full object-cover" 
              alt={`News Part ${idx + 1}`} 
            />
          </div>
        );
      })}
    </div>
  );
};

const Lightbox: React.FC<{ images: string[], current: string | null, onClose: () => void }> = ({ images, current, onClose }) => {
  const [index, setIndex] = useState(images.indexOf(current || ''));
  if (!current) return null;
  const next = () => setIndex((index + 1) % images.length);
  const prev = () => setIndex((index - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-8 right-8 text-white text-4xl hover:scale-110 transition-transform z-50">
        <i className="fa-solid fa-xmark"></i>
      </button>
      <div className="relative w-full h-full flex items-center justify-center">
        {images.length > 1 && (
          <button onClick={prev} className="absolute left-4 md:left-10 text-white/50 hover:text-white text-4xl p-4 transition-all z-50">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
        <img src={images[index]} className="max-w-full max-h-full object-contain animate-in zoom-in duration-500 shadow-2xl" alt="Gallery View" />
        {images.length > 1 && (
          <button onClick={next} className="absolute right-4 md:right-10 text-white/50 hover:text-white text-4xl p-4 transition-all z-50">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}
      </div>
      <div className="mt-8 text-white/50 font-black tracking-widest text-xs uppercase">Dispatch Item {index + 1} of {images.length}</div>
    </div>
  );
};

const CommentSection: React.FC<{ post: NewsPost, onComment: (text: string) => void }> = ({ post, onComment }) => {
  const [commentText, setCommentText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(commentText);
    setCommentText('');
    setIsFocused(false);
  };

  return (
    <div className="mt-12 pt-8 border-t-2 border-slate-900 animate-in slide-in-from-bottom-4">
      <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
        <i className="fa-solid fa-comments text-brand-600"></i> {post.comments.length} Thoughts on this Dispatch
      </h3>

      {/* Input Field (YouTube Style) */}
      <div className="flex gap-4 mb-10">
        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">
          V
        </div>
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={commentText}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full border-b-2 border-slate-200 focus:border-slate-900 bg-transparent py-2 text-sm outline-none transition-all resize-none min-h-[40px] font-sans"
            rows={isFocused ? 3 : 1}
          />
          {isFocused && (
            <div className="flex justify-end gap-3 mt-3 animate-in fade-in duration-300">
              <button 
                type="button" 
                onClick={() => { setIsFocused(false); setCommentText(''); }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!commentText.trim()}
                className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-600 transition-colors shadow-lg"
              >
                Comment
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Comment List */}
      <div className="space-y-8">
        {post.comments.length > 0 ? [...post.comments].reverse().map((comment) => (
          <div key={comment.id} className="flex gap-4 group">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-black text-xs shrink-0 shadow-sm uppercase">
              {comment.userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-tight text-slate-900">{comment.userName}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">• {comment.date}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                {comment.text}
              </p>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <i className="fa-solid fa-comment-slash text-slate-300 text-3xl mb-4 block"></i>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Be the first to share your perspective</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NewsPage: React.FC<NewsPageProps> = ({ news, onLike, onComment }) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ year: null, month: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Toggle Like Logic
  const [userLikedPosts, setUserLikedPosts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('user_liked_dispatches');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('user_liked_dispatches', JSON.stringify(Array.from(userLikedPosts)));
  }, [userLikedPosts]);

  const handleToggleLike = (postId: string) => {
    const isCurrentlyLiked = userLikedPosts.has(postId);
    const newLiked = new Set(userLikedPosts);
    if (isCurrentlyLiked) {
      newLiked.delete(postId);
      onLike(postId, false);
    } else {
      newLiked.add(postId);
      onLike(postId, true);
    }
    setUserLikedPosts(newLiked);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchQuery]);

  const handlePrint = () => window.print();

  const handleShare = (platform: string, post: NewsPost) => {
    const url = window.location.href;
    const text = encodeURIComponent(`Check out this dispatch: ${post.title}`);
    let shareUrl = '';
    switch (platform) {
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
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

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNews, currentPage]);

  const selectedPost = useMemo(() => news.find(p => p.id === selectedPostId), [news, selectedPostId]);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const ActionButtons = ({ post, variant = 'list' }: { post: NewsPost, variant?: 'list' | 'single' }) => {
    const isLiked = userLikedPosts.has(post.id);
    return (
      <div className={`flex items-center gap-4 ${variant === 'single' ? 'mt-8 pt-6 border-t border-slate-200' : 'opacity-0 group-hover:opacity-100 transition-all duration-300'}`}>
        <button 
          onClick={() => handleToggleLike(post.id)} 
          className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-brand-600 hover:scale-110'}`}
        >
          <i className={`fa-${isLiked ? 'solid' : 'regular'} fa-heart`}></i> {post.likes} <span className="hidden sm:inline">{isLiked ? 'Loved' : 'Love'}</span>
        </button>
        <button 
          onClick={() => setSelectedPostId(post.id)}
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600"
        >
          <i className="fa-solid fa-comment"></i> {post.comments.length} <span className="hidden sm:inline">Comments</span>
        </button>
        <div className="relative">
          <button onClick={() => setActiveShareId(activeShareId === post.id ? null : post.id)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600">
            <i className="fa-solid fa-share-nodes"></i> Share
          </button>
          {activeShareId === post.id && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border-2 border-slate-900 p-2 flex flex-col gap-2 shadow-2xl z-50 animate-in slide-in-from-bottom-2">
              <button onClick={() => handleShare('facebook', post)} className="text-[9px] font-black uppercase hover:text-brand-600 flex items-center gap-2 pr-4"><i className="fa-brands fa-facebook"></i> Facebook</button>
              <button onClick={() => handleShare('whatsapp', post)} className="text-[9px] font-black uppercase hover:text-green-600 flex items-center gap-2 pr-4"><i className="fa-brands fa-whatsapp"></i> WhatsApp</button>
              <button onClick={() => handleShare('linkedin', post)} className="text-[9px] font-black uppercase hover:text-blue-600 flex items-center gap-2 pr-4"><i className="fa-brands fa-linkedin"></i> LinkedIn</button>
            </div>
          )}
        </div>
        {variant === 'single' && (
          <button onClick={handlePrint} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700">
            <i className="fa-solid fa-file-pdf"></i> PDF Download
          </button>
        )}
      </div>
    );
  };

  const TickerItems = () => (
    <>
      {news.map((n) => (
        <React.Fragment key={`${n.id}-copy`}>
          <span className="cursor-pointer hover:text-brand-400 transition-colors" onClick={() => setSelectedPostId(n.id)}>{n.title}</span>
          <span className="text-slate-700 mx-2">•</span>
        </React.Fragment>
      ))}
      <span className="text-brand-400 font-black italic">MD. MUKADDIMUL HAQUE MUNEEM PORTFOLIO DISPATCH</span>
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
            <h1 className="headline headline-animated italic select-none transform-gpu cursor-pointer" onClick={() => { setSelectedPostId(null); setDateFilter({ year: null, month: null }); setSearchQuery(''); }}>THE CHANGEMAKER</h1>
            <div className="w-full py-4 border-t border-slate-200 flex justify-center items-center">
               <p className="text-[10px] md:text-sm uppercase font-bold italic tracking-[0.3em] text-slate-800">ENGINEERING EXCELLENCE • LEADERSHIP INSIGHTS • COMMUNITY WELFARE</p>
            </div>
            <div className="w-full bg-[#0f172a] flex items-center border-t-2 border-b-2 border-slate-900 overflow-hidden">
               <div className="bg-brand-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest shrink-0 z-10 border-r border-slate-800 relative">LATEST DISPATCH</div>
               <div className="flex-1 overflow-hidden relative h-full flex items-center bg-[#0f172a]">
                 <div className="animate-marquee py-2 flex items-center">
                   <div className="flex items-center gap-4 px-4 whitespace-nowrap text-white text-[10px] md:text-xs font-bold uppercase tracking-widest"><TickerItems /></div>
                   <div className="flex items-center gap-4 px-4 whitespace-nowrap text-white text-[10px] md:text-xs font-bold uppercase tracking-widest"><TickerItems /></div>
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
              <ImageCollage images={selectedPost.images || []} onImageClick={(img) => setLightboxImg(img)} contentLen={selectedPost.content.length} />
              <div className={`text-lg md:text-2xl leading-[1.7] text-slate-800 mb-12 ${selectedPost.content.length > 400 ? 'columns-1 md:columns-2 gap-10' : ''}`}>
                <LinkifiedText text={selectedPost.content} />
              </div>
              <ActionButtons post={selectedPost} variant="single" />
              
              {/* Integrated Comment Section Below the Post */}
              <CommentSection 
                post={selectedPost} 
                onComment={(text) => onComment(selectedPost.id, { userName: 'Verified Guest', text })} 
              />
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
                    <div className={idx === 0 ? "flex flex-col gap-6" : ""}>
                      <ImageCollage images={post.images || []} onImageClick={(img) => setLightboxImg(img)} contentLen={post.content.length} />
                      <div>
                        <p className={`text-slate-700 line-clamp-[6] mb-4 ${idx === 0 ? 'text-base md:text-lg leading-relaxed' : 'text-sm'}`}>
                          <LinkifiedText text={post.content} />
                        </p>
                        <div className="flex items-center justify-between">
                          <button onClick={() => setSelectedPostId(post.id)} className="text-[9px] font-black uppercase tracking-[0.2em] border border-slate-900 px-3 py-1 hover:bg-slate-900 hover:text-white transition-all print:hidden">Read Full Dispatch</button>
                          <ActionButtons post={post} variant="list" />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 py-8 border-t border-slate-200 print:hidden">
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-10 h-10 flex items-center justify-center border-2 border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 hover:text-white transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-10 h-10 flex items-center justify-center border-2 text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 hover:border-slate-900'}`}>{i + 1}</button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-10 h-10 flex items-center justify-center border-2 border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 hover:text-white transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                  </div>
                )}
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
                          <button key={m} onClick={() => setDateFilter({ year, month: m })} className="text-[8px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/30 px-2 py-1 transition-all">{new Date(2000, m).toLocaleString(undefined, { month: 'short' }).toUpperCase()}</button>
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
      {lightboxImg && (selectedPost || news.some(n => n.images.includes(lightboxImg))) && (
        <Lightbox images={(selectedPost ? selectedPost.images : news.find(n => n.images.includes(lightboxImg))?.images) || []} current={lightboxImg} onClose={() => setLightboxImg(null)} />
      )}
      <button onClick={handlePrint} className="fixed bottom-10 left-10 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-[70] print:hidden border border-white/20" title="Print Edition"><i className="fa-solid fa-print"></i></button>
      <div className="max-w-6xl mx-auto mt-4 flex justify-between px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest print:hidden">
        <span>MUNEEM IMPACT NETWORK</span>
        <span>© {new Date().getFullYear()} THE CHANGEMAKER</span>
      </div>
    </div>
  );
};

export default NewsPage;
