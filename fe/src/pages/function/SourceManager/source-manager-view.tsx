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

  // Lấy danh sách nguồn từ Backend
  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/v1/sources/');
      setSources(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Đổi trạng thái Bật/Tắt
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:8000/api/v1/sources/${id}`, {
        is_active: !currentStatus
      });
      fetchSources();
    } catch (error) {
      alert('❌ Lỗi khi cập nhật trạng thái!');
    }
  };

  // Xóa nguồn
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ Xóa nguồn cào "${name}"? Hành động này không thể hoàn tác!`)) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/sources/${id}`);
      fetchSources();
    } catch (error) {
      alert('❌ Lỗi khi xóa nguồn!');
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600">
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
              className="px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              TẢI LẠI
            </button>
          </div>

          {/* BẢNG DỮ LIỆU */}
          <div className="max-w-7xl mx-auto bg-white rounded-[30px] shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-20 text-center text-slate-400 font-bold">ĐANG TẢI DỮ LIỆU...</div>
            ) : sources.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold">CHƯA CÓ NGUỒN NÀO ĐƯỢC LƯU.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                      <th className="p-5">Tên Nguồn</th>
                      <th className="p-5">Tên Miền</th>
                      <th className="p-5 text-center">Phương Pháp</th>
                      <th className="p-5 text-center">Trạng Thái</th>
                      <th className="p-5 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sources.map((src) => (
                      <tr key={src._id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Tên nguồn */}
                        <td className="p-5">
                          <p className="font-bold text-slate-700">{src.name}</p>
                        </td>
                        
                        {/* Domain */}
                        <td className="p-5">
                          <a href={src.base_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm font-medium">
                            <Globe size={16} /> {src.base_url.replace('https://', '')}
                          </a>
                        </td>
                        
                        {/* Crawl Method */}
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border
                            ${src.crawl_method === 'SELENIUM' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                              src.crawl_method === 'API' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                              src.crawl_method === 'REGEX' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                              'bg-purple-50 text-purple-600 border-purple-200'}`}
                          >
                            <Code size={12} className="inline mr-1" /> {src.crawl_method}
                          </span>
                        </td>
                        
                        {/* Status (Toggle) */}
                        <td className="p-5 text-center">
                          <button 
                            onClick={() => handleToggleActive(src._id, src.is_active)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 mx-auto
                              ${src.is_active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                          >
                            <Power size={14} /> {src.is_active ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                          </button>
                        </td>
                        
                        {/* Action */}
                        <td className="p-5 text-right">
                          <button 
                            onClick={() => handleDelete(src._id, src.name)}
                            className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                            title="Xóa nguồn này"
                          >
                            <Trash2 size={18} />
                          </button>
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