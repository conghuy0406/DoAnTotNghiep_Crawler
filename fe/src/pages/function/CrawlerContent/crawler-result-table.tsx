import React from 'react';
import { ExtractResponse } from './types';

interface Props {
  data: ExtractResponse | null;
  loading: boolean;
}

const CrawlerResultTable: React.FC<Props> = ({ data, loading }) => {
  if (loading) return (
    <div className="w-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-indigo-500">Đang phân tích bài viết...</p>
    </div>
  );

  // PHẦN SỬA LỖI MỜ: Trạng thái trống được làm đậm nét
  if (!data) return (
    <div className="py-24 text-center flex flex-col items-center animate-in fade-in duration-500">
       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"></path>
          </svg>
       </div>
       <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-2">
          Đang chờ link bài viết
       </h3>
       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Vui lòng nhập URL hợp lệ để AI bắt đầu trích xuất nội dung
       </p>
    </div>
  );

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <article className="p-8 md:p-12 max-w-4xl mx-auto">
        <header className="mb-10 space-y-4">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
               {data.extraction_method || 'AI NEURAL'}
             </span>
             <span className="text-[11px] text-slate-400 font-bold truncate max-w-xs">{data.url}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight tracking-tight">
            {data.title}
          </h1>
          <div className="h-1.5 w-20 bg-indigo-500 rounded-full"></div>
        </header>

        <section className="text-slate-700 leading-[1.8] text-lg space-y-7 font-medium">
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