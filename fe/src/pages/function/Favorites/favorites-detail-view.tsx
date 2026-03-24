import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const FavoritesListView: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/v1/bookmarks/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(res.data.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách yêu thích:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Hàm bỏ ghim nhanh (để thống nhất logic toggle)
  const handleRemoveBookmark = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Ngăn việc bị navigate vào trang chi tiết
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/v1/bookmarks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Xóa khỏi UI ngay lập tức
      setBookmarks(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Lỗi khi xóa bookmark:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
      <Sidebar activePage="Favorites" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8 pb-20">
            
            {/* Header Section - Thống nhất với Crawler History */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">
                  Saved <span className="text-red-500">Favorites</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                  Kho lưu trữ các bản phân tích quan trọng
                </p>
              </div>

              <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase mr-2">Số lượng:</span>
                 <span className="text-lg font-black text-red-500">{bookmarks.length}</span>
              </div>
            </div>

            {/* Table Section - Thống nhất giao diện Bảng */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung đã lưu</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nguồn / Chủ đề</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="px-8 py-24 text-center"><div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></td></tr>
                  ) : bookmarks.length > 0 ? (
                    bookmarks.map((item) => (
                      <tr 
                        key={item._id} 
                        onClick={() => navigate(`/favorites/${item._id}`)}
                        className="hover:bg-red-50/20 transition-all group cursor-pointer"
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 uppercase tracking-tight text-sm group-hover:text-red-500 transition-colors italic line-clamp-1">
                              {item.title || item.keyword}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                              Lưu lúc: {item.bookmarked_at ? new Date(item.bookmarked_at).toLocaleString('vi-VN') : '---'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-indigo-500 uppercase italic">
                              #{item.source_name || "Nguồn tin"}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Lĩnh vực: {item.category || "Chung"}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* Nút Bỏ Ghim Nhanh */}
                            <button 
                              onClick={(e) => handleRemoveBookmark(e, item._id)}
                              className="p-2.5 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Xóa khỏi yêu thích"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001z" />
                              </svg>
                            </button>

                            <button 
                              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-md"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-32 text-center">
                        <p className="text-slate-400 text-sm font-bold uppercase italic tracking-widest">
                          Hào chưa có bản ghi nào ở đây hết
                        </p>
                        <button 
                          onClick={() => navigate('/history')}
                          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                        >
                          Ghim dữ liệu ngay →
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FavoritesListView;