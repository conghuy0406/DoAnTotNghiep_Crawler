import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Zap, Globe, Loader2, Trash2, 
  Sparkles, ShieldCheck, Wand2, Save,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const SmartAutoView: React.FC = () => {
  const [url, setUrl] = useState('https://vnexpress.net/so-hoa/ai');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [savedSources, setSavedSources] = useState<any[]>([]);

  // ==========================================
  // 1. TẢI DANH SÁCH NGUỒN (Đã gắn bảo mật Token)
  // ==========================================
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/sources/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filtered = res.data.filter((s: any) => s.crawl_method === 'SMART_AUTO');
        setSavedSources(filtered);
      } catch (error) {
        console.error("Lỗi tải danh sách nguồn:", error);
      }
    };
    fetchSources();
  }, []);

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
  // 2. THỰC THI AI (Bắt lỗi thông minh hơn)
  // ==========================================
  const handleSmartExecute = async () => {
    if (!url) return alert("Vui lòng nhập URL!");
    setLoading(true);
    setResults([]);
    setExpandedIndex(null); 
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/crawl-test/smart-auto', { url: url }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Bắt chính xác trạng thái từ Backend trả về
      if (res.data && res.data.status === "success") {
        setResults(res.data.data);
      } else {
        // Hiện đúng thông báo lỗi tiếng Việt (VD: Hết Quota)
        alert("Lỗi: " + (res.data.message || res.data.error || "Hệ thống không phản hồi"));
      }
    } catch (err: any) {
      console.error("Lỗi Smart Auto:", err);
      alert("Hệ thống AI không thể phân tích trang này! " + (err.response?.data?.detail || ""));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. LƯU CẤU HÌNH (Thêm async/await và Alert)
  // ==========================================
  const handleSaveConfig = async () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}

    try {
      await saveSourceConfigToServer({
        name: `Smart Auto AI (${new URL(url).hostname})`, // Tự đặt tên cho dễ nhớ
        base_url: baseUrl,
        search_url_template: url,
        crawl_method: "SMART_AUTO", 
        selectors: {} 
      });
      alert("Đã lưu cấu hình AI thành công vào kho Nguồn!");
    } catch (error) {
      console.error("Lỗi lưu cấu hình:", error);
      alert("Lỗi khi lưu cấu hình! Phiên đăng nhập có thể đã hết hạn.");
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (!sentiment) return "bg-slate-100 text-slate-500 border-slate-200";
    const lower = sentiment.toLowerCase();
    if (lower.includes('tích cực')) return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (lower.includes('tiêu cực')) return "bg-rose-50 text-rose-600 border-rose-200";
    return "bg-amber-50 text-amber-600 border-amber-200"; 
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
  };

  return (
    <div className="flex h-screen bg-[#FDF8FA]">
      <Sidebar activePage="Smart Auto" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-rose-100 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                <Sparkles size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none mb-2">Smart Auto Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span> LLM Data Parsing & Sentiment Analysis
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setResults([]); setExpandedIndex(null); }} 
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-rose-500 transition-all shadow-sm"
              title="Xóa kết quả"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-rose-50 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Zap size={100} className="text-rose-500" />
                </div>

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
                      <option key={src._id} value={src._id}>{src.name}</option>
                    ))}
                  </select>
                </div>

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
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="flex justify-between items-center mb-5 px-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Kết quả phân tích LLM ({results.length})</h2>
              </div>

              <div className="bg-white border border-rose-50 rounded-[40px] shadow-sm min-h-[500px] overflow-hidden">
                {results.length === 0 ? (
                  <div className="h-[500px] flex flex-col items-center justify-center text-slate-200">
                    <Sparkles size={60} className="opacity-10 mb-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Đang chờ dữ liệu đầu vào...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[650px] overflow-y-auto custom-scrollbar">
                    {results.map((item, i) => {
                      const isExpanded = expandedIndex === i;

                      return (
                        <div key={i} className="hover:bg-rose-50/30 transition-all border-b border-slate-50 relative">
                           
                           <div 
                             className="p-7 flex gap-6 items-start cursor-pointer group"
                             onClick={() => toggleExpand(i)}
                           >
                               <div className="flex-none w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[12px] font-black text-slate-300 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                                 {(i+1).toString().padStart(2, '0')}
                               </div>
                               
                               <div className="flex-1 min-w-0 pt-1">
                                  <div className="flex justify-between items-start gap-4 mb-1">
                                     <div>
                                       {item.topic && (
                                          <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5 block">
                                            ◆ {item.topic}
                                          </span>
                                       )}
                                       <h3 className="font-bold text-slate-800 text-lg group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
                                         {item.title || "DỮ LIỆU TỰ ĐỘNG BỞI AI"}
                                       </h3>
                                     </div>
                                     
                                     <div className="flex items-center gap-3 shrink-0 mt-1">
                                       {item.sentiment && (
                                         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${getSentimentColor(item.sentiment)}`}>
                                           {item.sentiment}
                                         </span>
                                       )}
                                       <div className="text-slate-300 group-hover:text-rose-400 transition-colors">
                                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                       </div>
                                     </div>
                                  </div>
                                  
                                  {!isExpanded && item.description && (
                                    <p className="text-sm text-slate-500 line-clamp-1 italic mt-2">
                                      {item.description}
                                    </p>
                                  )}
                               </div>
                           </div>

                           {/* PHẦN CHI TIẾT */}
                           {isExpanded && (
                             <div className="px-7 pb-7 ml-[72px] animate-in fade-in slide-in-from-top-2 duration-300 cursor-default">
                                
                                <div className="mb-5 border-t border-slate-100 pt-5">
                                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Phân tích AI chuyên sâu</h4>
                                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                    {item.detailed_analysis || item.description || "Đang cập nhật phân tích..."}
                                  </p>
                                </div>

                                {item.sentiment_reason && (
                                  <div className="mb-5 flex items-start gap-3">
                                    <div className={`p-2 rounded-lg mt-1 ${getSentimentColor(item.sentiment).replace('text-', 'bg-').replace('50', '100')}`}>
                                      <Zap size={14} className="opacity-70" />
                                    </div>
                                    <div>
                                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Cơ sở đánh giá ({item.sentiment})</h4>
                                      <p className="text-[13px] text-slate-600 italic">
                                        {item.sentiment_reason}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between flex-wrap gap-3 mt-6">
                                   {item.tags && Array.isArray(item.tags) && (
                                     <div className="flex flex-wrap gap-2">
                                       {item.tags.map((tag: string, idx: number) => (
                                         <span key={idx} className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-md">
                                           #{tag}
                                         </span>
                                       ))}
                                     </div>
                                   )}

                                   {/* ✅ XỬ LÝ LINK THÔNG MINH: Lọc bỏ # và nối domain nếu link bị thiếu */}
                                   {(() => {
                                      let finalUrl = item.link || item.url || "";
                                      
                                      // 1. Nếu không có link hoặc là '#' thì không hiện nút bấm luôn
                                      if (!finalUrl || finalUrl === "#" || finalUrl === "null") return null;

                                      // 2. Nếu link bị cụt đầu (thiếu http), nối thêm tên miền gốc vào
                                      if (!finalUrl.startsWith("http")) {
                                        try {
                                           const base = new URL(url).origin;
                                           finalUrl = finalUrl.startsWith("/") ? `${base}${finalUrl}` : `${base}/${finalUrl}`;
                                        } catch(e) {
                                           finalUrl = `https://${finalUrl}`;
                                        }
                                      }

                                      return (
                                        <div className="ml-auto">
                                          <a 
                                            href={finalUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()} 
                                            className="flex items-center gap-2 bg-rose-500 px-4 py-2 rounded-xl hover:bg-rose-600 transition-all shadow-md shadow-rose-200"
                                          >
                                            <Globe className="w-4 h-4 text-white" />
                                            <span className="text-[11px] font-black text-white uppercase tracking-wider">
                                              Đến trang gốc
                                            </span>
                                          </a>
                                        </div>
                                      );
                                   })()}

                                </div>
                             </div>
                           )}

                        </div>
                      );
                    })}
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