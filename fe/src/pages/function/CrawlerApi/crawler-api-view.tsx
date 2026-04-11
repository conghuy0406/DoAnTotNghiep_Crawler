import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { 
  Globe, Loader2, Play, Trash2, ExternalLink, Zap, Save, Settings2, FileJson, Copy, Code, Lightbulb, Info,
  Sparkles, Bot, X, BookOpen
} from 'lucide-react';
import { saveSourceConfigToServer } from '../../../api/sourceApi'; 

const CrawlerApiView: React.FC = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role') || 'user'; 
  const [isGlobal, setIsGlobal] = useState(false); 

  const [apiUrl, setApiUrl] = useState(''); 
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiHeaders, setApiHeaders] = useState('{\n  \n}');
  const [apiBody, setApiBody] = useState('{\n  \n}');
  const [isExpertMode, setIsExpertMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [foundTotal, setFoundTotal] = useState<number | null>(null);
  const [savedSources, setSavedSources] = useState<any[]>([]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/sources/', { headers: { Authorization: `Bearer ${token}` } });
        const filtered = res.data.filter((s: any) => s.crawl_method === 'API');
        setSavedSources(filtered);
      } catch (error) { console.error("Lỗi tải danh sách nguồn:", error); }
    };
    fetchSources();
  }, []);

  const systemSources = savedSources.filter(src => src.is_global === true);
  const mySources = savedSources.filter(src => src.is_global !== true);

  const handleSelectSource = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) { setApiUrl(''); setApiMethod('GET'); setApiHeaders('{\n  \n}'); setApiBody('{\n  \n}'); return; }
    
    const source = savedSources.find(s => s._id === selectedId);
    if (source) {
      setApiUrl(source.search_url_template || ''); setApiMethod(source.api_config?.method || 'GET');
      setApiHeaders(source.api_config?.headers && Object.keys(source.api_config.headers).length > 0 ? JSON.stringify(source.api_config.headers, null, 2) : '{\n  \n}');
      setApiBody(source.api_config?.body && Object.keys(source.api_config.body).length > 0 ? JSON.stringify(source.api_config.body, null, 2) : '{\n  \n}');
    }
  };

  const findLargestArray = (obj: any): any[] => {
    if (Array.isArray(obj)) return obj;
    if (obj !== null && typeof obj === 'object') {
        let largestArray: any[] = [];
        for (const key in obj) {
            const found = findLargestArray(obj[key]);
            if (Array.isArray(found) && found.length > largestArray.length) { largestArray = found; }
        }
        return largestArray;
    }
    return [];
  };

  const handleExecute = async () => {
    if (!apiUrl) return alert("Vui lòng nhập đường dẫn API!");
    let parsedHeaders = undefined; let parsedBody = undefined;
    if (isExpertMode) {
        try { if (apiHeaders.trim() && apiHeaders.trim() !== '{}' && apiHeaders.trim() !== '{\n  \n}') parsedHeaders = JSON.parse(apiHeaders); } 
        catch (e) { return alert("Headers phải là JSON hợp lệ!"); }
        try { if (apiBody.trim() && apiBody.trim() !== '{}' && apiBody.trim() !== '{\n  \n}') parsedBody = JSON.parse(apiBody); } 
        catch (e) { return alert("Body Payload phải là JSON hợp lệ!"); }
    }
    setLoading(true); setNewsResults([]); setFoundTotal(null); setAiReport(null);

    try {
      const token = localStorage.getItem('token');
      const payloadData = { api_url: apiUrl, api_method: apiMethod, headers: parsedHeaders, payload: parsedBody };
      const res = await axios.post('/api/v1/crawl-test/api', payloadData, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data && res.data.status === "success") {
        let rawData = res.data.data;
        let dataToProcess = findLargestArray(rawData);
        if (!dataToProcess || dataToProcess.length === 0) dataToProcess = rawData && typeof rawData === 'object' ? [rawData] : [];
        if (dataToProcess.length > 0) {
            const cleanedData = dataToProcess.map((item: any) => ({
              title: item.title || item.name || item.headline || item.city || `Dữ liệu ID: ${item.id || 'N/A'}`,
              link: item.url || item.link || item.href || "#",
              description: item.description || item.summary || item.body || "Dữ liệu JSON", rawData: item
            }));
            setNewsResults(cleanedData); setFoundTotal(cleanedData.length);
        } else {
            alert("API trả về thành công nhưng không tìm thấy mảng dữ liệu.");
            setNewsResults([]); setFoundTotal(0);
        }
      } else { alert("Lỗi Backend: " + (res.data?.error || "Không xác định")); }
    } catch (err: any) { alert("Lỗi kết nối! " + (err.response?.data?.detail || "")); } 
    finally { setLoading(false); }
  };

  const handleAIAnalysis = async () => {
    if (newsResults.length === 0) return alert("Chưa có dữ liệu để phân tích!");
    setAiLoading(true); setAiReport(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/ai/analyze-crawl', { url: apiUrl, data: newsResults.map(n => n.rawData) }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.status === "success") setAiReport(res.data.analysis);
    } catch (err: any) { alert("Lỗi AI: " + (err.response?.data?.detail || err.message)); } 
    finally { setAiLoading(false); }
  };

  const handleSaveConfig = async () => {
    let baseUrl = "https://unknown.com";
    try { baseUrl = new URL(apiUrl).origin; } catch (e) {}

    let parsedHeaders = {}; let parsedBody = {};
    if (isExpertMode) {
        try { if (apiHeaders.trim() && apiHeaders.trim() !== '{\n  \n}') parsedHeaders = JSON.parse(apiHeaders); } catch (e) {}
        try { if (apiBody.trim() && apiBody.trim() !== '{\n  \n}') parsedBody = JSON.parse(apiBody); } catch (e) {}
    }

    try {
      await saveSourceConfigToServer({
        name: `API Source (${new URL(apiUrl).hostname})`, base_url: baseUrl, search_url_template: apiUrl, crawl_method: "API", 
        is_global: isGlobal,
        api_config: { method: apiMethod, headers: parsedHeaders, body: parsedBody }
      });
      alert("Đã lưu cấu hình API thành công!");
    } catch (error: any) { alert("Lỗi khi lưu cấu hình!"); }
  };

  const formatJsonInputs = () => {
      try {
          if (apiHeaders.trim() !== '{\n  \n}' && apiHeaders.trim() !== '') setApiHeaders(JSON.stringify(JSON.parse(apiHeaders), null, 4));
          if (apiBody.trim() !== '{\n  \n}' && apiBody.trim() !== '') setApiBody(JSON.stringify(JSON.parse(apiBody), null, 4));
      } catch (e) { alert("Lỗi: Dữ liệu hiện tại không phải là JSON hợp lệ để Format."); }
  };

  const handleCopyAll = () => {
    const text = newsResults.map(item => JSON.stringify(item.rawData, null, 2)).join('\n\n');
    navigator.clipboard.writeText(text); alert("Đã sao chép tất cả chuỗi JSON vào bộ nhớ tạm!");
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Cào API & JSON" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600"><Zap size={32} strokeWidth={2.5} /></div>
              <div><h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">API Crawler</h1><p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Hệ thống trích xuất dữ liệu thô (JSON)</p></div>
            </div>
            <div className="flex gap-3"><button onClick={() => {setApiUrl('https://jsonplaceholder.typicode.com/posts'); setApiMethod('GET'); setIsExpertMode(false);}} className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 hover:bg-amber-100 transition-all shadow-sm font-black text-[11px] uppercase tracking-widest flex items-center gap-2">Mẫu API</button><button onClick={() => { setNewsResults([]); setFoundTotal(null); setAiReport(null);}} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-red-500 transition-all shadow-sm" title="Xóa kết quả"><Trash2 size={20} /></button></div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0">
              
              {/* 🌟 BANNER GIẢI THÍCH MỚI */}
              <div className="bg-[#4f46e5] rounded-[32px] p-6 shadow-lg shadow-indigo-200/50 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10"><FileJson size={120} /></div>
                <div className="relative z-10">
                  <h3 className="font-black text-[15px] flex items-center gap-2 mb-2"><Lightbulb size={18} className="text-yellow-300" /> Kết nối ngầm API</h3>
                  <p className="text-[12px] font-medium text-indigo-50 leading-relaxed mb-4">Giao tiếp trực tiếp với Server để lấy mảng dữ liệu (JSON). <strong className="text-white">Phù hợp nhất:</strong> Các trang web giấu dữ liệu, tải vô hạn cuộn trang.</p>
                  <button onClick={() => navigate('/guide')} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <BookOpen size={14}/> Xem hướng dẫn chi tiết
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                <div className="space-y-1 mb-6 border-b border-slate-100 pb-6">
                  <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1">📂 Template API có sẵn</label>
                  <select onChange={handleSelectSource} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl py-4 px-4 text-sm font-bold text-indigo-700 outline-none focus:bg-indigo-50 focus:border-indigo-300 transition-all cursor-pointer shadow-inner">
                    <option value="">--- Chọn nguồn API để bóc tách ---</option>
                    {systemSources.length > 0 && (<optgroup label="🌟 MẪU HỆ THỐNG (MẶC ĐỊNH)">{systemSources.map(src => (<option key={src._id} value={src._id}>{src.name}</option>))}</optgroup>)}
                    {mySources.length > 0 && (<optgroup label="📁 MẪU CỦA RIÊNG TÔI">{mySources.map(src => (<option key={src._id} value={src._id}>{src.name}</option>))}</optgroup>)}
                  </select>
                </div>

                <div className="flex gap-3">
                    <select value={apiMethod} onChange={(e) => setApiMethod(e.target.value)} className="bg-slate-50 text-indigo-600 font-black px-4 py-4 rounded-2xl outline-none border border-slate-100 text-sm cursor-pointer"><option value="GET">GET</option><option value="POST">POST</option></select>
                    <div className="relative group flex-1"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" /><input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="VD: https://api.domain.com/data" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner text-slate-700"/></div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-6">
                  <div className="flex items-center gap-3"><Settings2 size={18} className="text-slate-400" /><div><h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Chế độ Kỹ sư</h3><p className="text-[9px] text-slate-400 font-bold mt-0.5">Tự cấu hình Headers & Body</p></div></div>
                  <button onClick={() => setIsExpertMode(!isExpertMode)} className={`w-12 h-6 rounded-full transition-colors relative flex items-center cursor-pointer ${isExpertMode ? 'bg-indigo-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${isExpertMode ? 'translate-x-7' : 'translate-x-1'}`}></div></button>
                </div>

                <div className={`space-y-5 overflow-hidden transition-all duration-500 ease-in-out ${isExpertMode ? 'max-h-[600px] opacity-100 pt-4 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end"><label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Code size={12}/> Headers (JSON)</label><button onClick={formatJsonInputs} className="text-[9px] text-indigo-400 hover:text-indigo-600 font-bold uppercase underline">Format JSON</button></div>
                    <textarea value={apiHeaders} onChange={(e) => setApiHeaders(e.target.value)} rows={4} className="w-full bg-slate-900 text-emerald-400 border-none rounded-xl p-4 text-[12px] font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all custom-scrollbar"/>
                    <div className="space-y-1"><label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center gap-2"><FileJson size={12}/> Body Payload (JSON)</label><textarea value={apiBody} onChange={(e) => setApiBody(e.target.value)} rows={4} className="w-full bg-slate-900 text-orange-300 border-none rounded-xl p-4 text-[12px] font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all custom-scrollbar"/></div>
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex items-center gap-2 mb-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      <input type="checkbox" id="globalCheckApi" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer"/>
                      <label htmlFor="globalCheckApi" className="text-[11px] font-black uppercase tracking-widest text-indigo-700 cursor-pointer">🌟 Lưu làm Mẫu Hệ Thống</label>
                    </div>
                  )}

                  <button onClick={handleSaveConfig} disabled={loading} className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[11px] uppercase tracking-widest"><Save size={16} /> Lưu thành Template API mới</button>
                </div>

                <button onClick={handleExecute} disabled={loading} className="w-full bg-slate-800 hover:bg-indigo-600 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95 mt-4">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  <span className="tracking-widest uppercase text-[12px]">{loading ? "ĐANG KẾT NỐI API..." : "GỬI REQUEST"}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-4">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Phản hồi JSON {foundTotal !== null && <span className="text-indigo-600 ml-2 bg-indigo-50 px-2 py-0.5 rounded-full">({foundTotal})</span>}</h2>
                  {newsResults.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleAIAnalysis} disabled={aiLoading} className="text-[10px] font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-2 rounded-xl transition-all uppercase tracking-tighter shadow-md shadow-fuchsia-200 flex items-center gap-2 disabled:opacity-50">
                        {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {aiLoading ? "AI ĐANG ĐỌC..." : "AI PHÂN TÍCH"}
                      </button>
                      <button onClick={handleCopyAll} className="text-[11px] font-black text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all uppercase tracking-tighter"><Copy size={14} /> SAO CHÉP TẤT CẢ</button>
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

              <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {newsResults.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40"><div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100"><FileJson size={32} className="opacity-20" /></div><span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Chưa có kết quả phản hồi</span></div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar p-6 space-y-6">
                    {newsResults.map((item, index) => (
                      <div key={index} className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-7 flex flex-col gap-5 group hover:border-indigo-200 transition-all">
                        <div className="flex gap-7 items-start"><div className="w-16 h-16 bg-indigo-50/50 rounded-2xl flex-shrink-0 flex items-center justify-center text-indigo-500 shadow-inner"><Zap className="w-6 h-6 opacity-60" /></div><div className="flex-1 pt-1"><div className="flex items-center gap-3 mb-2.5"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5">Status: 200 OK</span><div className="w-1 h-1 rounded-full bg-slate-200"></div><span className="text-[9px] font-bold text-emerald-500 uppercase">Auto-Parsed</span></div><h3 className="font-bold text-slate-800 leading-tight mb-2 line-clamp-1 text-[15px] group-hover:text-indigo-600 transition-colors uppercase">{item.title}</h3>{item.description && (<p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed italic">{item.description}</p>)}</div>{item.link !== "#" && (<a href={item.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-slate-50 text-slate-400 p-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><ExternalLink className="w-5 h-5" /></a>)}</div>
                        <div className="bg-[#0F172A] rounded-2xl p-5 overflow-x-auto border border-slate-800 shadow-inner max-h-80 overflow-y-auto custom-scrollbar"><div className="flex justify-end mb-2"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-md flex items-center gap-2"><Code size={10}/> Payload Data</span></div><pre className="text-[12px] text-emerald-400 font-mono leading-relaxed">{JSON.stringify(item.rawData, null, 2)}</pre></div>
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

export default CrawlerApiView;