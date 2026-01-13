import React, { useState, useMemo, useEffect } from 'react';
import { NewsPost, NewsComment } from '../types';

interface NewsPageProps {
  news: NewsPost[];
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: Omit<NewsComment, 'id' | 'date'>) => void;
}

interface DateFilter {
  year: number | null;
  month: number | null; // 0-11
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
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-600 hover:text-brand-700 underline decoration-1 underline-offset-4 transition-colors break-all font-semibold"
            >
              {part}
            </a>
          );
        }
        if (part.match(handleRegex)) {
          return (
            <a 
              key={i} 
              href={`https://www.google.com/search?q=${encodeURIComponent(part.substring(1))}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-600 hover:text-brand-700 font-bold transition-colors"
            >
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

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchQuery]);

  const handleDownloadPDF = () => {
    window.print();
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
    return Object.keys(structure)
      .map(Number)
      .sort((a, b) => b - a)
      .map(year => ({
        year,
        months: Array.from(structure[year]).sort((a, b) => b - a)
      }));
  }, [news]);

  const filteredNews = useMemo(() => {
    let result = [...news];
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (dateFilter.year !== null) {
      result = result.filter(post => new Date(post.date).getFullYear() === dateFilter.year);
    }
    if (dateFilter.month !== null) {
      result = result.filter(post => new Date(post.date).getMonth() === dateFilter.month);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(q) || 
        post.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [news, dateFilter, searchQuery]);

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  const paginatedNews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNews, currentPage]);

  const selectedPost = useMemo(() => {
    return news.find(p => p.id === selectedPostId);
  }, [news, selectedPostId]);

  const navigateToArticle = (id: string) => {
    setSelectedPostId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getMonthName = (monthIdx: number) => {
    return new Date(2000, monthIdx).toLocaleString(undefined, { month: 'long' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-4 mt-12 py-8 border-t-4 border-double border-slate-900">
        <button 
          disabled={currentPage === 1}
          onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border-2 border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 hover:text-white transition-all"
        >
          Prev
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Page {currentPage} / {totalPages}
        </span>
        <button 
          disabled={currentPage === totalPages}
          onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border-2 border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 hover:text-white transition-all"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="pt-28 pb-20 px-4 bg-[#f4f1ea] min-h-screen text-slate-900 font-serif print:bg-white print:pt-0 overflow-visible">
      <div className="max-w-6xl mx-auto border-[1px] border-slate-300 p-0 bg-white shadow-2xl print:shadow-none print:border-none overflow-visible">
        
        {/* NEWSPAPER TOP HEADER BAR */}
        <div className="hidden md:flex justify-between items-center px-4 py-1 text-[9px] font-black uppercase tracking-widest border-b border-slate-200 text-slate-500 bg-slate-50/50">
          <span>Registered Portfolio Archive • Natore, Bangladesh</span>
          <span>Price: Free / Open Source</span>
          <span>Weather: Engineering Outlook Bright</span>
        </div>

        {/* Newspaper Header Masthead */}
        <header className="border-b-4 border-double border-slate-900 text-center py-6 px-4 md:py-10 mb-0 overflow-hidden relative">
          <div className="flex justify-between items-center text-[9px] md:text-xs uppercase font-black tracking-[0.2em] text-slate-500 mb-6 border-b border-slate-100 pb-2">
            <span className="hidden sm:inline">Dispatch Vol. {new Date().getFullYear()}</span>
            <span className="font-heading text-brand-600 font-extrabold tracking-[0.4em] mx-auto sm:mx-0">IMPACT JOURNAL</span>
            <span className="hidden sm:inline">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</span>
          </div>
          
          <div className="w-full flex justify-center items-center">
            <h1 
              className="headline italic select-none transform-gpu cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => { setSelectedPostId(null); setDateFilter({ year: null, month: null }); setSearchQuery(''); }}
            >
              The Change Maker
            </h1>
          </div>
          
          <div className="border-t-[1px] border-slate-900 mt-2 pt-4">
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] text-slate-800 italic">Engineering Excellence • Leadership Insights • Community Welfare</p>
          </div>
        </header>

        {/* Breaking News Bar */}
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center gap-4 overflow-hidden border-b-2 border-slate-900">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-brand-600 px-2 py-0.5 animate-pulse">LATEST DISPATCH</span>
          <div className="flex-1 whitespace-nowrap overflow-hidden">
            <p className="text-[11px] font-bold uppercase tracking-wider animate-[marquee_20s_linear_infinite]">
              {news.slice(0, 3).map(p => ` • ${p.title}`).join(' ')} • MD. MUKADDIMUL HAQUE MUNEEM PORTFOLIO UPDATED 2024
            </p>
          </div>
        </div>

        {selectedPostId && selectedPost ? (
          /* SINGLE POST VIEW */
          <div className="p-4 md:p-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <button 
              onClick={() => setSelectedPostId(null)}
              className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-600 flex items-center gap-2 group print:hidden"
            >
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
                  <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-auto max-h-[600px] object-contain mx-auto" />
                </div>
              )}
              <div className="text-lg md:text-2xl leading-[1.7] text-slate-800 mb-12 first-letter:text-7xl first-letter:font-black first-letter:text-slate-900 first-letter:mr-3 first-letter:float-left first-letter:leading-none columns-1 md:columns-2 gap-10">
                <LinkifiedText text={selectedPost.content} />
              </div>
              <div className="flex gap-4 print:hidden border-t-2 border-slate-100 pt-8">
                 <button onClick={handleDownloadPDF} className="bg-slate-900 text-white px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest"><i className="fa-solid fa-file-pdf mr-2"></i> Print to PDF</button>
              </div>
            </article>
          </div>
        ) : (
          /* MAIN LIST VIEW - Newspaper Grid Layout */
          <div className="p-0 border-t-2 border-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-12">
              
              {/* LEFT COLUMN: PRIMARY NEWS */}
              <div className="md:col-span-8 p-4 md:p-6 border-r-0 md:border-r-[1px] border-slate-200">
                {paginatedNews.length > 0 ? (
                  <div className="space-y-10">
                    {/* FEATURED LEAD STORY */}
                    {paginatedNews[0] && (
                      <article className="border-b-4 border-double border-slate-200 pb-10">
                        <h2 className="text-3xl md:text-6xl font-black leading-[1] mb-6 hover:text-brand-600 transition-colors cursor-pointer italic" onClick={() => navigateToArticle(paginatedNews[0].id)}>
                          {paginatedNews[0].title}
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {paginatedNews[0].image && (
                            <div className="border border-slate-200 p-1 group cursor-pointer overflow-hidden" onClick={() => navigateToArticle(paginatedNews[0].id)}>
                              <img src={paginatedNews[0].image} className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700" alt="Lead" />
                            </div>
                          )}
                          <div>
                            <p className="text-base md:text-lg leading-relaxed text-slate-700 line-clamp-[8] mb-6">
                              <LinkifiedText text={paginatedNews[0].content} />
                            </p>
                            <button onClick={() => navigateToArticle(paginatedNews[0].id)} className="text-[10px] font-black uppercase tracking-[0.2em] border-2 border-slate-900 px-4 py-2 hover:bg-slate-900 hover:text-white transition-all">Full Story →</button>
                          </div>
                        </div>
                      </article>
                    )}

                    {/* SUB-GRID FOR SECONDARY STORIES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {paginatedNews.slice(1).map((post) => (
                        <article key={post.id} className="border-b sm:border-b-0 border-slate-100 pb-8 sm:pb-0">
                          {post.image && (
                            <img src={post.image} className="w-full h-32 object-cover grayscale mb-4 border border-slate-100 cursor-pointer" alt="post" onClick={() => navigateToArticle(post.id)} />
                          )}
                          <h3 className="text-xl md:text-2xl font-bold leading-tight mb-3 hover:text-brand-600 cursor-pointer" onClick={() => navigateToArticle(post.id)}>{post.title}</h3>
                          <div className="text-[9px] font-black uppercase text-slate-400 mb-3">{formatDate(post.date)}</div>
                          <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4 italic">
                            {post.content}
                          </p>
                        </article>
                      ))}
                    </div>
                    {renderPagination()}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic font-bold">No dispatches found in this criteria.</div>
                )}
              </div>

              {/* RIGHT COLUMN: SIDEBAR BRIEFS & ARCHIVE */}
              <div className="md:col-span-4 bg-slate-50/50 p-4 md:p-6 space-y-10 overflow-visible">
                {/* Search Box */}
                <div className="border-2 border-slate-900 p-4 bg-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">Archive Search</h4>
                  <input 
                    type="text" 
                    placeholder="Keywords..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border border-slate-300 text-xs font-bold outline-none focus:border-slate-900"
                  />
                </div>

                {/* News Briefs List - The Editorial Desk */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-slate-900 pb-1">The Editorial Desk</h4>
                  {news.slice(0, 5).map(p => (
                    <div key={p.id} className="border-b border-slate-200 pb-4 group cursor-pointer" onClick={() => navigateToArticle(p.id)}>
                      <h5 className="text-sm font-bold leading-tight group-hover:text-brand-600 transition-colors mb-1 uppercase tracking-tight italic">{p.title}</h5>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{formatDate(p.date)}</span>
                    </div>
                  ))}
                </div>

                {/* Archive Directory */}
                <div className="border-2 border-slate-900 p-4 bg-slate-900 text-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/20 pb-1">Annual Index</h4>
                  <div className="space-y-4">
                    {archiveStructure.map(({ year, months }) => (
                      <div key={year}>
                        <div className="text-xs font-black text-brand-400 mb-2 cursor-pointer hover:underline" onClick={() => setDateFilter({ year, month: null })}>{year} Edition</div>
                        <div className="flex flex-wrap gap-1">
                          {months.map(m => (
                            <button key={m} onClick={() => setDateFilter({ year, month: m })} className="text-[8px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/30 px-2 py-1 transition-all">{getMonthName(m).slice(0, 3)}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Credits */}
                <div className="pt-10 opacity-30 text-center">
                   <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-800 leading-relaxed">
                    © {new Date().getFullYear()} THE CHANGE MAKER <br/> NATORE OFFICE: NATORE, BD <br/> MIRPUR OFFICE: DHAKA, BD
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Newspaper Footer Style Bar */}
      <div className="max-w-6xl mx-auto mt-4 flex justify-between px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest print:hidden">
        <span>EST. 2024</span>
        <span>MUNEEM IMPACT NETWORK</span>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default NewsPage;