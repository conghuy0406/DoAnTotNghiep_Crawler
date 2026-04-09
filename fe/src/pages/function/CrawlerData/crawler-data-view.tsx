import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar'; 
import CrawlerResultTable from './crawler-result-table';
import { CrawlerSource } from './types';
import { 
  Database, Bot, Search, Loader2, Play, 
  Activity, Lightbulb, Info, Layers
} from 'lucide-react';

const CrawlerDataView: React.FC = () => {
  const [sources, setSources] = useState<CrawlerSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(5);
  
  // 🌟 ĐÃ THÊM: State quản lý trạng thái tải nguồn để không bị kẹt UI
  const [isFetchingSources, setIsFetchingSources] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [crawlData, setCrawlData] = useState<any>(null);
  
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      setIsFetchingSources(true); // Bắt đầu tải
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/v1/sources/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setSources(data);
        if (data.length > 0) setSelectedSourceId(data[0]._id);
      } catch (err) { 
        console.error("Lỗi lấy nguồn:", err); 
      } finally {
        setIsFetchingSources(false); // Kết thúc tải dù thành công hay thất bại
      }
    };
    fetchSources();
    return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); };
  }, []);

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value);
    if (value > 5) value = 5;
    if (value < 1 || isNaN(value)) value = 1;
    setLimit(value);
  };

  const fetchFinalResult = async (resultId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/v1/history/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const rawData = res.data;
      setCrawlData({
        raw_articles: rawData.raw_articles || rawData.structured_data || [],
        analysis: {
          summary: rawData.summary,
          category: rawData.category
        }
      });
      setLoading(false);
      setStatusMsg("Hoàn thành!");
    } catch (err) {
      console.error("Lỗi lấy kết quả:", err);
      setLoading(false);
    }
  };

  const startPolling = (taskId: string) => {
    pollingRef.current = window.setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        // Đã cập nhật token cho API polling để tránh lỗi 401
        const res = await axios.get(`http://localhost:8000/api/v1/status/${taskId}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const { status, progress, message, result_id } = res.data;

        setProgress(progress);
        setStatusMsg(message);

        if (status === 'completed') {
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          fetchFinalResult(result_id);
        } else if (status === 'failed') {
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          setLoading(false);
          alert("Lỗi: " + message);
        }
      } catch (err) {
        if (pollingRef.current) window.clearInterval(pollingRef.current);
        setLoading(false);
        console.error("Lỗi Polling:", err);
      }
    }, 2000); 
  };

  const handleStartCrawl = async () => {
    if (!keyword.trim()) return alert("Vui lòng nhập từ khóa tìm kiếm!");
    if (!selectedSourceId) return alert("Vui lòng chọn Nguồn tin cậy trước khi chạy!");
    
    setLoading(true);
    setProgress(5);
    setStatusMsg("Đang khởi tạo Agent...");
    setCrawlData(null);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        keyword,
        limit,
        target_sources: [selectedSourceId]
      };

      const res = await axios.post('http://localhost:8000/api/v1/keyword', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.task_id) {
        startPolling(res.data.task_id);
      }
    } catch (err) {
      alert("Lỗi kết nối Server!");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Kho Dữ Liệu Thô" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Database size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Keyword Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Hệ thống lùng sục dữ liệu bằng AI
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            
            {/* CỘT TRÁI: CẤU HÌNH */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0">
              
              {/* 🌟 THẺ HƯỚNG DẪN THÔNG MINH (INDIGO THEME) 🌟 */}
              <div className="bg-indigo-600 rounded-[32px] p-6 shadow-lg shadow-indigo-200/50 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Bot size={120} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-black text-[15px] flex items-center gap-2 mb-3">
                    <Lightbulb size={18} className="text-yellow-300" /> Cào theo Từ khóa là gì?
                  </h3>
                  <p className="text-[12px] font-medium text-indigo-50 leading-relaxed mb-4">
                    Thay vì cào 1 link cố định, bạn chỉ cần nhập <strong className="text-white">Từ khóa</strong> (VD: Giá vàng). Hệ thống AI sẽ đóng vai trò như một thám tử: tự động tìm kiếm trên Nguồn tin, đọc hàng loạt bài viết, và viết ra một bản <strong className="text-white">Báo cáo tóm tắt</strong> cho riêng bạn.
                  </p>
                  <p className="text-[10px] font-bold text-indigo-200 mt-3 flex items-center gap-1.5 uppercase tracking-widest">
                    <Info size={12} /> Tác vụ chạy ngầm (Async Polling)
                  </p>
                </div>
              </div>

              {/* FORM CẤU HÌNH */}
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                
                <div className="space-y-1 mb-6 border-b border-slate-100 pb-6">
                  <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1">
                    📂 Chọn Nguồn Tin Cậy
                  </label>
                  <select 
                    value={selectedSourceId} 
                    onChange={(e)=>setSelectedSourceId(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl py-4 px-4 text-sm font-bold text-indigo-700 outline-none focus:bg-indigo-50 focus:border-indigo-300 transition-all cursor-pointer shadow-inner"
                  >
                    {/* 🌟 ĐÃ THAY ĐỔI LOGIC RENDER NGUỒN TẠI ĐÂY 🌟 */}
                    {isFetchingSources ? (
                      <option value="">Đang tải nguồn...</option>
                    ) : sources.length === 0 ? (
                      <option value="">Chưa có nguồn nào. Hãy tạo mới!</option>
                    ) : (
                      sources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Từ khóa tìm kiếm</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      value={keyword} onChange={(e) => setKeyword(e.target.value)}
                      placeholder="VD: Trí tuệ nhân tạo, Giá vàng..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng tin (Max 5)</label>
                  <div className="relative group">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="number" min="1" max="5" 
                      value={limit} onChange={handleLimitChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* NÚT THỰC THI */}
                <button 
                  onClick={handleStartCrawl} disabled={loading || isFetchingSources || sources.length === 0}
                  className="w-full bg-slate-800 hover:bg-indigo-600 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95 mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  <span className="tracking-widest uppercase text-[12px]">{loading ? "AI ĐANG LÀM VIỆC..." : "RA LỆNH CHO AI"}</span>
                </button>

                {/* PROGRESS BAR NẰM GỌN TRONG FORM */}
                {loading && (
                  <div className="pt-4 border-t border-slate-100 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center px-1 mb-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                         <Activity size={12} /> {statusMsg}
                      </span>
                      <span className="text-[10px] font-black text-slate-400">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* CỘT PHẢI: GỌI COMPONENT KẾT QUẢ */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
               <CrawlerResultTable articles={crawlData?.raw_articles || []} analysis={crawlData?.analysis} />
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default CrawlerDataView;