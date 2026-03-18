import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const HistoryCrawlerView: React.FC = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });

  // Lấy danh sách lịch sử
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

  // Logic Toggle Bookmark: Thêm hoặc Xóa yêu thích
  const handleToggleBookmark = async (id: string, currentlyBookmarked: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:8000/api/v1/bookmarks/${id}`;
      const headers = { Authorization: `Bearer ${token}` };

      if (currentlyBookmarked) {
        // Gọi DELETE để bỏ ghim
        await axios.delete(url, { headers });
      } else {
        // Gọi POST để thêm vào yêu thích
        await axios.post(url, {}, { headers });
      }
      
      // Cập nhật state tại chỗ để icon thay đổi màu ngay lập tức
      setHistoryData(prev => prev.map(item => 
        item._id === id ? { ...item, is_bookmarked: !currentlyBookmarked } : item
      ));
      
    } catch (error) {
      console.error("Lỗi xử lý Bookmark:", error);
      alert("Không thể thực hiện thao tác này.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(1, searchTerm);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
      <Sidebar activePage="Lịch Sử Crawler" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8 pb-20">
            
            {/* Header & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">
                  Crawler <span className="text-indigo-600">History</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                  Quản lý nhật ký phân tích dữ liệu
                </p>
              </div>

              <form onSubmit={handleSearch} className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-full md:w-96 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm từ khóa..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0"
                />
                <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
              </form>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung phân tích</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cảm xúc AI</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="px-8 py-24 text-center"><div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></td></tr>
                  ) : historyData.map((item) => (
                    <tr key={item._id} className="hover:bg-indigo-50/20 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 uppercase tracking-tight text-sm group-hover:text-indigo-600 transition-colors italic">
                            {item.keyword}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                            {new Date(item.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                          item.sentiment === 'Tích cực' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          item.sentiment === 'Tiêu cực' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {item.sentiment || 'Đã phân tích'}
                        </span>
                      </td>
                      
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {/* NÚT TOGGLE BOOKMARK (POST/DELETE) */}
                          <button 
                            onClick={() => handleToggleBookmark(item._id, item.is_bookmarked)}
                            className={`p-2.5 rounded-xl border transition-all duration-300 ${
                              item.is_bookmarked 
                              ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100 scale-105' 
                              : 'bg-white text-slate-200 border-slate-100 hover:text-amber-500 hover:border-amber-200'
                            }`}
                            title={item.is_bookmarked ? "Bỏ ghim" : "Ghim yêu thích"}
                          >
                            <svg className="w-4 h-4" fill={item.is_bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>

                          <button 
                            onClick={() => navigate(`/history/${item._id}`)}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Trang {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={pagination.page === 1} 
                    onClick={() => fetchHistory(pagination.page - 1, searchTerm)}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 disabled:opacity-30 transition-all"
                  >
                    Trước
                  </button>
                  <button 
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    onClick={() => fetchHistory(pagination.page + 1, searchTerm)}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 disabled:opacity-30 transition-all"
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