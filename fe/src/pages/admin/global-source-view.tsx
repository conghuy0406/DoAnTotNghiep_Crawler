import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { Database, Search, Trash2, Loader2, ShieldAlert, Globe, Code2, Zap, Fingerprint, Layout, Users } from 'lucide-react';

const GlobalSourceView: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 

  const fetchGlobalSources = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Admin gọi API sẽ lấy toàn bộ Source của hệ thống
      const res = await axios.get('/api/v1/sources/', { headers: { Authorization: `Bearer ${token}` } });
      setSources(res.data);
    } catch (error: any) {
      alert("Lỗi tải danh sách: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGlobalSources(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`🚨 QUYỀN QUẢN TRỊ: Bạn có chắc muốn XÓA VĨNH VIỄN Template "${name}" khỏi Server không?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/sources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchGlobalSources(); 
    } catch (error: any) {
      alert("Lỗi xóa: " + (error.response?.data?.detail || "Không thể xóa."));
    }
  };

  const filteredSources = sources.filter(src => {
    const matchesSearch = src.name?.toLowerCase().includes(searchTerm.toLowerCase()) || src.search_url_template?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'GLOBAL') return matchesSearch && src.is_global;
    if (filterType === 'USER') return matchesSearch && !src.is_global;
    return matchesSearch;
  });

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'HTML': return <Code2 size={16} className="text-emerald-500" />;
      case 'SELENIUM': return <Layout size={16} className="text-blue-500" />;
      case 'API': return <Zap size={16} className="text-indigo-500" />;
      case 'REGEX': return <Fingerprint size={16} className="text-amber-500" />;
      default: return <Globe size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Kho Mẫu Chung" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          <div className="max-w-7xl mx-auto mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 shadow-md rounded-2xl flex items-center justify-center text-white bg-blue-600">
                <Database size={32} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Global Templates</h1>
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Quản lý mẫu toàn máy chủ</p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm tên Template hoặc URL..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-400 transition-all"/>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => setFilterType('ALL')} className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Tất cả</button>
                <button onClick={() => setFilterType('GLOBAL')} className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filterType === 'GLOBAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>🌟 Mẫu Hệ Thống</button>
                <button onClick={() => setFilterType('USER')} className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filterType === 'USER' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>👤 Mẫu của Users</button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40"><Loader2 size={40} className="text-blue-500 animate-spin mb-4" /></div>
            ) : filteredSources.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-[32px] py-32 flex flex-col items-center justify-center text-center shadow-sm">
                <Database size={64} className="text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-700 mb-2">Trống</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSources.map((src) => (
                  <div key={src._id} className="bg-white rounded-[24px] border border-slate-100 p-6 flex flex-col shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">{getMethodIcon(src.crawl_method)}</div>
                        <div>
                          {src.is_global ? (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-100 mb-1"><ShieldAlert size={10}/> Mẫu Dùng Chung</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-100 mb-1"><Users size={10}/> Mẫu của User</span>
                          )}
                          <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors" title={src.name}>{src.name}</h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100 flex-1">
                      <p className="text-[11px] font-mono text-slate-500 break-all line-clamp-2 mb-2">{src.search_url_template}</p>
                      
                      {/* HIỂN THỊ ID CỦA USER ĐÃ TẠO MẪU NÀY */}
                      {!src.is_global && src.user_id && (
                        <div className="pt-2 border-t border-slate-200 mt-2">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Author ID:</span>
                           <code className="text-[10px] font-mono text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">{src.user_id}</code>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto border-t border-slate-50 pt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{src.crawl_method || "UNKNOWN"}</span>
                      
                      {/* QUYỀN LỰC CỦA ADMIN: XÓA MỌI THỨ */}
                      <button onClick={() => handleDelete(src._id, src.name)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm" title="Xóa Template này khỏi hệ thống"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalSourceView;