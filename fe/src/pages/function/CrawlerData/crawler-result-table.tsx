import React, { useState } from 'react';
import AddFavorites from '../Favorites/add-favorites';

interface CrawlerResultTableProps {
  articles: any[];
  analysis?: any;
}

const CrawlerResultTable: React.FC<CrawlerResultTableProps> = ({ articles, analysis }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {analysis && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg">AI Summary</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase italic ml-2">Chủ đề: {analysis.category}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed italic">"{analysis.summary}"</p>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguồn</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung bài viết</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lưu</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Đọc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {articles.length > 0 ? articles.map((item, index) => {
                // FIX: Đảm bảo lấy được ID dù BE trả về _id hay id
                const reportId = item._id || item.id;

                return (
                  <tr key={reportId || index} className="hover:bg-indigo-50/10 transition-all group">
                    <td className="p-5">
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50/50 px-2.5 py-1 rounded-md uppercase border border-indigo-100/50">
                        {item.source_name || "News"}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="max-w-xs space-y-1">
                        <p className="text-xs font-bold text-slate-700 truncate">{item.title}</p>
                        <div className="flex items-center gap-2">
                           <code className="text-[9px] text-slate-300 truncate max-w-[120px] font-mono">{item.url}</code>
                           <button onClick={(e) => { e.stopPropagation(); handleCopy(item.url, index); }} className="text-slate-300 hover:text-indigo-500 transition-colors">
                              {copiedIndex === index && <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1.5 py-0.5 rounded">Copied!</span>}
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                           </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      {/* TRUYỀN reportId ĐÃ FIX VÀO ĐÂY */}
                      <AddFavorites 
                        reportId={reportId} 
                        initialStatus={item.is_bookmarked || false} 
                      />
                    </td>
                    <td className="p-5 text-center">
                      <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 text-[9px] font-black uppercase bg-white border border-slate-200 text-slate-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all">Link</a>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="p-16 text-center opacity-20 text-[10px] font-bold uppercase italic tracking-widest">
                    Chưa có dữ liệu phân tích
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CrawlerResultTable;