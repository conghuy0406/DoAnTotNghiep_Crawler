import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Fingerprint, Globe, Search, Loader2, Play, 
  Copy, Trash2, ExternalLink, HelpCircle, Zap, Save, Settings2, Code, Lightbulb, Info
} from 'lucide-react';
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const RegexUserWhiteView: React.FC = () => {
  const [url, setUrl] = useState('');
  const [regex, setRegex] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // 🌟 STATE CÔNG TẮC CHUYÊN GIA
  const [isExpertMode, setIsExpertMode] = useState(false);

  // STATE CHỨA DANH SÁCH NGUỒN REGEX ĐÃ LƯU
  const [savedSources, setSavedSources] = useState<any[]>([]);

  // TẢI CẤU HÌNH KHI MỞ TRANG
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/sources/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filtered = res.data.filter((s: any) => s.crawl_method === 'REGEX');
        setSavedSources(filtered);
      } catch (error) {
        console.error("Lỗi tải danh sách nguồn:", error);
      }
    };
    fetchSources();
  }, []);

  // HÀM XỬ LÝ KHI CHỌN NGUỒN
  const handleSelectSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setUrl(''); setRegex('');
      return;
    }
    const source = savedSources.find(s => s._id === selectedId);
    if (source) {
      setUrl(source.search_url_template || '');
      setRegex(source.regex_pattern || '');
    }
  };

  // ==========================================
  // HÀM CHẠY KIỂM THỬ REGEX
  // ==========================================
  const handleExecute = async () => {
    if (!url) return alert("Vui lòng nhập URL mục tiêu!");
    if (!regex) return alert("Hệ thống cần Biểu thức Regex để chạy! Vui lòng chọn Template hoặc bật 'Chế độ Kỹ sư' để tự nhập.");

    setLoading(true);
    setResults([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/crawl-test/regex', 
        { url, regex_pattern: regex },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.status === "success") setResults(res.data.data || []);
      else alert("Lỗi Backend: " + (res.data.message || res.data.error || "Không xác định"));
    } catch (err: any) { 
      console.error(err); 
      alert("Có lỗi xảy ra khi kết nối server! " + (err.response?.data?.detail || ""));
    } finally { 
      setLoading(false); 
    }
  };

  // ==========================================
  // HÀM LƯU CẤU HÌNH REGEX
  // ==========================================
  const handleSaveConfig = async () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(url).origin; } catch (e) {}

    try {
      await saveSourceConfigToServer({
        name: `Regex Source (${new URL(url).hostname})`,
        base_url: baseUrl,
        search_url_template: url,
        crawl_method: "REGEX", 
        regex_pattern: regex   
      });
      alert("Đã lưu cấu hình Regex thành công vào kho Nguồn!");
    } catch (error) {
      console.error("Lỗi lưu cấu hình:", error);
      alert("Lỗi khi lưu cấu hình! Vui lòng kiểm tra lại phiên đăng nhập.");
    }
  };

  const fillSample = () => {
    setUrl('https://timkiem.vnexpress.net/?q=ai');
    setRegex('href="(https://vnexpress\\.net/[^"#]+\\.html)".*?title="([^"]+)"');
    setIsExpertMode(true); 
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
      <Sidebar activePage="Trích Xuất Regex" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-amber-600">
                <Fingerprint size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Regex Crawler</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span> Khớp mẫu dữ liệu siêu tốc
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={fillSample}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[11px] font-black uppercase tracking-tighter hover:bg-amber-100 transition-all active:scale-95 shadow-sm"
              >
                <Zap size={14} fill="currentColor" /> Mẫu VnExpress
              </button>
              <button 
                onClick={() => {setUrl(''); setRegex(''); setResults([]);}} 
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                title="Xóa tất cả"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            
            {/* CỘT TRÁI: FORM NHẬP LIỆU */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0">
              
              {/* 🌟 THẺ HƯỚNG DẪN THÔNG MINH (SMART INFO CARD - AMBER THEME) 🌟 */}
              <div className="bg-amber-500 rounded-[32px] p-6 shadow-lg shadow-amber-200/50 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Fingerprint size={120} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-black text-[15px] flex items-center gap-2 mb-3">
                    <Lightbulb size={18} className="text-yellow-100" /> Trích xuất Regex là gì?
                  </h3>
                  <p className="text-[12px] font-medium text-amber-50 leading-relaxed mb-4">
                    Regex là công cụ <strong className="text-white">quét và nhận diện</strong> các đoạn văn bản có tính lặp lại (như SĐT, Link bài viết). Bằng cách dùng dấu ngoặc đơn <code className="bg-amber-600 px-1 rounded">()</code>, bạn có thể "bắt" chính xác chữ nằm bên trong.
                  </p>
                  <div className="bg-[#78350f]/40 rounded-xl p-3 font-mono text-[11px] border border-amber-300/30">
                    <div className="text-slate-300 mb-1">Nguồn: ...href="<span className="text-blue-300">link_bai</span>"&gt;<span className="text-emerald-300">Tên bài</span>&lt;/a&gt;...</div>
                    <div className="border-t border-amber-600/50 my-2"></div>
                    <div className="text-amber-200">Regex: href="<span className="text-blue-300 bg-blue-900/30 px-1 rounded">(.*?)</span>"&gt;<span className="text-emerald-300 bg-emerald-900/30 px-1 rounded">(.*?)</span>&lt;/a&gt;</div>
                  </div>
                  <p className="text-[10px] font-bold text-amber-100 mt-3 flex items-center gap-1.5 uppercase tracking-widest">
                    <Info size={12} /> Cần bật Chế độ Kỹ Sư để viết Regex
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                
                {/* 📂 TẢI CẤU HÌNH ĐÃ LƯU */}
                <div className="space-y-1 mb-6 border-b border-amber-50 pb-6">
                  <label className="text-[11px] font-black text-amber-600 uppercase tracking-widest ml-1">
                    📂 Template Regex có sẵn
                  </label>
                  <select 
                    onChange={handleSelectSource}
                    className="w-full bg-amber-50/50 border border-amber-100 rounded-2xl py-4 px-4 text-sm font-bold text-amber-700 outline-none focus:bg-amber-50 focus:border-amber-300 transition-all cursor-pointer shadow-inner"
                  >
                    <option value="">--- Chọn nguồn để bóc tách ---</option>
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
                        <HelpCircle size={14} className="text-slate-300 cursor-help hover:text-amber-500 transition-colors" />
                      </span>
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                      <input 
                        placeholder="Ví dụ: https://vnexpress.net/cong-nghe"
                        value={url} onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-amber-400 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* 🌟 CÔNG TẮC BẬT TẮT CHẾ ĐỘ KỸ SƯ */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-6">
                    <div className="flex items-center gap-3">
                      <Settings2 size={18} className="text-slate-400" />
                      <div>
                        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Chế độ Kỹ sư</h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Tự nhập Biểu thức Regex</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsExpertMode(!isExpertMode)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center cursor-pointer ${isExpertMode ? 'bg-amber-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${isExpertMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                  {/* KHU VỰC GIẤU ĐI - CHỈ HIỆN KHI BẬT EXPERT MODE */}
                  <div className={`space-y-5 overflow-hidden transition-all duration-500 ease-in-out ${isExpertMode ? 'max-h-[400px] opacity-100 pt-2 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                    <div className="group">
                      <div className="flex justify-between items-center mb-3 ml-1">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                           <Code size={12}/> Biểu thức Regex
                        </label>
                        <span className="text-[9px] font-bold text-slate-400 italic">Cần 2 nhóm ( )</span>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-4 top-6 w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                        <textarea 
                          rows={4}
                          placeholder='Ví dụ: href="([^"]+)".*?>([^<]+)</a>'
                          value={regex} onChange={(e) => setRegex(e.target.value)}
                          className="w-full bg-slate-900 text-emerald-400 border border-slate-800 rounded-2xl py-5 pl-12 pr-4 text-sm font-mono outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-inner resize-none custom-scrollbar"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveConfig} disabled={loading}
                      className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[11px] uppercase tracking-widest"
                    >
                      <Save size={16} /> Lưu thành Template mới
                    </button>
                  </div>
                </div>

                {/* NÚT THỰC THI CHÍNH */}
                <button 
                  onClick={handleExecute} disabled={loading}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95 mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG XỬ LÝ..." : "THỰC THI TRÍCH XUẤT"}</span>
                </button>

              </div>
            </div>

            {/* CỘT PHẢI: DANH SÁCH KẾT QUẢ */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  Dữ liệu tìm thấy <span className="bg-amber-100 text-amber-600 px-3 py-0.5 rounded-full text-[10px]">{results.length}</span>
                </h2>
                {results.length > 0 && (
                  <button onClick={handleCopyAll} className="text-[11px] font-black text-amber-600 flex items-center gap-2 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all uppercase tracking-tighter border border-transparent hover:border-amber-100">
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
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Chọn Template hoặc Bật Chế độ Kỹ Sư</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar h-full">
                    {results.map((item, i) => {
                      const p = parseItem(item);
                      return (
                        <div key={i} className="p-7 hover:bg-slate-50/80 transition-all group flex gap-6 items-start border-l-4 border-transparent hover:border-amber-500">
                           <div className="flex-none w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black text-slate-300 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm uppercase">
                             {(i+1).toString().padStart(2, '0')}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 text-[15px] leading-snug mb-2 group-hover:text-amber-600 transition-colors line-clamp-2 uppercase tracking-tight">
                                {p.title}
                              </h3>
                              <div className="flex items-center gap-2 text-slate-400 group-hover:text-amber-500 transition-colors overflow-hidden">
                                <ExternalLink size={12} className="flex-none" />
                                <span className="text-[11px] font-medium truncate italic underline-offset-4 group-hover:underline">
                                  {p.url}
                                </span>
                              </div>
                           </div>
                           <a 
                              href={p.url} target="_blank" rel="noreferrer"
                              className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
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