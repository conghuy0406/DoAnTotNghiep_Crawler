import React, { useState, useEffect } from 'react';
import axiosClient from "../../api/axiosClient";
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { History, Search, Loader2, CheckCircle2, XCircle, Clock, Globe, Code2, Zap, Fingerprint, ShieldAlert, User } from 'lucide-react';

const GlobalHistoryView: React.FC = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });

  const fetchGlobalHistory = async (page: number = 1, keyword: string = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // 🌟 ĐIỂM KHÁC BIỆT: Gọi API với tham số scope='all'
      const res = await axiosClient.get('/api/v1/history/', {
        params: { page, limit: 20, keyword, scope: 'all' },
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryData(res.data?.items || res.data?.data || []);
      setPagination({ total: res.data?.total || 0, page: res.data?.page || 1, limit: res.data?.limit || 20 });
    } catch (error) {
      console.error("Lỗi lấy lịch sử toàn cục:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGlobalHistory(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchGlobalHistory(1, searchTerm); };

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'HTML': return <Code2 size={16} className="text-emerald-500" />;
      case 'SELENIUM': return <Globe size={16} className="text-blue-500" />;
      case 'API': return <Zap size={16} className="text-indigo-500" />;
      case 'REGEX': return <Fingerprint size={16} className="text-amber-500" />;
      default: return <Globe size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Lịch sử Toàn Server" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          <div className="max-w-7xl mx-auto mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 shadow-md rounded-2xl flex items-center justify-center text-white bg-rose-600">
                <ShieldAlert size={32} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Global Server Logs</h1>
                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> Giám sát toàn bộ hệ thống</p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm URL, người dùng..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-rose-400 transition-all"/>
              </form>
              <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                <span className="text-[11px] font-black text-rose-700 uppercase tracking-widest">Tổng log lưu trữ: {pagination.total}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="p-6">Thời gian</th>
                    <th className="p-6">Mục tiêu</th>
                    <th className="p-6 text-rose-500"><User size={14} className="inline mr-1 -mt-0.5"/>Người chạy (User ID)</th>
                    <th className="p-6">Trạng thái</th>
                    <th className="p-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center"><Loader2 size={32} className="text-rose-500 animate-spin mx-auto"/></td></tr>
                  ) : historyData.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-medium">Hệ thống chưa có lịch sử nào.</td></tr>
                  ) : (
                    historyData.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 whitespace-nowrap"><div className="flex items-center gap-2 text-[12px] font-bold text-slate-600"><Clock size={14} className="text-slate-400" />{new Date(log.created_at).toLocaleString('vi-VN')}</div></td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">{getMethodIcon(log.method)}</div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-[13px] line-clamp-1 max-w-[200px]">{log.target_url || log.keyword || "N/A"}</h3>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Method: {log.method || "AUTO"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                           <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-mono border border-slate-200">{log.user_id || "Unknown"}</code>
                        </td>
                        <td className="p-6">
                          {log.status === 'success' ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-full text-[9px] font-black uppercase"><CheckCircle2 size={12}/> SUCCESS</span> : <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded-full text-[9px] font-black uppercase"><XCircle size={12}/> FAILED</span>}
                        </td>
                        <td className="p-6 text-right">
                          <button onClick={() => navigate(`/history/${log._id}`)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95">Soi chi tiết</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang {pagination.page}</p>
                <div className="flex gap-2">
                  <button disabled={pagination.page <= 1} onClick={() => fetchGlobalHistory(pagination.page - 1, searchTerm)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30">Trước</button>
                  <button disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => fetchGlobalHistory(pagination.page + 1, searchTerm)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30">Sau</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalHistoryView;