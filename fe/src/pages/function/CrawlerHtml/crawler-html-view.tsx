import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Database, Search, Loader2, Play, 
  Trash2, FileCode, ChevronRight, LayoutGrid, Zap, AlertCircle
} from 'lucide-react';

const CrawlerHTMLView: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]); 
  const [selectedSource, setSelectedSource] = useState<any>(null); 
  const [keyword, setKeyword] = useState('AI'); 
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // 1. LOAD NGUỒN
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/v1/sources', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.length > 0) {
          setSources(res.data);
          setSelectedSource(res.data[0]);
        }
      } catch (err) {
        console.error("KHÔNG KẾT NỐI ĐƯỢC BACKEND! Kiểm tra port 8000");
      }
    };
    fetchSources();
  }, []);

  // 2. CHẠY TRÍCH XUẤT
  const handleExecute = async () => {
    if (!selectedSource) {
      alert("Chưa chọn nguồn ông ơi!");
      return;
    }

    setLoading(true);
    setResults([]);

    // Bọc selector dự phòng cho VnExpress Search
    const pSel = (selectedSource.post_item_sel && selectedSource.post_item_sel !== "...") 
      ? selectedSource.post_item_sel : "article.item-news-common";
    const tSel = (selectedSource.title_sel && selectedSource.title_sel !== "...") 
      ? selectedSource.title_sel : ".title-news > a";

    const searchUrl = `https://vnexpress.net/search?q=${encodeURIComponent(keyword)}`;

    try {
      const token = localStorage.getItem('token');
      // LOG ĐỂ KIỂM TRA TRƯỚC KHI GỬI
      console.log("Đang gửi đi:", { url: searchUrl, pSel, tSel });

      const res = await axios.post('http://localhost:8000/api/v1/crawl-test/html', {
        url: searchUrl,
        post_item_sel: pSel, 
        title_sel: tSel         
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.status === "success") {
        setResults(res.data.data);
        if (res.data.data.length === 0) alert("Backend chạy ok nhưng không tìm thấy bài nào!");
      }
    } catch (err: any) {
      // BÁO LỖI CHI TIẾT LÊN MÀN HÌNH LUÔN
      const status = err.response?.status;
      const detail = JSON.stringify(err.response?.data?.detail);
      alert(`LỖI RỒI: Mã ${status} - Chi tiết: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar activePage="Crawler HTML" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 space-y-6">
              <h1 className="text-2xl font-black italic uppercase text-slate-800 border-b pb-4">CRAWLER TEST</h1>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chọn nguồn</label>
                <select 
                  className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none border border-slate-100"
                  onChange={(e) => setSelectedSource(sources.find(s => String(s.id) === e.target.value))}
                >
                  {sources.map((s, i) => <option key={i} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Từ khóa</label>
                <input 
                  value={keyword} onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none border border-slate-100 focus:bg-white"
                />
              </div>

              <button 
                onClick={handleExecute} disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                <span className="uppercase tracking-widest">CHẠY NGAY</span>
              </button>
            </div>

            <div className="lg:col-span-8 bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden min-h-[500px]">
               {results.length > 0 ? (
                 <div className="divide-y divide-slate-50 h-full overflow-y-auto p-4">
                    {results.map((item, i) => (
                      <div key={i} className="p-5 hover:bg-slate-50 flex items-center gap-4 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{i+1}</div>
                        <div className="flex-1 truncate">
                          <h3 className="font-bold text-slate-700 text-sm uppercase truncate group-hover:text-emerald-600">{item.title}</h3>
                          <p className="text-[10px] text-slate-400 truncate">{item.url}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-200" />
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                    <FileCode size={48} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Đang chờ lệnh từ Hào...</p>
                 </div>
               )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CrawlerHTMLView;