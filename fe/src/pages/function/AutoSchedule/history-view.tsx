import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  History, Search, ExternalLink, Calendar, 
  ChevronDown, ChevronUp, Database, FileText 
} from 'lucide-react';

const HistoryView: React.FC = () => {
  const [histories, setHistories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // TẢI LỊCH SỬ (Đã gắn bảo mật Token)
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/schedules/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistories(res.data || []);
      } catch (error) {
        console.error("Lỗi tải lịch sử:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Lịch Sử Crawler" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-blue-100 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <History size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Data History</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Database size={14} className="text-blue-500" /> Kho lưu trữ dữ liệu tự động
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm overflow-hidden min-h-[500px]">
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40 text-blue-500">
                  <span className="animate-ping w-8 h-8 rounded-full bg-blue-400 opacity-75 mb-4"></span>
                  <span className="text-xs font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
                </div>
              ) : histories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-slate-300">
                  <FileText size={48} className="opacity-20 mb-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em]">Chưa có dữ liệu cào tự động</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {histories.map((item, index) => (
                    <div key={item.task_id || index} className="transition-all hover:bg-slate-50/50">
                      
                      {/* DÒNG TIÊU ĐỀ LỊCH SỬ */}
                      <div 
                        onClick={() => toggleExpand(item.task_id || index.toString())}
                        className="p-6 cursor-pointer flex items-center gap-6 group"
                      >
                        <div className="flex-none w-16 h-16 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                          <span className="text-2xl font-black leading-none">{item.total_found}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-80">Kết quả</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 text-[18px] group-hover:text-blue-600 transition-colors truncate">
                            {item.keyword}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {item.time_completed}</span>
                            <span className="flex items-center gap-1.5 text-emerald-500"><Search size={14} /> Smart Auto</span>
                          </div>
                        </div>

                        <div className="flex-none text-slate-300 group-hover:text-blue-500 transition-colors">
                          {expandedId === (item.task_id || index.toString()) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </div>
                      </div>

                      {/* CHI TIẾT BÀI VIẾT (MỞ RỘNG) */}
                      {expandedId === (item.task_id || index.toString()) && (
                        <div className="bg-slate-50 p-6 border-t border-slate-100">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Danh sách dữ liệu bóc tách được</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.data && item.data.length > 0 ? item.data.map((d: any, idx: number) => (
                              <a 
                                key={idx} href={d.url} target="_blank" rel="noreferrer"
                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex gap-3 items-start group"
                              >
                                <div className="flex-none mt-1 text-slate-300 group-hover:text-blue-500">
                                  <ExternalLink size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-700 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {d.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate mt-2 italic">{d.url}</p>
                                </div>
                              </a>
                            )) : (
                              <p className="text-sm text-slate-400 italic">Không tìm thấy bài viết nào.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default HistoryView;