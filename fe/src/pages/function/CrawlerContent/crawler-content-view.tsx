import React, { useState } from 'react';
import axios from 'axios';
import { ExtractResponse } from './types';

interface Props {
  data: ExtractResponse | null;
  loading: boolean;
}

const CrawlerResultTable: React.FC<Props> = ({ data, loading }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const handleToggleBookmark = async () => {
    if (!data?._id || bookmarkLoading) return;
    
    setBookmarkLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Nếu đã bookmark thì xóa (DELETE), chưa thì thêm (POST)
      if (isBookmarked) {
        await axios.delete(`http://localhost:8000/api/v1/bookmarks/${data._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsBookmarked(false);
      } else {
        await axios.post(`http://localhost:8000/api/v1/bookmarks/${data._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Lỗi thao tác Bookmark:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) return (
    <div className="w-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-indigo-500">Đang phân tích bài viết...</p>
    </div>
  );

  if (!data) return (
    <div className="py-24 text-center flex flex-col items-center animate-in fade-in duration-500">
       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"></path>
          </svg>
       </div>
       <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Đang chờ link bài viết</h3>
       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Vui lòng nhập URL hợp lệ</p>
    </div>
  );

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <article className="p-8 md:p-12 max-w-4xl mx-auto">
        <header className="mb-10 relative">
          {/* NÚT YÊU THÍCH (BOOKMARK) */}
          <div className="absolute top-0 right-0">
            <button 
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              className={`p-4 rounded-2xl transition-all duration-300 group ${
                isBookmarked 
                  ? 'bg-red-50 text-red-500 shadow-inner' 
                  : 'bg-slate-50 text-slate-300 hover:text-red-400 hover:bg-red-50'
              }`}
            >
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${isBookmarked ? 'scale-110 fill-current' : 'scale-100 group-hover:scale-125'}`} 
                fill={isBookmarked ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {data.extraction_method || 'AI NEURAL'}
              </span>
              <span className="text-[11px] text-slate-400 font-bold truncate max-w-[200px] md:max-w-xs">{data.url}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight tracking-tight pr-16">
            {data.title}
          </h1>
          <div className="h-1.5 w-20 bg-indigo-500 rounded-full mt-4"></div>
        </header>

        <section className="text-slate-700 leading-[1.8] text-lg space-y-7 font-medium border-t border-slate-50 pt-8">
          {data.content ? (
            data.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="hover:text-slate-900 transition-colors">
                  {paragraph}
                </p>
              )
            ))
          ) : (
            <p className="text-slate-400 italic font-bold">Nội dung không khả dụng.</p>
          )}
        </section>
      </article>
    </div>
  );
};

export default CrawlerResultTable;