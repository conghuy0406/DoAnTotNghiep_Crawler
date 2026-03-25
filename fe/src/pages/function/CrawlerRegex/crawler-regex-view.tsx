import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Fingerprint, Globe, Search, Loader2, Play, 
  Copy, Trash2, FileText, ExternalLink, HelpCircle, Zap, Save 
} from 'lucide-react';
// ✅ IMPORT HÀM LƯU TỪ TRẠM THU GOM API
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const RegexUserWhiteView: React.FC = () => {
  const [url, setUrl] = useState('');
  const [regex, setRegex] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // ✅ 1. STATE CHỨA DANH SÁCH NGUỒN REGEX ĐÃ LƯU
  const [savedSources, setSavedSources] = useState<any[]>([]);

  // ✅ 2. TẢI CẤU HÌNH KHI MỞ TRANG
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/v1/sources/');
        // Lọc ra các nguồn có phương pháp là REGEX
        const filtered = res.data.filter((s: any) => s.crawl_method === 'REGEX');
        setSavedSources(filtered);
      } catch (error) {
        console.error("Lỗi tải danh sách nguồn:", error);
      }
    };
    fetchSources();
  }, []);

  // ✅ 3. HÀM XỬ LÝ KHI CHỌN NGUỒN
  const handleSelectSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setUrl(''); setRegex('');
      return;
    }
    const source = savedSources.find(s => s._id === selectedId);
    if (source) {
      setUrl(source.search_url_template || '');
      // Nguồn Regex lưu pattern ở thuộc tính regex_pattern
      setRegex(source.regex_pattern || '');
    }
  };

  // ==========================================
  // HÀM CHẠY KIỂM THỬ REGEX
  // ==========================================
  const handleExecute = async () => {
    if (!url || !regex) {
      alert("Hào ơi, điền đầy đủ URL và biểu thức Regex đã nhé!");
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/v1/crawl-test/regex', 
        { url, regex_pattern: regex },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.status === "success") setResults(res.data.data || []);
    } catch (err) { 
      console.error(err); 
      alert("Có lỗi xảy ra khi kết nối server!");
    } finally { 
      setLoading(false); 
    }
  };

  // ==========================================
  // HÀM LƯU CẤU HÌNH REGEX
  // ==========================================
  const handleSaveConfig = () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}

    saveSourceConfigToServer({
      base_url: baseUrl,
      search_url_template: url,
      crawl_method: "REGEX", // Phân loại chuẩn Regex
      regex_pattern: regex   // Lưu biểu thức Regex
    });
  };

  // Hàm điền mẫu nhanh
  const fillSample = () => {
    setUrl('https://timkiem.vnexpress.net/?q=ai');
    setRegex('href="(https://vnexpress\\.net/[^"#]+\\.html)".*?title="([^"]+)"');
  };

  const parseItem = (item: any) => {
    if (Array.isArray(item)) return { url: item[0], title: item[1] };
    if (item.url && item.title) return item;
    if (item.match_data && Array.isArray(item.match_data)) {
      return { url: item.match_data[0], title: item.match_data[1] };
    }
    return { url: "N/A", title: "Không tìm thấy nội dung" };
  };

  const handleCopyAll = () => {
    const text = results.map(item => {
      const p = parseItem(item);
      return `${p.title}\n${p.url}`;
    }).join('\n\n');
    navigator.clipboard.writeText(text);
    alert("Đã sao chép tất cả kết quả vào bộ nhớ tạm!");
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Crawler Regex" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* Header Section */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Fingerprint size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Regex Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Hệ thống trích xuất dữ liệu v3.0
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={fillSample}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[11px] font-black uppercase tracking-tighter hover:bg-amber-100 transition-all active:scale-95 shadow-sm"
              >
                <Zap size={14} fill="currentColor" /> Dùng thử mẫu
              </button>
              <button 
                onClick={() => {setUrl(''); setRegex(''); setResults([]);}} 
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                title="Xóa tất cả"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            
            {/* Cột trái: Form nhập liệu */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                
                {/* 📂 TẢI CẤU HÌNH ĐÃ LƯU */}
                <div className="space-y-1 mb-6 border-b border-indigo-50 pb-6">
                  <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1">
                    📂 Tải cấu hình Regex đã lưu
                  </label>
                  <select 
                    onChange={handleSelectSource}
                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl py-3 px-4 text-sm font-bold text-indigo-700 outline-none focus:bg-indigo-50 focus:border-indigo-300 transition-all cursor-pointer"
                  >
                    <option value="">--- Chọn nguồn để tải lại Form ---</option>
                    {savedSources.map(src => (
                      <option key={src._id} value={src._id}>
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-6">
                  {/* Nhập URL */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-3 ml-1">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">URL Mục Tiêu</label>
                      <span title="Dán link website bạn muốn lấy dữ liệu vào đây">
                        <HelpCircle size={14} className="text-slate-300 cursor-help hover:text-indigo-400 transition-colors" />
                      </span>
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        placeholder="Ví dụ: https://vnexpress.net/cong-nghe"
                        value={url} onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Nhập Regex */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-3 ml-1">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Biểu thức Regex</label>
                      <span className="text-[9px] font-bold text-indigo-400 italic">Cần 2 nhóm ( )</span>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-4 top-6 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      <textarea 
                        rows={4}
                        placeholder='Ví dụ: href="([^"]+)".*?>([^<]+)</a>'
                        value={regex} onChange={(e) => setRegex(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 text-sm font-mono text-indigo-600 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner resize-none"
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400 italic px-2 leading-relaxed">
                      Dùng ngoặc đơn <code className="text-indigo-500 font-bold">()</code>: Nhóm 1 là Liên kết, Nhóm 2 là Tiêu đề.
                    </p>
                  </div>
                </div>

                {/* HAI NÚT NẰM NGANG */}
                <div className="flex gap-3">
                  <button 
                    onClick={handleExecute} disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG XỬ LÝ..." : "THỰC THI"}</span>
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

              {/* Tips Section */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[30px] flex gap-4">
                 <div className="w-10 h-10 bg-white rounded-full flex-none flex items-center justify-center text-indigo-500 shadow-sm">
                   <FileText size={18} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[13px] text-indigo-900 font-bold uppercase tracking-tighter">Mẹo nhỏ:</p>
                    <p className="text-[12px] text-indigo-900/60 leading-relaxed font-medium italic">
                      Kết quả sẽ tự động tách thành Tiêu đề và Link để Hào dễ dàng xuất Excel hoặc lưu trữ.
                    </p>
                 </div>
              </div>
            </div>

            {/* Cột phải: Danh sách kết quả */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  Dữ liệu tìm thấy <span className="bg-indigo-100 text-indigo-600 px-3 py-0.5 rounded-full text-[10px]">{results.length}</span>
                </h2>
                {results.length > 0 && (
                  <button onClick={handleCopyAll} className="text-[11px] font-black text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all uppercase tracking-tighter border border-transparent hover:border-indigo-100">
                    <Copy size={14} /> Sao chép tất cả
                  </button>
                )}
              </div>

              <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {results.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-slate-200">
                      <Search size={48} className="opacity-10" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Hệ thống đang sẵn sàng...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar h-full">
                    {results.map((item, i) => {
                      const p = parseItem(item);
                      return (
                        <div key={i} className="p-7 hover:bg-slate-50/80 transition-all group flex gap-6 items-start border-l-4 border-transparent hover:border-indigo-500">
                           <div className="flex-none w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner uppercase">
                             {(i+1).toString().padStart(2, '0')}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 text-[15px] leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 uppercase tracking-tight">
                                {p.title}
                              </h3>
                              <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-500 transition-colors overflow-hidden">
                                <ExternalLink size={12} className="flex-none" />
                                <span className="text-[11px] font-medium truncate italic underline-offset-4 group-hover:underline">
                                  {p.url}
                                </span>
                              </div>
                           </div>
                           <a 
                              href={p.url} target="_blank" rel="noreferrer"
                              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 hover:bg-indigo-50 hover:text-indigo-500 transition-all shadow-sm"
                              title="Xem liên kết gốc"
                           >
                              <ExternalLink size={16} />
                           </a>
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

export default RegexUserWhiteView;