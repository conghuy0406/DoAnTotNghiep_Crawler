import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';

const HistoryDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        // ✅ Dùng đường dẫn tương đối
        const response = await axios.get(`/api/v1/history/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setData(response.data);
        
        // Kiểm tra trạng thái bookmark từ DB
        if (response.data?.is_bookmarked) {
          setIsBookmarked(true);
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  // ✅ HÀM TOGGLE BOOKMARK THÔNG MINH (Cho phép Bật/Tắt)
  const handleToggleBookmark = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `/api/v1/bookmarks/${id}`;
      const headers = { Authorization: `Bearer ${token}` };

      if (isBookmarked) {
        // Hủy lưu (DELETE)
        await axios.delete(url, { headers });
        setIsBookmarked(false);
        alert("Đã xóa báo cáo khỏi mục yêu thích!");
      } else {
        // Thêm lưu (POST)
        await axios.post(url, {}, { headers });
        setIsBookmarked(true);
        alert("Đã thêm báo cáo này vào mục yêu thích!");
      }
    } catch (error) {
      console.error("Lỗi Bookmark:", error);
      alert("Không thể thực hiện thao tác này. Vui lòng kiểm tra lại đăng nhập!");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F8F9FF]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // --- MAPPING DỮ LIỆU ---
  const aiSummary = data?.summary || data?.ai_summary || "Không có tóm tắt.";
  const articlesList = data?.articles || data?.data_sources || [];
  const structuredData = data?.structured_data || [];
  const highlights = data?.key_highlights || [];
  const excluded = data?.excluded_topics || [];
  const sentiment = data?.sentiment || "Trung lập";

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden font-sans">
      <Sidebar activePage="Lịch Sử Crawler" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            
            {/* TOP BAR: Quay lại & Bookmark */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                Trở về danh sách
              </button>

              {/* NÚT YÊU THÍCH THÔNG MINH */}
              <button 
                onClick={handleToggleBookmark}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all shadow-sm border active:scale-95 ${
                  isBookmarked 
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200'
                }`}
              >
                <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {isBookmarked ? "Bỏ Lưu" : "Lưu Yêu Thích"}
              </button>
            </div>

            {/* HEADER BLOCK */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${
                    sentiment === 'Tích cực' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    sentiment === 'Tiêu cực' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                    'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {sentiment}
                  </span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {data?.category || 'General'}
                  </span>
                </div>
                <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">
                  Từ khóa: <span className="text-indigo-600">{data?.keyword || "N/A"}</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Thực hiện lúc: {data?.created_at ? new Date(data.created_at).toLocaleString('vi-VN') : 'N/A'}
                </p>
              </div>
            </div>

            {/* STRUCTURED DATA GRID */}
            {structuredData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {structuredData.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                    <p className="text-lg font-black text-indigo-600 leading-tight">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* HIGHLIGHTS & EXCLUSIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-6 opacity-80">Key Highlights</h3>
                <ul className="space-y-4">
                  {highlights.length > 0 ? highlights.map((point: string, idx: number) => (
                    <li key={idx} className="flex gap-4 text-sm font-semibold leading-relaxed">
                      <span className="text-indigo-300">#0{idx + 1}</span>
                      {point}
                    </li>
                  )) : <li className="italic opacity-50">Không có dữ liệu tiêu điểm.</li>}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Lọc nhiễu AI</h3>
                <div className="flex flex-wrap gap-2">
                  {excluded.length > 0 ? excluded.map((topic: string, idx: number) => (
                    <span key={idx} className="px-3 py-2 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-bold border border-slate-100">
                      ✕ {topic}
                    </span>
                  )) : <p className="text-slate-300 italic text-[10px]">Không có chủ đề bị loại bỏ.</p>}
                </div>
              </div>
            </div>

            {/* AI SUMMARY BOX */}
            <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500 rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tight">AI Summary Analysis</h2>
                </div>
                <p className="text-slate-300 leading-relaxed font-medium text-lg italic border-l-4 border-indigo-500 pl-6 whitespace-pre-line">
                  {aiSummary}
                </p>
              </div>
            </div>

            {/* SOURCES LIST */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Nguồn tin tham khảo ({articlesList.length})</h3>
                <div className="h-px flex-1 bg-slate-100 mx-6"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {articlesList.length > 0 ? articlesList.map((article: any, index: number) => (
                  <div key={index} className="bg-white p-6 rounded-[30px] border border-slate-100 hover:border-indigo-200 transition-all group shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black text-indigo-500 uppercase">#{index + 1}</span>
                          <span className="text-[9px] font-bold text-slate-300 uppercase italic">| {article.source || "Web Search"}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                          {article.title}
                        </h4>
                      </div>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shrink-0"
                      >
                        Đọc bài gốc
                      </a>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Không tìm thấy danh sách bài báo.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default HistoryDetailView;