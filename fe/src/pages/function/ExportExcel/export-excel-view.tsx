import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const FavoritesListView: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  // Hàm xuất Excel cho các mục đã bookmark
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/v1/export/excel', {
        params: { only_bookmarked: true }, // Chỉ xuất những bài đã bookmark
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Quan trọng để tải file
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Favorites_Export_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Lỗi xuất file:", err);
      alert("Không thể xuất file Excel lúc này.");
    } finally {
      setExporting(false);
    }
  };

  const handleRemoveBookmark = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      // Gọi DELETE để xóa ghim
      await axios.delete(`http://localhost:8000/api/v1/bookmarks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">
                  Saved <span className="text-red-500">Favorites</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                  {bookmarks.length} bản ghi đã được ghim quan trọng
                </p>
              </div>

              <div className="flex gap-3">
                {/* Nút Xuất Excel đồng bộ với API */}
                <button 
                  onClick={handleExportExcel}
                  disabled={exporting || bookmarks.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {exporting ? "Đang xuất..." : "Xuất Excel"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </button>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Phân loại</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="px-8 py-24 text-center"><div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></td></tr>
                  ) : bookmarks.map((item) => (
                    <tr 
                      key={item._id} 
                      className="hover:bg-red-50/20 transition-all group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 uppercase tracking-tight text-sm italic line-clamp-1 group-hover:text-red-500 transition-colors">
                            {item.title || item.keyword}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300 mt-1 truncate max-w-xs uppercase">
                            {item.url || "Dữ liệu cục bộ"}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6 text-[10px] font-black">
                        <span className="text-indigo-500 italic">#{item.source_name || "Nguồn"}</span>
                        <div className="text-slate-400 text-[9px] uppercase mt-0.5">Lưu: {new Date(item.bookmarked_at).toLocaleDateString('vi-VN')}</div>
                      </td>
                      
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={(e) => handleRemoveBookmark(e, item._id)}
                            className="p-2.5 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001z" /></svg>
                          </button>
                          <button 
                            onClick={() => navigate(`/history/${item._id}`)}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-md"
                          >
                            Xem
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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