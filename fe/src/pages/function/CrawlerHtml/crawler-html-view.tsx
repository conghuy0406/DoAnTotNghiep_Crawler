import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Globe, Crosshair, Loader2, Play, 
  Trash2, FileCode, ChevronRight, Search, FileJson, Save
} from 'lucide-react';
// ✅ IMPORT HÀM LƯU TỪ TRẠM THU GOM API
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const CrawlerHTMLView: React.FC = () => {
  // ✅ 1. TRẢ LẠI STATE ĐÚNG CHUẨN ĐỂ NHẬP LIỆU
  const [url, setUrl] = useState('https://dantri.com.vn/suc-manh-so.htm');
  const [postItemSel, setPostItemSel] = useState('article.article-item'); 
  const [titleSel, setTitleSel] = useState('h3.article-title a');    
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // ✅ 2. STATE CHỨA DANH SÁCH NGUỒN HTML ĐÃ LƯU
  const [savedSources, setSavedSources] = useState<any[]>([]);

  // ✅ 3. TẢI CẤU HÌNH HTML KHI MỞ TRANG
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/v1/sources/');
        // CHỈ LẤY NGUỒN CÓ PHƯƠNG PHÁP LÀ HTML
        const filtered = res.data.filter((s: any) => s.crawl_method === 'HTML');
        setSavedSources(filtered);
      } catch (error) {
        console.error("Lỗi tải danh sách nguồn:", error);
      }
    };
    fetchSources();
  }, []);

  // ✅ 4. HÀM XỬ LÝ KHI CHỌN NGUỒN
  const handleSelectSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setUrl(''); setPostItemSel(''); setTitleSel('');
      return;
    }
    const source = savedSources.find(s => s._id === selectedId);
    if (source) {
      setUrl(source.search_url_template || '');
      setPostItemSel(source.selectors?.post_item || '');
      setTitleSel(source.selectors?.title_link || '');
    }
  };

  // ==========================================
  // HÀM CHẠY KIỂM THỬ HTML (Gọi đúng chuẩn Swagger)
  // ==========================================
  const handleExecute = async () => {
    if (!url) return alert("Vui lòng nhập URL trang web!");
    setLoading(true);
    setResults([]);

    try {
      const token = localStorage.getItem('token');
      // Đã loại bỏ đoạn hardcode VnExpress, dùng chính xác data người dùng nhập
      const res = await axios.post('http://localhost:8000/api/v1/crawl-test/html', {
        url: url,
        post_item_sel: postItemSel, 
        title_sel: titleSel        
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.status === "success") {
        setResults(res.data.data || []);
      } else {
        alert("Lỗi Backend: " + (res.data.message || "Không xác định"));
      }
    } catch (err: any) {
      alert("Lỗi kết nối Backend! Chi tiết: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HÀM LƯU CẤU HÌNH HTML
  // ==========================================
  const handleSaveConfig = () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}

    saveSourceConfigToServer({
      base_url: baseUrl,
      search_url_template: url,
      crawl_method: "HTML", // LƯU VỚI LOẠI HTML
      selectors: {
        post_item: postItemSel || "",
        title_link: titleSel || ""
      }
    });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar activePage="Crawler HTML" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-emerald-100 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <FileJson size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">HTML Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Trích xuất tĩnh siêu tốc độ
                </p>
              </div>
            </div>
            <button 
              onClick={() => setResults([])} 
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-emerald-500 transition-all shadow-sm"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            
            {/* CỘT TRÁI: FORM CẤU HÌNH */}
            <div className="lg:col-span-4 space-y-6 sticky top-0">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-emerald-50 space-y-6">
                
                {/* 📂 TẢI CẤU HÌNH ĐÃ LƯU */}
                <div className="space-y-1 mb-6 border-b border-emerald-50 pb-6">
                  <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                    📂 Tải cấu hình HTML đã lưu
                  </label>
                  <select 
                    onChange={handleSelectSource}
                    className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl py-3 px-4 text-sm font-bold text-emerald-700 outline-none focus:bg-emerald-50 focus:border-emerald-300 transition-all cursor-pointer"
                  >
                    <option value="">--- Chọn nguồn để tải lại Form ---</option>
                    {savedSources.map(src => (
                      <option key={src._id} value={src._id}>
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ô NHẬP LIỆU CHUẨN */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Mục Tiêu</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      value={url} onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-emerald-400 transition-all shadow-inner text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-emerald-600">Post Item Selector</label>
                  <div className="relative group">
                    <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      value={postItemSel} onChange={(e) => setPostItemSel(e.target.value)}
                      placeholder="article.article-item"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono text-emerald-600 outline-none focus:bg-white focus:border-emerald-400 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-orange-500">Title Selector</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-400 transition-colors" />
                    <input 
                      value={titleSel} onChange={(e) => setTitleSel(e.target.value)}
                      placeholder="h3.article-title a"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono text-orange-500 outline-none focus:bg-white focus:border-orange-300 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* HAI NÚT HÀNH ĐỘNG */}
                <div className="flex gap-3">
                  <button 
                    onClick={handleExecute} disabled={loading}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG QUÉT..." : "THỰC THI"}</span>
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

            {/* CỘT PHẢI: KẾT QUẢ TĨNH */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Dữ liệu bóc tách HTML ({results.length})</h2>
              </div>

              <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {results.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40">
                    <FileCode size={40} className="opacity-20 mb-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Chưa có dữ liệu...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar">
                    {results.map((item, i) => (
                      <div key={i} className="p-6 hover:bg-emerald-50/50 transition-all group flex gap-6 items-center">
                         <div className="flex-none w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                           {(i+1).toString().padStart(2, '0')}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-700 text-[15px] leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tight truncate">
                              {item.title ? item.title : <span className="text-red-300 italic">Lỗi: Selector không lấy được text</span>}
                            </h3>
                            <p className="text-[10px] text-slate-400 truncate mt-1 group-hover:text-emerald-500 transition-colors italic">
                              {item.url || item.link}
                            </p>
                         </div>
                         <a 
                            href={item.url || item.link} target="_blank" rel="noreferrer"
                            className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all p-2"
                         >
                            <ChevronRight size={18} />
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

export default CrawlerHTMLView;