import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar'; 
import CrawlerResultTable from './crawler-result-table';
import { CrawlerSource } from './types';

const CrawlerDataView: React.FC = () => {
  const [sources, setSources] = useState<CrawlerSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(2); 
  const [loading, setLoading] = useState(false);
  const [crawlData, setCrawlData] = useState<any>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/v1/sources/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataSources = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setSources(dataSources);
        if (dataSources.length > 0) setSelectedSourceId(dataSources[0]._id);
      } catch (error) {
        console.error("Lỗi lấy nguồn:", error);
      }
    };
    fetchSources();
  }, []);

  const handleStartCrawl = async () => {
    // 1. Kiểm tra nguồn báo đã chọn chưa
    if (!selectedSourceId) {
      alert("Hào chọn nguồn báo đã nhé!");
      return;
    }

    if (!keyword.trim()) {
      alert("Hào nhập từ khóa trước nhé!");
      return;
    }

    setLoading(true);
    setCrawlData(null); 

    try {
      const token = localStorage.getItem('token');
      
      // 2. ÉP KIỂU SỐ NGUYÊN VÀ GIỚI HẠN CHẶT CHẼ
      const inputVal = parseInt(limit.toString());
      const safeLimit = isNaN(inputVal) ? 2 : Math.min(Math.max(inputVal, 1), 5);

      const response = await axios.post('http://localhost:8000/api/v1/keyword', {
        target_sources: [selectedSourceId],
        keyword: keyword,
        limit: safeLimit 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Lấy data từ đúng cấu trúc API của Hào
      const dataFromApi = response.data.data; 
      
      // 3. FIX LỖI HIỂN THỊ THỪA (Phòng hờ Backend trả sai số lượng)
      if (dataFromApi?.raw_articles) {
        dataFromApi.raw_articles = dataFromApi.raw_articles.slice(0, safeLimit);
      }

      setCrawlData(dataFromApi); 
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Hệ thống đang bận hoặc từ khóa không tìm thấy kết quả!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFF] overflow-hidden">
      <Sidebar activePage="Crawler Data" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-[-10%] right-[-5%] w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10"></div>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-20">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                 <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                 </div>
                 <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">
                    Crawler <span className="text-indigo-500">Keyword</span>
                 </h1>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] ml-11">System v3.0 • Manual Saving</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Nguồn báo</label>
                  <select 
                    disabled={loading}
                    value={selectedSourceId} 
                    onChange={(e) => setSelectedSourceId(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none disabled:bg-slate-50"
                  >
                    {sources.map(src => <option key={src._id} value={src._id}>{src.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-5 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Từ khóa</label>
                  <input 
                    type="text" 
                    disabled={loading}
                    value={keyword} 
                    onChange={(e) => setKeyword(e.target.value)} 
                    placeholder="Nhập từ khóa..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-indigo-400 disabled:bg-slate-50" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Số lượng (1-5)</label>
                  <input 
                    type="number" 
                    disabled={loading}
                    value={limit} 
                    onChange={(e) => {
                        const val = e.target.value;
                        setLimit(val === '' ? '' as any : parseInt(val));
                    }} 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-indigo-600 outline-none disabled:bg-slate-50" 
                  />
                </div>
                <div className="md:col-span-2">
                  <button 
                    onClick={handleStartCrawl} 
                    disabled={loading} 
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang chạy</span>
                        </div>
                    ) : "Bắt đầu"}
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full">
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