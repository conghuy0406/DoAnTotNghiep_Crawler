import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Zap, Globe, Loader2, Trash2, 
  Sparkles, ShieldCheck, ChevronRight, Wand2, Save 
} from 'lucide-react';
// ✅ IMPORT HÀM LƯU TỪ TRẠM THU GOM API
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const SmartAutoView: React.FC = () => {
  const [url, setUrl] = useState('https://vnexpress.net/so-hoa/ai');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // ✅ 1. THÊM STATE CHỨA DANH SÁCH NGUỒN ĐÃ LƯU
  const [savedSources, setSavedSources] = useState<any[]>([]);

  // ✅ 2. TỰ ĐỘNG TẢI DANH SÁCH NGUỒN KHI MỞ TRANG
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/v1/sources/');
        // Lọc ra CÁC NGUỒN SMART_AUTO
        const filtered = res.data.filter((s: any) => s.crawl_method === 'SMART_AUTO');
        setSavedSources(filtered);
      } catch (error) {
        console.error("Lỗi tải danh sách nguồn:", error);
      }
    };
    fetchSources();
  }, []);

  // ✅ 3. HÀM XỬ LÝ KHI CHỌN NGUỒN TỪ DROPDOWN
  const handleSelectSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setUrl('');
      return;
    }
    const source = savedSources.find(s => s._id === selectedId);
    if (source) {
      setUrl(source.search_url_template || '');
    }
  };

  // ==========================================
  // HÀM CHẠY KIỂM THỬ SMART AUTO
  // ==========================================
  const handleSmartExecute = async () => {
    if (!url) return alert("Vui lòng nhập URL!");
    setLoading(true);
    setResults([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/v1/crawl-test/smart-auto', {
        url: url
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.status === "success") {
        setResults(res.data.data);
      } else {
        alert("Backend trả về lỗi: " + (res.data.message || "Không xác định"));
      }
    } catch (err) {
      console.error("Lỗi Smart Auto:", err);
      alert("Hệ thống AI không thể phân tích tự động trang này!");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HÀM LƯU CẤU HÌNH SMART AUTO
  // ==========================================
  const handleSaveConfig = () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}

    saveSourceConfigToServer({
      base_url: baseUrl,
      search_url_template: url,
      crawl_method: "SMART_AUTO", // BE lưu đúng loại này
      selectors: {} // Smart Auto thì không cần selector
    });
  };

  return (
    <div className="flex h-screen bg-[#FDF8FA]">
      <Sidebar activePage="Smart Auto" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          
          {/* HEADER STYLE AI */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-rose-100 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                <Sparkles size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none mb-2">Smart Auto Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span> AI-Powered Detection (No Selector Needed)
                </p>
              </div>
            </div>
            <button 
              onClick={() => setResults([])} 
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-rose-500 transition-all shadow-sm"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* CỘT TRÁI: CẤU HÌNH */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-rose-50 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Zap size={100} className="text-rose-500" />
                </div>

                {/* ✅ KHU VỰC CHỌN NGUỒN ĐÃ LƯU */}
                <div className="space-y-1 mb-6 border-b border-rose-50 pb-6 relative z-10">
                  <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest ml-1">
                    📂 Tải cấu hình đã lưu
                  </label>
                  <select 
                    onChange={handleSelectSource}
                    className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl py-3 px-4 text-sm font-bold text-rose-700 outline-none focus:bg-rose-50 focus:border-rose-300 transition-all cursor-pointer"
                  >
                    <option value="">--- Chọn nguồn AI để tải lại ---</option>
                    {savedSources.map(src => (
                      <option key={src._id} value={src._id}>
                        {src.name} 
                      </option>
                    ))}
                  </select>
                </div>

                {/* NHẬP URL */}
                <div className="space-y-1 relative z-10">
                  <label className="text-[11px] font-black text-rose-400 uppercase tracking-widest ml-1">Địa chỉ trang web</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                    <input 
                      value={url} onChange={(e) => setUrl(e.target.value)}
                      placeholder="Nhập URL bất kỳ..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-rose-400 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* ✅ HAI NÚT NẰM NGANG */}
                <div className="flex gap-3 relative z-10">
                  <button 
                    onClick={handleSmartExecute} disabled={loading}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-100 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG QUÉT..." : "THỰC THI AI"}</span>
                  </button>

                  <button 
                    onClick={handleSaveConfig} disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95"
                  >
                    <Save className="w-5 h-5" />
                    <span className="tracking-widest uppercase text-[12px]">LƯU CẤU HÌNH</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-50 relative z-10">
                   <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 p-4 rounded-2xl">
                      <ShieldCheck size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">AI đã sẵn sàng nhận diện cấu trúc</span>
                   </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: KẾT QUẢ TỰ ĐỘNG NHẬN DIỆN */}
            <div className="lg:col-span-8">
              <div className="flex justify-between items-center mb-5 px-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Kết quả nhận diện ({results.length})</h2>
              </div>

              <div className="bg-white border border-rose-50 rounded-[40px] shadow-sm min-h-[500px] overflow-hidden">
                {results.length === 0 ? (
                  <div className="h-[500px] flex flex-col items-center justify-center text-slate-200">
                    <Sparkles size={60} className="opacity-10 mb-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Đang chờ dữ liệu đầu vào...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[650px] overflow-y-auto custom-scrollbar">
                    {results.map((item, i) => (
                      <div key={i} className="p-6 hover:bg-rose-50/30 transition-all group flex gap-6 items-center">
                         <div className="flex-none w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300 group-hover:bg-rose-500 group-hover:text-white transition-all">
                           {(i+1).toString().padStart(2, '0')}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-700 text-[15px] group-hover:text-rose-600 transition-colors truncate">
                              {item.title || item.name || "DỮ LIỆU TỰ ĐỘNG"}
                            </h3>
                            <p className="text-[10px] text-slate-400 truncate mt-1 italic">
                              {item.url || item.link}
                            </p>
                         </div>
                         <a href={item.url || item.link} target="_blank" rel="noopener noreferrer">
                           <ChevronRight size={18} className="text-slate-200 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                         </a>
                      </div>
                    ))}
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

export default SmartAutoView;