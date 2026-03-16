import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import CrawlerResultTable from './crawler-result-table';
import { ExtractResponse } from './types';

const CrawlerContentView: React.FC = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractResponse | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setData(null); 
    try {
      const response = await fetch('http://localhost:8000/api/v1/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });
      const result = await response.json();
      if (result.message === "Đọc bài viết thành công!" && result.data) {
        setData(result.data); 
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* SỬA: Cấu trúc flex h-screen và overflow-hidden để cố định khung hình */
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
      
      {/* 1. SIDEBAR CỐ ĐỊNH (FIXED) */}
      <Sidebar activePage="Crawler Nội Dung" />

      {/* 2. MAIN AREA: Đẩy lề ml-20 (mobile) và md:ml-64 (desktop) */}
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        
        {/* Decor background bóng mờ (Optional) */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
        
        {/* NỘI DUNG CÓ THỂ CUỘN */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            
            {/* Title Header */}
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="w-12 h-12 bg-white border border-indigo-100 rounded-2xl flex items-center justify-center shadow-sm shadow-indigo-100/50">
                 <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                 </svg>
              </div>
              <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">
                  Reader <span className="text-indigo-600">Extract</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">
                  AI-Powered Content Analysis
                </p>
              </div>
            </div>

            {/* Search Bar Container */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-3 items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex-1 w-full flex items-center px-5 bg-slate-50/50 rounded-2xl border border-transparent focus-within:border-indigo-100 focus-within:bg-white focus-within:shadow-inner transition-all duration-300">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                <input 
                  type="text"
                  placeholder="Dán link bài báo vào đây để AI đọc giúp bạn..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent border-none px-4 py-5 text-sm focus:ring-0 text-slate-700 font-bold placeholder:text-slate-300 placeholder:font-medium"
                />
              </div>
              <button 
                onClick={handleExtract}
                disabled={loading || !url}
                className="w-full md:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Đọc bài viết</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Bảng kết quả/Nội dung chi tiết */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <CrawlerResultTable data={data} loading={loading} />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CrawlerContentView;