import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar'; // Nhớ check lại đường dẫn import Sidebar cho đúng nhé
import { Database, Trash2, Power, RefreshCw, Globe, Link2, Code } from 'lucide-react';

interface SourceConfig {
  _id: string;
  name: string;
  base_url: string;
  search_url_template: string;
  crawl_method: string;
  is_active: boolean;
}

const SourceManagerView: React.FC = () => {
  const [sources, setSources] = useState<SourceConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 1. LẤY DANH SÁCH NGUỒN (Gắn Token, Xóa localhost)
  // ==========================================
  const fetchSources = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/sources/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSources(res.data);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách:', error);
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // ==========================================
  // 2. ĐỔI TRẠNG THÁI BẬT/TẮT (Gắn Token, Xóa localhost)
  // ==========================================
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/v1/sources/${id}`, {
        is_active: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Tải lại danh sách sau khi cập nhật thành công
      fetchSources();
    } catch (error) {
      alert('❌ Lỗi khi cập nhật trạng thái! Vui lòng thử lại.');
    }
  };

  // ==========================================
  // 3. XÓA NGUỒN (Gắn Token, Xóa localhost)
  // ==========================================
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn xóa cấu hình nguồn "${name}"? Hành động này không thể hoàn tác!`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/sources/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cập nhật giao diện mượt mà (Xóa item khỏi state trực tiếp hoặc tải lại danh sách)
      fetchSources();
    } catch (error) {
      alert('❌ Lỗi khi xóa nguồn! Có thể nguồn này không tồn tại hoặc bạn không có quyền xóa.');
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Quản Lý Nguồn" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-7xl mx-auto mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Database size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Quản Lý Nguồn</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Trung tâm điều phối dữ liệu
                </p>
              </div>
            </div>
            <button 
              onClick={fetchSources} 
              className="px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              TẢI LẠI
            </button>
          </div>

          {/* BẢNG DỮ LIỆU */}
          <div className="max-w-7xl mx-auto bg-white rounded-[30px] shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-24 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Đang tải cấu hình nguồn...</span>
              </div>
            ) : sources.length === 0 ? (
              <div className="p-24 text-center flex flex-col items-center justify-center text-slate-300">
                <Database size={48} className="opacity-20 mb-4" />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bạn chưa lưu cấu hình nguồn nào</span>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                      <th className="p-6">Tên Nguồn</th>
                      <th className="p-6">Tên Miền</th>
                      <th className="p-6 text-center">Phương Pháp</th>
                      <th className="p-6 text-center">Trạng Thái</th>
                      <th className="p-6 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sources.map((src) => (
                      <tr key={src._id} className="hover:bg-slate-50/50 transition-colors group">
                        
                        {/* Tên nguồn */}
                        <td className="p-6">
                          <p className="font-bold text-slate-800 text-[15px] uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                            {src.name}
                          </p>
                        </td>
                        
                        {/* Domain */}
                        <td className="p-6">
                          <a 
                            href={src.base_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-bold transition-all"
                          >
                            <Globe size={14} /> {src.base_url.replace('https://', '').replace('http://', '')}
                          </a>
                        </td>
                        
                        {/* Crawl Method */}
                        <td className="p-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border inline-flex items-center gap-1.5
                            ${src.crawl_method === 'SELENIUM' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                              src.crawl_method === 'API' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                              src.crawl_method === 'REGEX' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                              src.crawl_method === 'SMART_AUTO' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                              'bg-purple-50 text-purple-600 border-purple-200'}`}
                          >
                            <Code size={12} /> {src.crawl_method}
                          </span>
                        </td>
                        
                        {/* Status (Toggle) */}
                        <td className="p-6 text-center">
                          <button 
                            onClick={() => handleToggleActive(src._id, src.is_active)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all inline-flex items-center gap-2 active:scale-95 shadow-sm border
                              ${src.is_active 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500' 
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                            title={src.is_active ? "Tạm ngưng nguồn này" : "Bật nguồn này"}
                          >
                            <Power size={14} /> {src.is_active ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                          </button>
                        </td>
                        
                        {/* Action */}
                        <td className="p-6 text-right">
                          <div className="flex justify-end">
                            <button 
                              onClick={() => handleDelete(src._id, src.name)}
                              className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-90 border border-red-100 shadow-sm"
                              title="Xóa cấu hình nguồn"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default SourceManagerView;