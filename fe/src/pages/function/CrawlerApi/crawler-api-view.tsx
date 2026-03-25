import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { Loader2, Globe, ExternalLink, Newspaper, Zap, Play, Save } from 'lucide-react';
// ✅ IMPORT TRẠM THU GOM API ĐỂ LƯU CẤU HÌNH
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const CrawlerApiView: React.FC = () => {
  // Thay keyword bằng apiUrl cho đúng chuẩn API
  const [apiUrl, setApiUrl] = useState('https://jsonplaceholder.typicode.com/posts'); 
  const [apiMethod, setApiMethod] = useState('GET');
  const [loading, setLoading] = useState(false);
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [foundTotal, setFoundTotal] = useState<number | null>(null);

  // ==========================================
  // 1. HÀM THỰC THI (Đã sửa lại gọi đúng API)
  // ==========================================
  const handleExecute = async () => {
    if (!apiUrl) return alert("Vui lòng nhập đường dẫn API");
    setLoading(true);
    setNewsResults([]); 
    setFoundTotal(null);

    try {
      const token = localStorage.getItem('token');
      
      // ✅ Payload đúng chuẩn API theo Swagger BE của Hào
      const payloadData = {
        api_url: apiUrl,
        api_method: apiMethod
      };

      // ✅ Gọi đúng endpoint API test
      const res = await axios.post('http://localhost:8000/api/v1/crawl-test/api', payloadData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.status === "success") {
        let rawData = res.data.data;
        
        // Backend (hàm auto_extract_json) đã trả về mảng [{title, url}]. Không cần DOMParser HTML nữa!
        if (Array.isArray(rawData)) {
            const cleanedData = rawData.map((item: any) => ({
              title: item.title || item.name || "Dữ liệu API không có tiêu đề",
              link: item.url || item.link || item.href || "#",
              description: "Dữ liệu được bóc tách tự động từ luồng JSON API.",
              image: "" 
            }));
            setNewsResults(cleanedData);
            setFoundTotal(cleanedData.length);
        } else {
            alert("API trả về thành công nhưng không phải dạng danh sách (Array).");
        }
      } else {
         alert("Lỗi Backend: " + (res.data.error || "Không xác định"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi kết nối Backend! " + (err.response?.data?.detail || ""));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. HÀM LƯU CẤU HÌNH API
  // ==========================================
  const handleSaveConfig = () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(apiUrl).origin; } catch (e) {}

    saveSourceConfigToServer({
      base_url: baseUrl,
      search_url_template: apiUrl,
      crawl_method: "API", 
      api_config: {
        method: apiMethod,
        headers: {},
        body: {}
      }
    });
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden text-slate-700">
      <Sidebar activePage="Crawler API" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar no-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-3.5 rounded-2xl text-white">
                     <Zap className="w-6 h-6" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black uppercase italic tracking-tight text-slate-900">Crawler <span className="text-indigo-600"> Api</span></h1>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Hệ thống trích xuất dữ liệu JSON trực tiếp</p>
                  </div>
               </div>
            </div>

            {/* THANH ĐIỀU KHIỂN (Đã thêm nút GET/POST và Nút LƯU) */}
            <div className="bg-white p-3 rounded-[30px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
              
              <select 
                value={apiMethod} 
                onChange={(e) => setApiMethod(e.target.value)}
                className="bg-indigo-50 text-indigo-700 font-bold px-6 py-5 rounded-[22px] outline-none appearance-none cursor-pointer border border-indigo-100"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>

              <div className="flex-1 relative w-full">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="Nhập đường dẫn API (VD: https://jsonplaceholder.typicode.com/posts)"
                  className="w-full bg-slate-50/50 border-none rounded-[22px] py-5 pl-16 pr-8 font-bold text-slate-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleExecute}
                    disabled={loading}
                    className="flex-1 md:flex-none bg-slate-900 text-white font-black px-8 py-5 rounded-[22px] text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2.5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {loading ? "Đang xử lý..." : "THỰC THI"}
                  </button>

                  <button 
                    onClick={handleSaveConfig}
                    disabled={loading}
                    className="flex-1 md:flex-none bg-emerald-500 text-white font-black px-6 py-5 rounded-[22px] hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center"
                    title="Lưu cấu hình API này"
                  >
                    <Save className="w-5 h-5" />
                  </button>
              </div>
            </div>

            {/* KẾT QUẢ TRẢ VỀ */}
            <div className="space-y-6">
              {foundTotal !== null && (
                <div className="flex items-center gap-4 px-2">
                  <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full">
                    KẾT QUẢ API ({foundTotal})
                  </span>
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                </div>
              )}

              {newsResults.length > 0 ? (
                <div className="space-y-6 pb-12">
                  {newsResults.map((item, index) => (
                    <div key={index} className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-7 flex gap-7 items-center group hover:shadow-xl hover:border-indigo-100 transition-all">
                      <div className="w-32 h-24 bg-slate-100 rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center text-indigo-100 bg-indigo-50/20">
                          <Newspaper className="w-8 h-8 opacity-40" />
                      </div>

                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-3 mb-2.5">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" /> Nguồn API
                           </span>
                           <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                           <span className="text-[9px] font-bold text-emerald-400">Trích xuất thành công</span>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 leading-tight mb-3 line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic">
                          {item.description}
                        </p>
                      </div>

                      <a 
                         href={item.link} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex-shrink-0 bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                      >
                         <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : !loading && (
                <div className="py-24 flex flex-col items-center justify-center opacity-40 bg-white rounded-[40px] border border-slate-100">
                   <div className="bg-slate-50 p-7 rounded-full mb-5 text-slate-300">
                      <Zap className="w-12 h-12" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Dán Link API và nhấn Thực thi</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CrawlerApiView;