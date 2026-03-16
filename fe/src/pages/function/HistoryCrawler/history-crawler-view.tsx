import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Thêm dòng này
import Sidebar from '../../../components/Sidebar';

const HistoryCrawlerView: React.FC = () => {
  const navigate = useNavigate(); // Khởi tạo navigate
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });

  const fetchHistory = async (page: number = 1, keyword: string = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/v1/history/`, {
        params: { page, limit: 10, keyword },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHistoryData(response.data.data);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit
      });
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(1, searchTerm);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
      <Sidebar activePage="Lịch Sử Crawler" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">
                  Crawler <span className="text-indigo-600">History</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">
                  Danh sách nhật ký phân tích dữ liệu
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex items-center bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="Tìm từ khóa..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 placeholder:text-slate-300"
                />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all active:scale-90">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </button>
              </form>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Từ khóa phân tích</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian thực hiện</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="px-8 py-20 text-center"><div className="inline-block w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></td></tr>
                  ) : historyData.length === 0 ? (
                    <tr><td colSpan={3} className="px-8 py-16 text-center text-slate-400 italic">Chưa có lịch sử cào dữ liệu.</td></tr>
                  ) : (
                    historyData.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                          <span className="font-black text-slate-700 uppercase tracking-tighter text-sm group-hover:text-indigo-600 transition-colors">
                            {item.keyword}
                          </span>
                        </td>
                        
                        <td className="px-10 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                              {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {new Date(item.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-10 py-6 text-right">
                          <button 
                            // GẮN SỰ KIỆN CHUYỂN TRANG TẠI ĐÂY
                            onClick={() => navigate(`/history/${item._id}`)}
                            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center ml-auto group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-100 transition-all duration-300"
                            title="Xem chi tiết"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Pagination (Giữ nguyên như code cũ của Hào) */}
              <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Total: <span className="text-slate-800">{pagination.total}</span>
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={pagination.page === 1}
                    onClick={() => fetchHistory(pagination.page - 1, searchTerm)}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                  >
                    Trước
                  </button>
                  <button 
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    onClick={() => fetchHistory(pagination.page + 1, searchTerm)}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                  >
                    Sau
                  </button>
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