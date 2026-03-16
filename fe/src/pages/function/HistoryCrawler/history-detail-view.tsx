import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';

const HistoryDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/api/v1/history/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Hào nhìn vào Console F12 để xem thực tế BE trả về key tên là gì nhé
        console.log("Dữ liệu thực tế từ BE:", response.data);
        setData(response.data);
      } catch (error) {
        console.error("Lỗi lấy chi tiết:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F8F9FF]">
       <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // --- PHẦN QUAN TRỌNG: TỰ ĐỘNG "MÒ" DỮ LIỆU ---
  // Hào không sửa BE thì FE phải tự tìm các tên biến phổ biến như summary, ai_summary, analysis...
  const aiSummary = 
    data?.ai_summary || 
    data?.analysis?.summary || 
    data?.summary || 
    data?.analysis_result ||
    "Không tìm thấy nội dung phân tích trong bản ghi này.";

  const articlesList = 
    data?.articles || 
    data?.analysis?.articles || 
    data?.data_sources || 
    [];

  const keyword = data?.keyword || "N/A";

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
      <Sidebar activePage="Lịch Sử Crawler" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            
            {/* Nút quay lại */}
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
              Trở về danh sách
            </button>

            {/* Header thông tin đợt cào */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {data?.sentiment || 'Đã phân tích'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">ID: {id}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">
                  Từ khóa: <span className="text-indigo-600">{keyword}</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Thực hiện lúc: {new Date(data?.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {/* BOX 1: HIỂN THỊ PHÂN TÍCH AI */}
            <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500 rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tight">AI Summary Archive</h2>
                </div>
                {/* Dùng whitespace-pre-line để giữ các dấu xuống dòng của AI */}
                <p className="text-slate-300 leading-relaxed font-medium text-lg italic border-l-4 border-indigo-500 pl-6 whitespace-pre-line">
                  {aiSummary}
                </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            </div>

            {/* BOX 2: DANH SÁCH BÀI BÁO (LINKS) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Danh sách nguồn ({articlesList.length})
                </h3>
                <div className="h-px flex-1 bg-slate-100 mx-6"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {articlesList.length > 0 ? articlesList.map((article: any, index: number) => (
                  <div key={index} className="bg-white p-6 rounded-[30px] border border-slate-100 hover:border-indigo-200 transition-all group shadow-sm hover:shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-indigo-500 uppercase">#{index + 1}</span>
                          <span className="text-[9px] font-bold text-slate-300 uppercase italic">Source: {article.source || "Unknown"}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-600">
                          {article.title}
                        </h4>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-1">{article.description || article.url}</p>
                      </div>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0"
                      >
                        Visit Link
                      </a>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      Dữ liệu bài báo không tồn tại trong bản ghi này.
                    </p>
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