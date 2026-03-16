import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const FavoritesListView: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/v1/bookmarks/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Lấy mảng data từ object trả về của Backend
        setBookmarks(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách yêu thích:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  return (
    <div className="flex h-screen bg-[#FDFDFF] overflow-hidden">
      <Sidebar activePage="Favorites" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        {/* Background Blur Decor */}
        <div className="absolute top-[-5%] right-[-5%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 -z-10"></div>
        
        <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">
                  Bản ghi <span className="text-red-500">Yêu thích</span>
                </h1>
              </div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.4em] ml-14">
                Saved Knowledge Hub • {bookmarks.length} bản ghi
              </p>
            </div>

            {/* List Section */}
            <div className="grid gap-4">
              {loading ? (
                // Skeleton Loading
                [1, 2, 3].map((n) => (
                  <div key={n} className="h-24 bg-slate-100 animate-pulse rounded-3xl"></div>
                ))
              ) : bookmarks.length > 0 ? (
                bookmarks.map((item) => (
                  <div 
                    key={item._id} 
                    onClick={() => navigate(`/favorites/${item._id}`)}
                    className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 cursor-pointer transition-all duration-300 flex justify-between items-center"
                  >
                    <div className="space-y-2 flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black uppercase rounded-md border border-indigo-100">
                          {item.source_name || "Nguồn tin"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                          Chủ đề: {item.category || "General"}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm md:text-base">
                        {item.title || item.keyword}
                      </h3>
                      <p className="text-[10px] text-slate-300 font-mono truncate max-w-sm">
                        {item.url}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-[9px] font-black text-slate-300 uppercase">Ngày lưu</p>
                            <p className="text-[10px] font-bold text-slate-500">
                                {item.bookmarked_at ? new Date(item.bookmarked_at).toLocaleDateString('vi-VN') : '---'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <span className="text-slate-300 group-hover:text-red-500 font-black transition-colors">→</span>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 text-sm font-bold uppercase italic tracking-widest">
                    Hào chưa có bản ghi nào ở đây hết
                  </p>
                  <button 
                    onClick={() => navigate('/crawler-data')}
                    className="mt-4 text-[10px] font-black uppercase text-indigo-500 hover:underline"
                  >
                    Quay lại cào dữ liệu ngay →
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FavoritesListView;