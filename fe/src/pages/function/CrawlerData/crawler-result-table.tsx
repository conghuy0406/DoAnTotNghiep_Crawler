import React from 'react';
import { CrawlerResult } from './types';
import { Bot, ExternalLink, FileText, Search } from 'lucide-react';

interface CrawlerResultTableProps {
  articles: CrawlerResult[];
  analysis?: any;
}

const CrawlerResultTable: React.FC<CrawlerResultTableProps> = ({ articles, analysis }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 flex flex-col h-full">
      
      {/* 🌟 THẺ TÓM TẮT CỦA AI (AI ANALYSIS) 🌟 */}
      {analysis?.summary && (
        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
          {/* Decors */}
          <div className="absolute -right-4 -top-4 opacity-5 text-indigo-900">
            <Bot size={180} />
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
          
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3">
               <div className="bg-indigo-100 text-indigo-700 flex items-center justify-center w-10 h-10 rounded-xl shadow-inner">
                  <Bot size={20} />
               </div>
               <div>
                  <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Báo cáo từ AI</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Chủ đề: <span className="text-indigo-500">{analysis.category || 'Tổng hợp'}</span>
                  </span>
               </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <p className="text-slate-600 text-sm leading-relaxed font-medium italic">"{analysis.summary}"</p>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 DANH SÁCH BÀI VIẾT (DẠNG CARD LIST) 🌟 */}
      <div className="flex justify-between items-center px-4">
        <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
          Nguồn dữ liệu thô <span className="bg-indigo-100 text-indigo-600 px-3 py-0.5 rounded-full text-[10px]">{articles?.length || 0}</span>
        </h2>
      </div>

      <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px]">
        {(!articles || articles.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-32 bg-slate-50/50">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
              <Search size={32} className="text-indigo-500/30" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center leading-relaxed">
              Hệ thống đang chờ lệnh...<br/>Nhập từ khóa và bấm bắt đầu
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar p-6 space-y-4">
            {articles.map((item, i) => (
              <div key={item._id || i} className="p-5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-2xl transition-all group flex gap-5 items-start cursor-pointer">
                 
                 {/* Số thứ tự */}
                 <div className="flex-none w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm border border-slate-100">
                   {(i+1).toString().padStart(2, '0')}
                 </div>

                 {/* Nội dung */}
                 <div className="flex-1 min-w-0 pt-0.5">
                    <div className="mb-2">
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-200">
                        {item.source || 'Tin tức'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-[14px] leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors overflow-hidden mt-2">
                      <span className="text-[11px] font-medium truncate italic hover:underline cursor-pointer">
                        {item.url}
                      </span>
                    </div>
                 </div>

                 {/* Nút xem chi tiết */}
                 <a 
                    href={item.url} target="_blank" rel="noreferrer"
                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 hover:bg-indigo-500 hover:text-white transition-all shadow-sm border border-slate-100 shrink-0"
                    title="Xem bài viết gốc"
                 >
                    <ExternalLink size={16} />
                 </a>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CrawlerResultTable;