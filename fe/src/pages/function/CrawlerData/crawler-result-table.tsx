import React from 'react';

interface Props {
  articles: any[];
  analysis?: any;
}

const CrawlerResultTable: React.FC<Props> = ({ articles, analysis }) => {
  return (
    <div className="space-y-6">
      {/* Hiển thị tóm tắt từ AI nếu có dữ liệu phân tích */}
      {analysis && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg tracking-widest">AI Summary</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Chủ đề: {analysis.category}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed italic">
            "{analysis.summary}"
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
             {analysis.key_highlights?.slice(0, 3).map((hl: string, i: number) => (
                <span key={i} className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  ✦ {hl.substring(0, 50)}...
                </span>
             ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-50">
            <tr>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/4">Nguồn tin</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-2/4">Tiêu đề bài viết</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-1/4">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {articles.length > 0 ? articles.map((item, index) => (
              <tr key={index} className="hover:bg-indigo-50/20 transition-all group">
                <td className="p-4">
                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50/50 px-2.5 py-1 rounded-md uppercase border border-indigo-100/50">
                    {item.source_name}
                  </span>
                </td>
                <td className="p-4 text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </td>
                <td className="p-4 text-center">
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </a>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Sẵn sàng thu thập dữ liệu</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CrawlerResultTable;