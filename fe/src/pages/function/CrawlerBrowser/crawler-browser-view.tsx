import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Layout, Globe, Crosshair, Loader2, Play, 
  Copy, Trash2, FileText, ChevronRight, Search 
} from 'lucide-react';
// ✅ IMPORT HÀM LƯU TỪ TRẠM THU GOM API (Đảm bảo bạn đã tạo file này như hướng dẫn trước)
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const BrowserCrawlerView: React.FC = () => {
  const [url, setUrl] = useState('https://vnexpress.net/so-hoa/ai');
  const [postItemSel, setPostItemSel] = useState('.item-news'); 
  const [titleSel, setTitleSel] = useState('.title-news a');    
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // ==================================================
  // 1. HÀM CHẠY KIỂM THỬ BROWSER
  // ==================================================
  const handleExecute = async () => {
    setLoading(true);
    setResults([]);
    try {
      const token = localStorage.getItem('token');
      // Đổi từ /browser sang /execute-universal cho đúng route BE
      const res = await axios.post('http://localhost:8000/api/v1/crawl-test/browser', {
        url: url,
        crawl_method: 'BROWSER', // BE của Hào nhận tham số này để switch logic
        post_item_sel: postItemSel,
        title_sel: titleSel,
        keyword: "" 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Kiểm tra cấu trúc response { status: "success", data: [...] }
      if (res.data && res.data.status === "success") {
        setResults(res.data.data || []); 
      } else {
        alert("Backend trả về lỗi: " + (res.data.message || "Không xác định"));
      }
    } catch (err) {
      console.error("Lỗi trích xuất Browser:", err);
      alert("Hào ơi, kiểm tra lại kết nối Backend hoặc Token nhé!");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // 2. HÀM LƯU CẤU HÌNH (MỚI THÊM)
  // ==================================================
  const handleSaveConfig = () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}

    // Gọi hàm dùng chung để gửi data sang Backend
    saveSourceConfigToServer({
      base_url: baseUrl,
      search_url_template: url,
      crawl_method: "SELENIUM", // BE lưu Browser là SELENIUM
      selectors: {
        post_item: postItemSel || "",
        title_link: titleSel || ""
      }
    });
  };

  const copyToClipboard = () => {
    // Chỉ copy những mục có dữ liệu thực tế
    const text = results
      .map(item => `${item.title || 'Không có tiêu đề'}: ${item.url}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert("Đã sao chép " + results.length + " kết quả!");
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600">
      <Sidebar activePage="Crawler Browser" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* HEADER TRẮNG ĐỒNG BỘ */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Layout size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Browser Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Hệ thống trích xuất cấu trúc DOM
                </p>
              </div>
            </div>
            <button 
              onClick={() => setResults([])} 
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-red-500 transition-all shadow-sm"
              title="Xóa kết quả"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            
            {/* CỘT TRÁI: CẤU HÌNH */}
            <div className="lg:col-span-4 space-y-6 sticky top-0">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Mục Tiêu</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      value={url} onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-emerald-600">Post Item Selector</label>
                  <div className="relative group">
                    <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      value={postItemSel} onChange={(e) => setPostItemSel(e.target.value)}
                      placeholder=".item-news"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-orange-600">Title Selector</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                      value={titleSel} onChange={(e) => setTitleSel(e.target.value)}
                      placeholder=".title-news a"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono text-orange-600 outline-none focus:bg-white focus:border-orange-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* ✅ HAI NÚT NẰM NGANG Ở ĐÂY */}
                <div className="flex gap-3">
                  <button 
                    onClick={handleExecute} disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG QUÉT..." : "THỰC THI"}</span>
                  </button>

                  <button 
                    onClick={handleSaveConfig} disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95"
                  >
                    <span className="text-lg">💾</span>
                    <span className="tracking-widest uppercase text-[12px]">LƯU CẤU HÌNH</span>
                  </button>
                </div>

              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[30px]">
                 <p className="text-[13px] text-blue-900/60 leading-relaxed font-medium italic">
                   Mẹo cho Hào: Nếu tiêu đề hiển thị trống, hãy thử đổi selector thành <code className="text-blue-700">.title-news</code> (bỏ thẻ a) để lấy text trực tiếp nhé.
                 </p>
              </div>
            </div>

            {/* CỘT PHẢI: KẾT QUẢ */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Dữ liệu bóc tách ({results.length})</h2>
                {results.length > 0 && (
                  <button 
                    onClick={copyToClipboard}
                    className="text-[11px] font-black text-blue-600 flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all uppercase tracking-tighter"
                  >
                    <Copy size={14} /> SAO CHÉP TẤT CẢ
                  </button>
                )}
              </div>

              <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {results.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40">
                    <FileText size={40} className="opacity-20 mb-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Chưa có dữ liệu...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar">
                    {results.map((item, i) => (
                      <div key={i} className="p-6 hover:bg-slate-50/80 transition-all group flex gap-6 items-center">
                         <div className="flex-none w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                           {(i+1).toString().padStart(2, '0')}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-700 text-[15px] leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                              {/* Xử lý hiển thị thông minh nếu title bị rỗng */}
                              {item.title ? item.title : <span className="text-red-300 italic">Selector chưa lấy được text</span>}
                            </h3>
                            <p className="text-[10px] text-slate-400 truncate mt-1 group-hover:text-blue-400 transition-colors italic">
                              {item.url}
                            </p>
                         </div>
                         <a 
                            href={item.url} target="_blank" rel="noreferrer"
                            className="text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all p-2"
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

export default BrowserCrawlerView;