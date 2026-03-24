// import React from 'react';
// import { CrawlerResult } from './types'; // Nhớ import interface mới

// interface CrawlerResultTableProps {
//   articles: CrawlerResult[]; // Sử dụng interface đã sửa
//   analysis?: any;
// }

// const CrawlerResultTable: React.FC<CrawlerResultTableProps> = ({ articles, analysis }) => {
//   return (
//     <div className="space-y-8 animate-in fade-in duration-700">
//       {/* Thẻ AI Analysis */}
//       {analysis?.summary && (
//         <div className="bg-white p-10 rounded-[40px] border-l-[12px] border-indigo-600 shadow-sm relative overflow-hidden">
//           <div className="absolute -right-4 -top-4 text-slate-50 text-8xl font-black italic select-none">AI</div>
//           <div className="relative z-10 space-y-4">
//             <div className="flex items-center gap-3">
//                <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-tighter">AI Analysis</span>
//                <span className="text-[10px] font-bold text-slate-400 uppercase italic">Chủ đề: {analysis.category || 'Tổng hợp'}</span>
//             </div>
//             <p className="text-slate-600 text-sm leading-relaxed font-medium italic border-l-2 border-slate-100 pl-4">"{analysis.summary}"</p>
//           </div>
//         </div>
//       )}

//       {/* Bảng dữ liệu chi tiết */}
//       <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-50">
//         <table className="w-full text-left">
//           <thead className="bg-slate-50/50 border-b border-slate-100">
//             <tr>
//               <th className="p-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Nguồn</th>
//               <th className="p-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Thông tin bài viết</th>
//               <th className="p-8 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Chi tiết</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {articles && articles.length > 0 ? articles.map((item, idx) => (
//               <tr key={item._id || idx} className="hover:bg-indigo-50/30 transition-colors group">
//                 <td className="p-8">
//                   <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg uppercase border border-indigo-100">
//                     {/* BE trả về 'source' trong mảng structured_data */}
//                     {item.source || 'Tin tức'}
//                   </span>
//                 </td>
//                 <td className="p-8">
//                   <div className="max-w-md">
//                     <p className="text-sm font-black text-slate-700 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1 italic">
//                       {item.title}
//                     </p>
//                     {/* Hiển thị URL thay cho Link cũ */}
//                     <code className="text-[9px] text-slate-300 font-mono truncate block max-w-xs italic">
//                       {item.url}
//                     </code>
//                   </div>
//                 </td>
//                 <td className="p-8 text-center">
//                   <a 
//                     href={item.url} 
//                     target="_blank" 
//                     rel="noreferrer" 
//                     className="bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm"
//                   >
//                     Xem báo
//                   </a>
//                 </td>
//               </tr>
//             )) : (
//               <tr>
//                 <td colSpan={3} className="p-32 text-center opacity-20 text-[10px] font-black uppercase italic tracking-[0.5em] text-slate-400">
//                   Hệ thống đang chờ lệnh từ Hào...
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default CrawlerResultTable;

import React from 'react';
import { CrawlerResult } from './types';

interface CrawlerResultTableProps {
  articles: CrawlerResult[];
  analysis?: any;
}

const CrawlerResultTable: React.FC<CrawlerResultTableProps> = ({ articles, analysis }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {analysis?.summary && (
        <div className="bg-white p-10 rounded-[40px] border-l-[12px] border-indigo-600 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-slate-50 text-8xl font-black italic select-none">AI</div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
               <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-tighter">AI Analysis</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase italic">Chủ đề: {analysis.category || 'Tổng hợp'}</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed font-medium italic border-l-2 border-slate-100 pl-4">"{analysis.summary}"</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-50">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="p-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Nguồn</th>
              <th className="p-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Thông tin bài viết</th>
              <th className="p-8 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {articles && articles.length > 0 ? articles.map((item, idx) => (
              <tr key={item._id || idx} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="p-8">
                  <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg uppercase border border-indigo-100">
                    {item.source || 'Tin tức'}
                  </span>
                </td>
                <td className="p-8">
                  <div className="max-w-md">
                    <p className="text-sm font-black text-slate-700 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1 italic">
                      {item.title}
                    </p>
                    <code className="text-[9px] text-slate-300 font-mono truncate block max-w-xs italic">
                      {item.url}
                    </code>
                  </div>
                </td>
                <td className="p-8 text-center">
                  <a href={item.url} target="_blank" rel="noreferrer" className="bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm">
                    Xem báo
                  </a>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="p-32 text-center opacity-20 text-[10px] font-black uppercase italic tracking-[0.5em] text-slate-400">
                  Hệ thống đang chờ lệnh từ Hào...
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