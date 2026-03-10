import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar'; 
import CrawlerResultTable from './crawler-result-table';
import { CrawlerSource } from './types';

const CrawlerDataView: React.FC = () => {
  const [sources, setSources] = useState<CrawlerSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(5); 
  const [loading, setLoading] = useState(false);
  const [crawlData, setCrawlData] = useState<any>(null);

  // Lấy danh sách nguồn báo khi component mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/v1/sources/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataSources = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setSources(dataSources);
        if (dataSources.length > 0) {
          setSelectedSourceId(dataSources[0]._id);
        }
      } catch (error) {
        console.error("Lỗi lấy nguồn:", error);
      }
    };
    fetchSources();
  }, []);

  const handleStartCrawl = async () => {
    if (!keyword.trim()) {
      alert("Hào nhập từ khóa trước khi crawl nhé!");
      return;
    }
    setLoading(true);
    setCrawlData(null); 

    try {
      const response = await axios.post('http://localhost:8000/api/v1/keyword', {
        target_sources: [selectedSourceId],
        keyword: keyword,
        limit: Math.min(limit, 5) 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Trích xuất dữ liệu từ cấu trúc JSON Backend trả về
      const dataFromApi = response.data.data; 

      // Lọc bỏ bài viết rỗng dựa trên field 'crawled_content'
      if (dataFromApi?.raw_articles) {
        dataFromApi.raw_articles = dataFromApi.raw_articles.filter(
          (article: any) => article.crawled_content && article.crawled_content.trim().length > 0
        );
      }

      setCrawlData(dataFromApi); 
    } catch (error) {
      console.error("Lỗi Crawler:", error);
      alert("Hệ thống Crawler đang bận hoặc có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFF] overflow-hidden">
      {/* 1. SIDEBAR CỐ ĐỊNH (FIXED) */}
      <Sidebar activePage="Crawler Data" />

      {/* 2. MAIN CONTENT AREA: Đẩy lề trái để tránh bị Sidebar đè lên */}
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        
        {/* Decor background bóng mờ */}
        <div className="absolute top-[-10%] right-[-5%] w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10"></div>
        
        {/* NỘI DUNG CÓ THỂ CUỘN (SCROLLABLE AREA) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-20">
            
            {/* Header Section */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                   </div>
                   <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">
                     Crawler <span className="text-indigo-500">Keyword</span>
                   </h1>
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] ml-11">
                  System v3.0 • Multi-threaded Analysis
                </p>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-full border border-indigo-100">
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">AI Status: Online</span>
              </div>
            </div>

            {/* Input Control Panel */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Nguồn báo</label>
                  <select 
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-600 focus:border-indigo-400 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {sources.map(src => <option key={src._id} value={src._id}>{src.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-5 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Từ khóa phân tích</label>
                  <input 
                    type="text" 
                    value={keyword} 
                    onChange={(e) => setKeyword(e.target.value)} 
                    placeholder="Ví dụ: Giá vàng, Chứng khoán..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:border-indigo-400 outline-none transition-all" 
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Giới hạn</label>
                  <input 
                    type="number" 
                    value={limit} 
                    onChange={(e) => setLimit(Math.min(parseInt(e.target.value) || 1, 5))} 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:border-indigo-400 outline-none transition-all" 
                  />
                </div>

                <div className="md:col-span-2">
                  <button 
                    onClick={handleStartCrawl}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Bắt đầu cào'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bảng kết quả và Phân tích AI */}
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CrawlerResultTable 
                articles={crawlData?.raw_articles || []} 
                analysis={crawlData?.analysis} 
              />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CrawlerDataView;