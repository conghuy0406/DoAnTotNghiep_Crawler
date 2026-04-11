import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { 
  Layout, Globe, Crosshair, Loader2, Play, 
  Copy, Trash2, FileText, ChevronRight, Search, Save,
  Image as ImageIcon, Tag, Percent, Settings2,
  Lightbulb, MonitorPlay, Info, Star, ShoppingCart,
  Sparkles, Bot, X, BookOpen
} from 'lucide-react';
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const BrowserCrawlerView: React.FC = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role') || 'user'; 
  const [isGlobal, setIsGlobal] = useState(false); 

  const [url, setUrl] = useState('');
  const [postItemSel, setPostItemSel] = useState(''); 
  const [titleSel, setTitleSel] = useState('');    
  const [thumbSel, setThumbSel] = useState('');
  const [priceSel, setPriceSel] = useState('');
  const [discountSel, setDiscountSel] = useState('');
  const [salesSel, setSalesSel] = useState('');
  const [ratingSel, setRatingSel] = useState('');

  const [isExpertMode, setIsExpertMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [savedSources, setSavedSources] = useState<any[]>([]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/sources/', { headers: { Authorization: `Bearer ${token}` } });
        const filtered = res.data.filter((s: any) => s.crawl_method === 'SELENIUM' || s.crawl_method === 'HTML');
        setSavedSources(filtered);
      } catch (error) { console.error("Lỗi tải danh sách nguồn:", error); }
    };
    fetchSources();
  }, []);

  const systemSources = savedSources.filter(src => src.is_global === true);
  const mySources = savedSources.filter(src => src.is_global !== true);

  const handleSelectSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setUrl(''); setPostItemSel(''); setTitleSel(''); setThumbSel(''); setPriceSel(''); setDiscountSel(''); setSalesSel(''); setRatingSel(''); return;
    }
    const source = savedSources.find(s => s._id === selectedId);
    if (source) {
      setUrl(source.search_url_template || ''); setPostItemSel(source.selectors?.post_item || ''); setTitleSel(source.selectors?.title_link || '');
      setThumbSel(source.selectors?.thumbnail || ''); setPriceSel(source.selectors?.price || ''); setDiscountSel(source.selectors?.discount || '');
      setSalesSel(source.selectors?.sales || ''); setRatingSel(source.selectors?.rating || '');
    }
  };

  const handleExecute = async () => {
    if (!url) return alert("Vui lòng nhập URL!");
    setLoading(true); setResults([]); setAiReport(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/crawl-test/browser', {
        url: url, crawl_method: 'BROWSER', post_item_sel: postItemSel, title_sel: titleSel, thumb_sel: thumbSel,
        price_sel: priceSel, discount_sel: discountSel, sales_sel: salesSel, rating_sel: ratingSel, keyword: "" 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data && res.data.status === "require_engineer") { setIsExpertMode(true); alert(`🚨 Yêu cầu bật Chế độ Kỹ sư!\n\n${res.data.message}`); return; }
      if (res.data && res.data.status === "success") { setResults(res.data.data || []); } 
      else { alert("Lỗi: " + (res.data.message || res.data.error || "Không xác định")); }
    } catch (err: any) { alert("Lỗi kết nối! " + (err.response?.data?.detail || "")); } 
    finally { setLoading(false); }
  };

  const handleAIAnalysis = async () => {
    if (results.length === 0) return alert("Chưa có dữ liệu để phân tích!");
    setAiLoading(true); setAiReport(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/ai/analyze-crawl', { url: url, data: results }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.status === "success") setAiReport(res.data.analysis);
    } catch (err: any) { alert("Lỗi AI: " + (err.response?.data?.detail || err.message)); } 
    finally { setAiLoading(false); }
  };

  const handleSaveConfig = async () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}
    try {
      await saveSourceConfigToServer({
        name: `Browser Source (${new URL(url).hostname})`, base_url: baseUrl, search_url_template: url, crawl_method: "SELENIUM", 
        is_global: isGlobal,
        selectors: { post_item: postItemSel || "", title_link: titleSel || "", thumbnail: thumbSel || "", price: priceSel || "", discount: discountSel || "", sales: salesSel || "", rating: ratingSel || "" }
      });
      alert("Đã lưu cấu hình Browser thành công!");
    } catch (error) { alert("Lỗi khi lưu cấu hình!"); }
  };

  const copyToClipboard = () => {
    const text = results.map(item => `${item.title || 'Không có tiêu đề'}: ${item.url}`).join('\n');
    navigator.clipboard.writeText(text); alert("Đã sao chép " + results.length + " kết quả!");
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Crawler Browser" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-blue-600"><Layout size={32} strokeWidth={2.5} /></div>
              <div><h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Browser Crawler</h1><p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Hệ thống trích xuất web động (Selenium)</p></div>
            </div>
            <div className="flex gap-3"><button onClick={() => {setResults([]); setAiReport(null);}} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-red-500 transition-all shadow-sm"><Trash2 size={20} /></button></div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0">
              
              {/* 🌟 BANNER GIẢI THÍCH MỚI */}
              <div className="bg-blue-600 rounded-[32px] p-6 shadow-lg shadow-blue-200/50 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10"><MonitorPlay size={120} /></div>
                <div className="relative z-10">
                  <h3 className="font-black text-[15px] flex items-center gap-2 mb-2"><Lightbulb size={18} className="text-yellow-300" /> Web Động (Browser)</h3>
                  <p className="text-[12px] font-medium text-blue-50 leading-relaxed mb-4">Công cụ giả lập người thật cuộn trang. <strong className="text-white">Phù hợp nhất:</strong> Lấy Ảnh và Giá tiền từ các sàn Thương mại điện tử (Shopee, Tiki) bị ẩn dữ liệu.</p>
                  <button onClick={() => navigate('/guide')} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <BookOpen size={14}/> Xem hướng dẫn chi tiết
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                <div className="space-y-1 mb-6 border-b border-slate-100 pb-6">
                  <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-1">📂 Template có sẵn</label>
                  <select onChange={handleSelectSource} className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl py-4 px-4 text-sm font-bold text-blue-700 outline-none focus:bg-blue-50 focus:border-blue-300 transition-all cursor-pointer shadow-inner">
                    <option value="">--- Chọn nguồn để bóc tách ---</option>
                    {systemSources.length > 0 && (<optgroup label="🌟 MẪU HỆ THỐNG (MẶC ĐỊNH)">{systemSources.map(src => (<option key={src._id} value={src._id}>{src.name} ({src.crawl_method})</option>))}</optgroup>)}
                    {mySources.length > 0 && (<optgroup label="📁 MẪU CỦA TÔI">{mySources.map(src => (<option key={src._id} value={src._id}>{src.name} ({src.crawl_method})</option>))}</optgroup>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Mục Tiêu</label>
                  <div className="relative group"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" /><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Dán link web động/TMĐT vào đây..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-400 transition-all shadow-inner text-slate-700"/></div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-6">
                  <div className="flex items-center gap-3"><Settings2 size={18} className="text-slate-400" /><div><h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Chế độ Kỹ sư</h3><p className="text-[9px] text-slate-400 font-bold mt-0.5">Tự nhập CSS Selector</p></div></div>
                  <button onClick={() => setIsExpertMode(!isExpertMode)} className={`w-12 h-6 rounded-full transition-colors relative flex items-center cursor-pointer ${isExpertMode ? 'bg-blue-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${isExpertMode ? 'translate-x-7' : 'translate-x-1'}`}></div></button>
                </div>

                <div className={`space-y-5 overflow-hidden transition-all duration-500 ease-in-out ${isExpertMode ? 'max-h-[800px] opacity-100 pt-4 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Item Selector</label><div className="relative group"><Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input value={postItemSel} onChange={(e) => setPostItemSel(e.target.value)} placeholder=".item-news" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-9 pr-3 text-[13px] font-mono text-blue-600 outline-none focus:border-blue-400 transition-all"/></div></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">Title Selector</label><div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input value={titleSel} onChange={(e) => setTitleSel(e.target.value)} placeholder=".title-news a" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-9 pr-3 text-[13px] font-mono text-orange-500 outline-none focus:border-orange-300 transition-all"/></div></div>
                  </div>

                  <div className="p-4 bg-blue-50/30 border border-blue-50 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest border-b border-blue-100 pb-2">Trích xuất mở rộng (Tuỳ chọn)</p>
                    <div className="space-y-1"><div className="relative group"><ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input value={thumbSel} onChange={(e) => setThumbSel(e.target.value)} placeholder="Tọa độ Ảnh" className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-9 pr-3 text-[13px] font-mono text-slate-600 outline-none focus:border-blue-400 transition-all"/></div></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input value={priceSel} onChange={(e) => setPriceSel(e.target.value)} placeholder="Giá" className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-9 pr-3 text-[13px] font-mono text-slate-600 outline-none focus:border-blue-400 transition-all"/></div>
                      <div className="relative group"><Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input value={discountSel} onChange={(e) => setDiscountSel(e.target.value)} placeholder="Giảm (-40%)" className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-9 pr-3 text-[13px] font-mono text-slate-600 outline-none focus:border-blue-400 transition-all"/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group"><ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input value={salesSel} onChange={(e) => setSalesSel(e.target.value)} placeholder="Lượt bán" className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-9 pr-3 text-[13px] font-mono text-slate-600 outline-none focus:border-blue-400 transition-all"/></div>
                      <div className="relative group"><Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input value={ratingSel} onChange={(e) => setRatingSel(e.target.value)} placeholder="Đánh giá" className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-9 pr-3 text-[13px] font-mono text-slate-600 outline-none focus:border-blue-400 transition-all"/></div>
                    </div>
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex items-center gap-2 mb-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <input type="checkbox" id="globalCheckBrowser" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer"/>
                      <label htmlFor="globalCheckBrowser" className="text-[11px] font-black uppercase tracking-widest text-blue-700 cursor-pointer">🌟 Lưu làm Mẫu Hệ Thống</label>
                    </div>
                  )}

                  <button onClick={handleSaveConfig} disabled={loading} className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[11px] uppercase tracking-widest"><Save size={16} /> Lưu thành Template mới</button>
                </div>

                <button onClick={handleExecute} disabled={loading} className="w-full bg-slate-800 hover:bg-blue-600 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95 mt-4">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG ĐIỀU KHIỂN BROWSER..." : "THỰC THI TRÍCH XUẤT"}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-4">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">Dữ liệu bóc tách <span className="bg-blue-100 text-blue-600 px-3 py-0.5 rounded-full text-[10px]">{results.length}</span></h2>
                  {results.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleAIAnalysis} disabled={aiLoading} className="text-[10px] font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-2 rounded-xl transition-all uppercase tracking-tighter shadow-md shadow-fuchsia-200 flex items-center gap-2 disabled:opacity-50">
                        {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {aiLoading ? "AI ĐANG ĐỌC..." : "AI PHÂN TÍCH"}
                      </button>
                      <button onClick={copyToClipboard} className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors uppercase tracking-widest flex items-center gap-2"><Copy size={14} /> SAO CHÉP</button>
                    </div>
                  )}
                </div>
              </div>

              {aiReport && (
                <div className="mb-6 bg-gradient-to-br from-violet-900 to-slate-900 rounded-[32px] p-1 relative overflow-hidden shadow-xl shadow-violet-200/50 animate-in fade-in slide-in-from-top-4">
                  <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 lg:p-8">
                    <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600"><Bot size={20} /></div>
                        <div><h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Báo cáo Thông minh</h3><p className="text-[10px] text-slate-400 font-bold">Generated by Gemini AI</p></div>
                      </div>
                      <button onClick={() => setAiReport(null)} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={16} /></button>
                    </div>
                    <div className="prose prose-sm prose-slate max-w-none h-max-[400px] overflow-y-auto custom-scrollbar pr-2">
                       <pre className="whitespace-pre-wrap font-sans text-[13px] text-slate-700 leading-relaxed font-medium">{aiReport}</pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {results.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40 bg-slate-50/50"><div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm"><FileText size={32} className="text-blue-500/30" /></div><span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Chọn Template hoặc Bật Chế độ Kỹ Sư</span></div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar p-6 space-y-4">
                    {results.map((item, i) => (
                      <div key={i} className="p-5 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-100 rounded-2xl transition-all group flex gap-5 items-start cursor-pointer">
                         {item.thumbnail ? (<img src={item.thumbnail} alt="Thumb" className="flex-none w-20 h-20 object-cover rounded-xl shadow-sm border border-slate-100 bg-white"/>) : (<div className="flex-none w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-slate-100">{(i+1).toString().padStart(2, '0')}</div>)}
                         <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="font-bold text-slate-700 text-[14px] leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">{item.title ? item.title : <span className="text-red-300 italic">Lỗi: Không lấy được tiêu đề</span>}</h3>
                            {(item.price || item.discount) && (<div className="flex items-center gap-3 mt-2">{item.price && <span className="text-[13px] font-black text-rose-500">{item.price}</span>}{item.discount && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black rounded">{item.discount}</span>}</div>)}
                            {(item.sales || item.rating) && (<div className="flex items-center gap-4 mt-2">{item.rating && (<span className="flex items-center gap-1 text-[11px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md"><Star size={12} className="fill-yellow-500" /> {item.rating}</span>)}{item.sales && (<span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><ShoppingCart size={12} /> {item.sales}</span>)}</div>)}
                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors overflow-hidden mt-2"><span className="text-[11px] font-medium truncate italic hover:underline cursor-pointer">{item.url || item.link}</span></div>
                         </div>
                         {item.url && item.url !== "#" && (<a href={item.url || item.link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-100 shrink-0"><ChevronRight size={16} /></a>)}
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
export default BrowserCrawlerView;