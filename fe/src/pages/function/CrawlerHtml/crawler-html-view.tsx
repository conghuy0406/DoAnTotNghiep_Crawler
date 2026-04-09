import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Globe, Crosshair, Loader2, Play, 
  Copy, Trash2, FileText, ExternalLink, Save, Settings2, Lightbulb, Code2, Info, FileCode, Tag, Image as ImageIcon,Sparkles
} from 'lucide-react';
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const CrawlerHtmlView: React.FC = () => {
  const [url, setUrl] = useState('');
  
  // 🌟 ĐÃ THÊM ĐẦY ĐỦ CÁC STATE CHO DỮ LIỆU MỞ RỘNG
  const [postItemSel, setPostItemSel] = useState(''); 
  const [titleSel, setTitleSel] = useState('');    
  const [thumbSel, setThumbSel] = useState('');
  const [priceSel, setPriceSel] = useState('');
  const [discountSel, setDiscountSel] = useState('');

  const [isExpertMode, setIsExpertMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [savedSources, setSavedSources] = useState<any[]>([]);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/sources/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filtered = res.data.filter((s: any) => s.crawl_method === 'HTML');
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
      setUrl(''); setPostItemSel(''); setTitleSel(''); setThumbSel(''); setPriceSel(''); setDiscountSel('');
      return;
    }
    const source = savedSources.find(s => s._id === selectedId);
    if (source) {
      setUrl(source.search_url_template || '');
      setPostItemSel(source.selectors?.post_item || '');
      setTitleSel(source.selectors?.title_link || '');
      // Load thêm các selector nâng cao nếu có
      setThumbSel(source.selectors?.thumb || '');
      setPriceSel(source.selectors?.price || '');
      setDiscountSel(source.selectors?.discount || '');
    }
  };

  const handleExecute = async () => {
    if (!url) return alert("Vui lòng nhập URL!");
    setLoading(true);
    setResults([]);
    try {
      const token = localStorage.getItem('token');
      // 🌟 GỬI TOÀN BỘ DỮ LIỆU MỞ RỘNG XUỐNG BACKEND
      const res = await axios.post('/api/v1/crawl-test/html', {
        url: url,
        post_item_sel: postItemSel,
        title_sel: titleSel,
        thumb_sel: thumbSel,
        price_sel: priceSel,
        discount_sel: discountSel
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Bắt lỗi yêu cầu bật chế độ kỹ sư từ Backend
      if (res.data && res.data.status === "require_engineer") {
        setIsExpertMode(true);
        alert(`🚨 Yêu cầu bật Chế độ Kỹ sư!\n\n${res.data.message}`);
        return;
      }

      if (res.data && res.data.status === "success") {
        setResults(res.data.data || []); 
      } else {
        alert("Lỗi: " + (res.data.message || res.data.error || "Không xác định"));
      }
    } catch (err: any) {
      alert("Lỗi kết nối Backend! " + (err.response?.data?.detail || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}

    try {
      await saveSourceConfigToServer({
        name: `HTML Source (${new URL(url).hostname})`,
        base_url: baseUrl,
        search_url_template: url,
        crawl_method: "HTML",
        // 🌟 LƯU ĐẦY ĐỦ CẤU HÌNH
        selectors: { 
          post_item: postItemSel, 
          title_link: titleSel,
          thumb: thumbSel,
          price: priceSel,
          discount: discountSel
        }
      });
      alert("Đã lưu cấu hình HTML thành công!");
    } catch (error) {
      alert("Lỗi khi lưu cấu hình!");
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Cào Web Tĩnh (HTML)" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-emerald-50 shadow-sm border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <FileCode size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">HTML Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Trích xuất Web tĩnh siêu tốc
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setUrl('https://vnexpress.net/so-hoa/ai'); setPostItemSel('.item-news'); setTitleSel('.title-news a'); setIsExpertMode(true); }} 
                className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm font-black text-[11px] uppercase tracking-widest flex items-center gap-2"
              >
                 Mẫu VnExpress
              </button>
              <button 
                onClick={() => setResults([])} 
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            
            {/* CỘT TRÁI: CẤU HÌNH */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-0">
              
              {/* THẺ HƯỚNG DẪN THÔNG MINH */}
              <div className="bg-emerald-600 rounded-[32px] p-6 shadow-lg shadow-emerald-200/50 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Code2 size={120} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-black text-[15px] flex items-center gap-2 mb-3">
                    <Lightbulb size={18} className="text-yellow-300" /> Auto-Detect Thông Minh
                  </h3>
                  <p className="text-[12px] font-medium text-emerald-50 leading-relaxed mb-4">
                    Nếu bạn không nhập CSS Selector, hệ thống sẽ <b>tự động quét</b> và trích xuất tiêu đề/link. Tuy nhiên, để lấy được chi tiết (Ảnh, Giá tiền), bạn cần bật <b>Chế độ Kỹ sư</b> và khai báo tọa độ.
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                
                {/* Chọn Nguồn */}
                <div className="space-y-1 mb-6 border-b border-slate-100 pb-6">
                  <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                    📂 Template HTML có sẵn
                  </label>
                  <select 
                    onChange={handleSelectSource}
                    className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl py-4 px-4 text-sm font-bold text-emerald-700 outline-none focus:bg-emerald-50 focus:border-emerald-300 transition-all cursor-pointer shadow-inner"
                  >
                    <option value="">--- Chọn nguồn để bóc tách ---</option>
                    {savedSources.map(src => (
                      <option key={src._id} value={src._id}>{src.name}</option>
                    ))}
                  </select>
                </div>

                {/* URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Mục Tiêu</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      value={url} onChange={(e) => setUrl(e.target.value)}
                      placeholder="VD: https://vnexpress.net..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-emerald-400 transition-all shadow-inner text-slate-700"
                    />
                  </div>
                </div>

                {/* 🌟 CÔNG TẮC BẬT TẮT CHẾ ĐỘ KỸ SƯ */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-6 cursor-pointer hover:bg-emerald-50 transition-colors"
                     onClick={() => setIsExpertMode(!isExpertMode)}>
                  <div className="flex items-center gap-3">
                    <Settings2 size={18} className={isExpertMode ? "text-emerald-500" : "text-slate-400"} />
                    <div>
                      <h3 className={`text-[11px] font-black uppercase tracking-widest ${isExpertMode ? "text-emerald-700" : "text-slate-700"}`}>Chế độ Kỹ sư</h3>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Tùy chỉnh lấy Ảnh, Giá tiền...</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isExpertMode ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${isExpertMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </div>
                </div>

                {/* 🌟 EXPERT MODE - TÙY CHỈNH NÂNG CAO */}
                <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${isExpertMode ? 'max-h-[800px] opacity-100 pt-4 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                  
                  {/* Selector Cơ bản */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Khối Item *</label>
                      <input 
                        value={postItemSel} onChange={(e) => setPostItemSel(e.target.value)}
                        placeholder="VD: .item-news"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[12px] font-mono text-emerald-600 outline-none focus:border-emerald-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Title/Link *</label>
                      <input 
                        value={titleSel} onChange={(e) => setTitleSel(e.target.value)}
                        placeholder="VD: .title a"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-[12px] font-mono text-emerald-600 outline-none focus:border-emerald-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Selector Nâng cao */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Sparkles size={12}/> Thu thập mở rộng (Không bắt buộc)</label>
                    <div className="space-y-1">
                      <input 
                        value={thumbSel} onChange={(e) => setThumbSel(e.target.value)}
                        placeholder="Tọa độ Ảnh (VD: img.thumbnail)"
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-[12px] font-mono text-slate-600 outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <input 
                        value={priceSel} onChange={(e) => setPriceSel(e.target.value)}
                        placeholder="Tọa độ Giá (VD: span.price)"
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-[12px] font-mono text-rose-500 outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <input 
                        value={discountSel} onChange={(e) => setDiscountSel(e.target.value)}
                        placeholder="Tọa độ Giảm giá (VD: div.badge-sale)"
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-[12px] font-mono text-rose-500 outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveConfig} disabled={loading}
                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[11px] uppercase tracking-widest"
                  >
                    <Save size={16} /> Lưu thành Template
                  </button>

                </div>

                {/* NÚT THỰC THI */}
                <button 
                  onClick={handleExecute} disabled={loading}
                  className="w-full bg-slate-800 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95 mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG XỬ LÝ..." : "THỰC THI TRÍCH XUẤT"}</span>
                </button>

              </div>
            </div>

            {/* CỘT PHẢI: KẾT QUẢ ĐÃ LỘT XÁC */}
            <div className="lg:col-span-7 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-2">
                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  Dữ liệu bóc tách <span className="bg-emerald-100 text-emerald-600 px-3 py-0.5 rounded-full text-[10px]">{results.length}</span>
                </h2>
                {results.length > 0 && (
                  <button className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors uppercase tracking-widest flex items-center gap-2">
                    <Copy size={14} /> Sao chép JSON
                  </button>
                )}
              </div>

              <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {results.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40 bg-slate-50/50">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                      <FileText size={32} className="text-emerald-500/30" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Chưa có dữ liệu</span>
                  </div>
                ) : (
                  <div className="overflow-y-auto no-scrollbar p-6 space-y-4 bg-slate-50/30">
                    {/* 🌟 VÒNG LẶP KẾT QUẢ DẠNG CARD */}
                    {results.map((item, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-4 items-start group animate-in fade-in">
                        
                        {/* Khu vực Ảnh (Nếu có thumb_sel) */}
                        {item.thumbnail ? (
                          <div className="w-24 h-24 shrink-0 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 font-black text-sm">
                            {(i+1).toString().padStart(2, '0')}
                          </div>
                        )}

                        {/* Khu vực Text */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-700 text-[14px] leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
                            {item.title}
                          </h3>
                          
                          {/* Khu vực Giá / Discount (Nếu có) */}
                          {(item.price || item.discount) && (
                            <div className="flex items-center gap-3 mb-2">
                              {item.price && <span className="text-rose-600 font-black text-sm flex items-center gap-1"><Tag size={12}/> {item.price}</span>}
                              {item.discount && <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md">{item.discount}</span>}
                            </div>
                          )}

                          <a href={item.url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-slate-400 italic hover:text-emerald-500 truncate block">
                            {item.url}
                          </a>
                        </div>
                        
                        {/* Nút mở Link */}
                        <a 
                          href={item.url} target="_blank" rel="noreferrer"
                          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-slate-100 shrink-0"
                        >
                          <ExternalLink size={16} />
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

export default CrawlerHtmlView;