import React, { useState, useEffect } from 'react';
import axiosClient from "../../../api/axiosClient";
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { History, Search, Loader2, CheckCircle2, XCircle, Clock, Globe, Code2, Zap, Fingerprint } from 'lucide-react';

const HistoryCrawlerView: React.FC = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });

  const fetchHistory = async (page: number = 1, keyword: string = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // 🌟 Mặc định gọi scope=me (chỉ lấy của mình)
      const res = await axiosClient.get('/api/v1/history/', {
        params: { page, limit: 10, keyword, scope: 'me' },
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryData(res.data?.items || res.data?.data || []);
      setPagination({ total: res.data?.total || 0, page: res.data?.page || 1, limit: res.data?.limit || 10 });
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchHistory(1, searchTerm); };

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'HTML': return <Code2 size={16} className="text-emerald-500" />;
      case 'BROWSER': case 'SELENIUM': return <Globe size={16} className="text-blue-500" />;
      case 'API': return <Zap size={16} className="text-indigo-500" />;
      case 'REGEX': return <Fingerprint size={16} className="text-amber-500" />;
      default: return <Globe size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Lịch sử của tôi" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          <div className="max-w-6xl mx-auto mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 shadow-md rounded-2xl flex items-center justify-center text-white bg-[#1b4b82]">
                <History size={32} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Nhật ký của tôi</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Phiên bản cá nhân</p>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#1b4b82] transition-colors" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm URL..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-[#1b4b82] transition-all"/>
              </form>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="p-6">Thời gian</th>
                    <th className="p-6">Dữ liệu phân tích</th>
                    <th className="p-6">Trạng thái</th>
                    <th className="p-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 size={32} className="text-indigo-500 animate-spin mx-auto"/></td></tr>
                  ) : historyData.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-medium">Chưa có lịch sử nào.</td></tr>
                  ) : (
                    historyData.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 whitespace-nowrap"><div className="flex items-center gap-2 text-[12px] font-bold text-slate-600"><Clock size={14} className="text-slate-400" />{new Date(log.created_at).toLocaleString('vi-VN')}</div></td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">{getMethodIcon(log.method)}</div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-[13px] line-clamp-1 max-w-[300px]">{log.target_url || log.keyword || "Cào dữ liệu"}</h3>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Method: {log.method || "AUTO"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          {log.status === 'success' ? <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><CheckCircle2 size={12}/> THÀNH CÔNG</span> : <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><XCircle size={12}/> THẤT BẠI</span>}
                        </td>
                        <td className="p-6 text-right">
                          <button onClick={() => navigate(`/history/${log._id}`)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1b4b82] transition-all shadow-md active:scale-95">Xem chi tiết</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang {pagination.page}</p>
                <div className="flex gap-2">
                  <button disabled={pagination.page <= 1} onClick={() => fetchHistory(pagination.page - 1, searchTerm)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30">Trước</button>
                  <button disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => fetchHistory(pagination.page + 1, searchTerm)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30">Sau</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HistoryCrawlerView;