
import React, { useState, useMemo } from 'react';
import { NewsPost } from '../types';

interface HomeNewsSectionProps {
  news: NewsPost[];
  onReadMore: (postId: string) => void;
}

const ITEMS_PER_PAGE = 6;

const HomeNewsSection: React.FC<HomeNewsSectionProps> = ({ news, onReadMore }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Sort news by date (newest first)
  const sortedNews = useMemo(() => {
    return [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [news]);

  const totalPages = Math.ceil(sortedNews.length / ITEMS_PER_PAGE);
  
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedNews, currentPage]);

  if (news.length === 0) return null;

  return (
    <section id="news" className="py-24 bg-[#f4f1ea] border-t-2 border-b-2 border-slate-900 overflow-hidden scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            Latest Dispatches
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-black text-slate-900 tracking-tighter uppercase italic">
            Impact <span className="text-brand-600">Journal</span>
          </h2>
          <div className="w-24 h-1 bg-slate-900 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {currentItems.map((post, idx) => (
            <article 
              key={post.id} 
              className="flex flex-col border-b-2 border-slate-200 pb-8 group h-full"
            >
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                <span>{new Date(post.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>{post.author}</span>
              </div>

              {post.images && post.images.length > 0 && (
                <div className="aspect-[16/10] overflow-hidden rounded-lg mb-6 border border-slate-200 shadow-sm grayscale hover:grayscale-0 transition-all duration-700 bg-slate-100">
                  <img 
                    src={post.images[0]} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}

              <h3 
                className="text-2xl font-black text-slate-900 mb-4 leading-tight tracking-tight group-hover:text-brand-600 transition-colors cursor-pointer line-clamp-2 italic uppercase"
                onClick={() => onReadMore(post.id)}
              >
                {post.title}
              </h3>

              <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 font-serif">
                {post.content}
              </p>

              <div className="mt-auto">
                <button 
                  onClick={() => onReadMore(post.id)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 hover:text-brand-600 hover:border-brand-600 transition-all pb-1 flex items-center gap-2"
                >
                  Read Full Story <i className="fa-solid fa-arrow-right-long"></i>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-16 pt-10 border-t border-slate-200 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-12 h-12 flex items-center justify-center border-2 border-slate-900 rounded-full text-slate-900 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>

              <div className="flex items-center gap-1 mx-4">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center text-xs font-black rounded-full transition-all border-2 ${
                      currentPage === i + 1 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                        : 'text-slate-500 border-transparent hover:border-slate-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-12 h-12 flex items-center justify-center border-2 border-slate-900 rounded-full text-slate-900 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Page {currentPage} of {totalPages} • Impact Journal Archive
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeNewsSection;
