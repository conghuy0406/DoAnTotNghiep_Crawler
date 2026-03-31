// import React, { useState } from 'react';
// import { TabType } from './types';
// // Import API (Bạn đảm bảo file src/api/crawlApi.ts đã có các hàm này như hướng dẫn trước)
// import { 
//     testCrawlApi, testCrawlRegex, testCrawlBrowser, 
//     testCrawlHtml, testCrawlSmartAuto 
// } from '../../../api/crawlApi';

// const TestCrawlerView: React.FC = () => {
//     const [activeTab, setActiveTab] = useState<TabType>('API');
//     const [loading, setLoading] = useState<boolean>(false);
//     const [result, setResult] = useState<any>(null);

//     // --- State dùng chung cho tất cả các Form ---
//     const [url, setUrl] = useState(''); // Dùng chung cho Regex, Browser, Html, Smart
    
//     // --- State riêng cho API ---
//     const [apiUrl, setApiUrl] = useState('');
//     const [apiMethod, setApiMethod] = useState('GET');
    
//     // --- State riêng cho Regex ---
//     const [regexPattern, setRegexPattern] = useState('');
    
//     // --- State riêng cho HTML / Browser ---
//     const [postItemSel, setPostItemSel] = useState('');
//     const [titleSel, setTitleSel] = useState('');

//     // Hàm gọi API tương ứng khi bấm nút "Chạy"
//     const handleExecute = async () => {
//         setLoading(true);
//         setResult(null); // Reset kết quả cũ
//         try {
//             let resData;
//             switch (activeTab) {
//                 case 'API':
//                     resData = await testCrawlApi({ api_url: apiUrl, api_method: apiMethod });
//                     break;
//                 case 'REGEX':
//                     resData = await testCrawlRegex({ url, regex_pattern: regexPattern });
//                     break;
//                 case 'BROWSER':
//                     resData = await testCrawlBrowser({ url, post_item_sel: postItemSel, title_sel: titleSel });
//                     break;
//                 case 'HTML':
//                     resData = await testCrawlHtml({ url, post_item_sel: postItemSel, title_sel: titleSel });
//                     break;
//                 case 'SMART':
//                     resData = await testCrawlSmartAuto({ url });
//                     break;
//             }
//             setResult(resData);
//         } catch (error: any) {
//             setResult({ error: "Lỗi Call API: " + error.message });
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Style dùng chung để code đỡ rối
//     const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' as const };
//     const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' };

//     return (
//         <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
//             <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
//                 <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '16px', marginBottom: '24px' }}>
//                     🕷️ Hệ thống Test Crawl (5 API)
//                 </h2>
                
//                 {/* MENU 5 TABS (GIỐNG SWAGGER) */}
//                 <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #1890ff', paddingBottom: '10px' }}>
//                     {['API', 'REGEX', 'BROWSER', 'HTML', 'SMART'].map((tab) => (
//                         <button 
//                             key={tab}
//                             onClick={() => { setActiveTab(tab as TabType); setResult(null); }}
//                             style={{
//                                 padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', border: 'none',
//                                 backgroundColor: activeTab === tab ? '#1890ff' : '#e6f7ff',
//                                 color: activeTab === tab ? '#fff' : '#1890ff',
//                                 borderRadius: '4px'
//                             }}>
//                             {tab === 'API' ? '1. API Request' : 
//                              tab === 'REGEX' ? '2. Regex' : 
//                              tab === 'BROWSER' ? '3. Playwright (Web động)' : 
//                              tab === 'HTML' ? '4. HTML Tĩnh' : '5. Smart Auto'}
//                         </button>
//                     ))}
//                 </div>

//                 <div style={{ display: 'flex', gap: '24px' }}>
//                     {/* CỘT TRÁI: FORM ĐỘNG THEO TAB */}
//                     <div style={{ flex: 1 }}>
                        
//                         {/* FORM 1: API */}
//                         {activeTab === 'API' && (
//                             <div>
//                                 <label style={labelStyle}>Đường dẫn API (api_url):</label>
//                                 <input style={inputStyle} value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.openweathermap.org/..." />
                                
//                                 <label style={labelStyle}>Phương thức (api_method):</label>
//                                 <select style={inputStyle} value={apiMethod} onChange={e => setApiMethod(e.target.value)}>
//                                     <option value="GET">GET</option>
//                                     <option value="POST">POST</option>
//                                 </select>
//                             </div>
//                         )}

//                         {/* FORM 2: REGEX */}
//                         {activeTab === 'REGEX' && (
//                             <div>
//                                 <label style={labelStyle}>Đường dẫn Web (url):</label>
//                                 <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://dantri.com.vn/..." />
                                
//                                 <label style={labelStyle}>Biểu thức Regex (regex_pattern):</label>
//                                 <input style={inputStyle} value={regexPattern} onChange={e => setRegexPattern(e.target.value)} placeholder='href="(.*?)" title="(.*?)"' />
//                             </div>
//                         )}

//                         {/* FORM 3 & 4: BROWSER & HTML */}
//                         {(activeTab === 'BROWSER' || activeTab === 'HTML') && (
//                             <div>
//                                 <label style={labelStyle}>Đường dẫn Web (url):</label>
//                                 <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://vnexpress.net/..." />
                                
//                                 <label style={labelStyle}>CSS Selector Khung bài viết (post_item_sel):</label>
//                                 <input style={inputStyle} value={postItemSel} onChange={e => setPostItemSel(e.target.value)} placeholder=".article-item" />
                                
//                                 <label style={labelStyle}>CSS Selector Tiêu đề (title_sel):</label>
//                                 <input style={inputStyle} value={titleSel} onChange={e => setTitleSel(e.target.value)} placeholder="h3.title a" />
//                             </div>
//                         )}

//                         {/* FORM 5: SMART AUTO */}
//                         {activeTab === 'SMART' && (
//                             <div>
//                                 <label style={labelStyle}>Đường dẫn Web TMĐT (Tiki, Shopee):</label>
//                                 <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://shopee.vn/..." />
//                             </div>
//                         )}

//                         {/* NÚT SUBMIT */}
//                         <button 
//                             onClick={handleExecute} 
//                             disabled={loading}
//                             style={{ 
//                                 width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold',
//                                 backgroundColor: loading ? '#ccc' : '#52c41a', color: '#fff', 
//                                 border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' 
//                             }}>
//                             {loading ? '⏳ HỆ THỐNG ĐANG CÀO DỮ LIỆU...' : '🚀 CHẠY KIỂM THỬ GIAO THỨC'}
//                         </button>
//                     </div>

//                     {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
//                     <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
//                         <div style={{ backgroundColor: '#333', padding: '10px 16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', color: '#fff', fontWeight: 'bold' }}>
//                             📋 Server Response
//                         </div>
//                         <div style={{ padding: '16px', overflowY: 'auto', maxHeight: '500px', color: '#52c41a', fontFamily: 'monospace', fontSize: '14px' }}>
//                             {result ? (
//                                 <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
//                                     {JSON.stringify(result, null, 2)}
//                                 </pre>
//                             ) : (
//                                 <span style={{ color: '#888' }}>// Trạng thái: Đang chờ lệnh...</span>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default TestCrawlerView;

import React, { useState } from 'react';
import { 
  Globe, Zap, Code2, Cpu, Terminal,
  Play, RotateCcw, Copy, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
// 1. Import Sidebar từ folder components của ông
import Sidebar from '../../../components/Sidebar'; 
import { TabType } from './types';
import { 
    testCrawlApi, testCrawlRegex, testCrawlBrowser, 
    testCrawlHtml, testCrawlSmartAuto 
} from '../../../api/crawlApi';

const TestCrawlerView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('API');
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    // --- Form States ---
    const [url, setUrl] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [apiMethod, setApiMethod] = useState('GET');
    const [regexPattern, setRegexPattern] = useState('');
    const [postItemSel, setPostItemSel] = useState('');
    const [titleSel, setTitleSel] = useState('');

    const handleExecute = async () => {
        setLoading(true);
        setResult(null);
        try {
            let resData;
            switch (activeTab) {
                case 'API': resData = await testCrawlApi({ api_url: apiUrl, api_method: apiMethod }); break;
                case 'REGEX': resData = await testCrawlRegex({ url, regex_pattern: regexPattern }); break;
                case 'BROWSER': resData = await testCrawlBrowser({ url, post_item_sel: postItemSel, title_sel: titleSel }); break;
                case 'HTML': resData = await testCrawlHtml({ url, post_item_sel: postItemSel, title_sel: titleSel }); break;
                case 'SMART': resData = await testCrawlSmartAuto({ url }); break;
            }
            setResult(resData);
        } catch (error: any) {
            setResult({ status: "error", message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tabs = [
        { id: 'API', label: 'API Request', icon: <Globe size={16} /> },
        { id: 'REGEX', label: 'Regex Mode', icon: <Code2 size={16} /> },
        { id: 'BROWSER', label: 'Playwright', icon: <Zap size={16} /> },
        { id: 'HTML', label: 'HTML Static', icon: <Terminal size={16} /> },
        { id: 'SMART', label: 'Smart Auto', icon: <Cpu size={16} /> },
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            {/* 2. GỌI SIDEBAR CỦA ÔNG Ở ĐÂY */}
            <Sidebar activePage="Test Crawler" />

            {/* 3. PHẦN NỘI DUNG CHÍNH (Phải có ml-20 hoặc ml-64 tùy theo độ rộng Sidebar của ông) */}
            <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
                
                {/* HEADER TRONG CONTENT */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase font-mono">
                           <span className="text-emerald-500 underline decoration-4">PROTOCOL</span> TESTER
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Multi-Environment Debugging</p>
                    </div>
                    <button onClick={() => setResult(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                        <RotateCcw size={22} />
                    </button>
                </header>

                {/* MAIN BODY */}
                <main className="flex-1 overflow-y-auto p-10 no-scrollbar">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10">
                        
                        {/* CỘT TRÁI: CONFIG */}
                        <div className="xl:col-span-5 space-y-8">
                            {/* TAB MENU */}
                            <div className="bg-white p-2 rounded-[30px] shadow-sm border border-slate-100 flex flex-wrap gap-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id as TabType); setResult(null); }}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex-1 justify-center ${
                                            activeTab === tab.id 
                                            ? 'bg-slate-900 text-white shadow-xl' 
                                            : 'text-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* FORM NHẬP LIỆU */}
                            <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 opacity-40 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                
                                <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle size={14} /> Cấu hình tham số
                                </h3>

                                <div className="space-y-5 relative z-10">
                                    {activeTab === 'API' ? (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">API Endpoint</label>
                                                <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-mono shadow-inner outline-none focus:ring-2 focus:ring-emerald-500" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Method</label>
                                                <select className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" value={apiMethod} onChange={e => setApiMethod(e.target.value)}>
                                                    <option value="GET">GET</option><option value="POST">POST</option>
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Target URL</label>
                                            <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-mono shadow-inner outline-none focus:ring-2 focus:ring-emerald-500" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                                        </div>
                                    )}

                                    {activeTab === 'REGEX' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-4">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Regex Pattern</label>
                                            <textarea rows={4} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-mono shadow-inner outline-none focus:ring-2 focus:ring-emerald-500" value={regexPattern} onChange={e => setRegexPattern(e.target.value)} placeholder='href="(.*?)"' />
                                        </div>
                                    )}

                                    {(activeTab === 'BROWSER' || activeTab === 'HTML') && (
                                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Post Item Sel.</label>
                                                <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-mono shadow-inner" value={postItemSel} onChange={e => setPostItemSel(e.target.value)} placeholder=".item-news" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Title Sel.</label>
                                                <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-mono shadow-inner" value={titleSel} onChange={e => setTitleSel(e.target.value)} placeholder="h3 > a" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleExecute} disabled={loading}
                                    className={`w-full py-5 rounded-[22px] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${loading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
                                    EXECUTE PROTOCOL
                                </button>
                            </div>
                        </div>

                        {/* CỘT PHẢI: CONSOLE */}
                        <div className="xl:col-span-7 h-[700px] flex flex-col">
                            <div className="bg-[#0F172A] rounded-[55px] flex-1 flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
                                <div className="px-10 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                    <div className="flex gap-2 items-center">
                                        <div className="flex gap-1.5 font-mono"><span className="text-red-500">●</span><span className="text-orange-500">●</span><span className="text-emerald-500">●</span></div>
                                        <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] ml-6">TERMINAL_OUTPUT.JSON</span>
                                    </div>
                                    {result && (
                                        <button onClick={copyToClipboard} className="text-slate-400 hover:text-emerald-400 flex items-center gap-2 transition-colors">
                                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Done' : 'Copy'}</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 p-10 overflow-y-auto font-mono text-[14px] leading-relaxed no-scrollbar text-emerald-400 shadow-inner">
                                    {result ? (
                                        <pre className="animate-in fade-in zoom-in-95 duration-500">
                                            {JSON.stringify(result, null, 2)}
                                        </pre>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20">
                                            <Terminal size={80} className="mb-6" />
                                            <p className="text-[12px] font-black uppercase tracking-[0.6em] italic">System Standby</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TestCrawlerView;