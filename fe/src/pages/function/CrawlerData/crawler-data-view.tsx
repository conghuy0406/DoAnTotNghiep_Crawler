// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import Sidebar from '../../../components/Sidebar'; 
// import CrawlerResultTable from './crawler-result-table';
// import { CrawlerSource } from './types';

// const CrawlerDataView: React.FC = () => {
//   const [sources, setSources] = useState<CrawlerSource[]>([]);
//   const [selectedSourceId, setSelectedSourceId] = useState('');
//   const [keyword, setKeyword] = useState('');
//   const [limit, setLimit] = useState(5);
  
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [statusMsg, setStatusMsg] = useState('');
//   const [crawlData, setCrawlData] = useState<any>(null);
  
//   // Dùng kiểu number cho trình duyệt để tránh lỗi NodeJS namespace
//   const pollingRef = useRef<number | null>(null);

//   useEffect(() => {
//     const fetchSources = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const response = await axios.get('http://localhost:8000/api/v1/sources/', {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
//         setSources(data);
//         if (data.length > 0) setSelectedSourceId(data[0]._id);
//       } catch (err) { console.error("Lỗi lấy nguồn:", err); }
//     };
//     fetchSources();
//     return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); };
//   }, []);

//   // Hàm xử lý limit tối đa là 5
//   const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = parseInt(e.target.value);
//     if (value > 5) value = 5;
//     if (value < 1 || isNaN(value)) value = 1;
//     setLimit(value);
//   };

//   const fetchFinalResult = async (resultId: string) => {
//     try {
//       const token = localStorage.getItem('token');
//       // Trỏ vào history để lấy structured_data
//       const res = await axios.get(`http://localhost:8000/api/v1/history/${resultId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       const rawData = res.data;
//       setCrawlData({
//         raw_articles: rawData.structured_data || [], 
//         analysis: {
//           summary: rawData.summary,
//           category: rawData.category
//         }
//       });
//       setLoading(false);
//       setStatusMsg("Hoàn thành!");
//     } catch (err) {
//       console.error("Lỗi lấy kết quả:", err);
//       setLoading(false);
//     }
//   };

//   const startPolling = (taskId: string) => {
//     pollingRef.current = window.setInterval(async () => {
//       try {
//         const res = await axios.get(`http://localhost:8000/api/v1/status/${taskId}`);
//         const { status, progress, message, result_id } = res.data;

//         setProgress(progress);
//         setStatusMsg(message);

//         if (status === 'completed') {
//           if (pollingRef.current) window.clearInterval(pollingRef.current);
//           fetchFinalResult(result_id);
//         } else if (status === 'failed') {
//           if (pollingRef.current) window.clearInterval(pollingRef.current);
//           setLoading(false);
//           alert("Lỗi: " + message);
//         }
//       } catch (err) {
//         if (pollingRef.current) window.clearInterval(pollingRef.current);
//         setLoading(false);
//       }
//     }, 2000); 
//   };

//   const handleStartCrawl = async () => {
//     if (!keyword.trim()) return alert("Nhập từ khóa đã Hào ơi!");
//     setLoading(true);
//     setProgress(5);
//     setStatusMsg("Khởi tạo...");
//     setCrawlData(null);

//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.post('http://localhost:8000/api/v1/keyword', {
//         keyword,
//         limit, // Limit đã được khống chế tối đa 5
//         target_sources: [selectedSourceId]
//       }, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (res.data.task_id) {
//         startPolling(res.data.task_id);
//       }
//     } catch (err) {
//       alert("Lỗi kết nối Server!");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
//       <Sidebar activePage="Crawler Data" />
//       <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
//         <main className="flex-1 overflow-y-auto p-10 pt-12 custom-scrollbar">
//           <div className="max-w-5xl mx-auto space-y-10">
//             <div>
//               <h1 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter">
//                 Crawler <span className="text-indigo-600">Engine</span>
//               </h1>
//               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Async Polling System • Limit Max 5</p>
//             </div>

//             <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
//               <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
//                 <div className="md:col-span-3">
//                   <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block">Nguồn tin</label>
//                   <select value={selectedSourceId} onChange={(e)=>setSelectedSourceId(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
//                     {sources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
//                   </select>
//                 </div>
//                 <div className="md:col-span-5">
//                   <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block">Từ khóa</label>
//                   <input type="text" value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="Giá vàng hôm nay..." className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
//                 </div>
//                 <div className="md:col-span-2">
//                   <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block">Số lượng (Max 5)</label>
//                   <input type="number" min="1" max="5" value={limit} onChange={handleLimitChange} className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 font-black text-indigo-600 outline-none" />
//                 </div>
//                 <div className="md:col-span-2">
//                   <button onClick={handleStartCrawl} disabled={loading} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-20 shadow-xl shadow-indigo-100">
//                     {loading ? "Chạy..." : "Bắt đầu"}
//                   </button>
//                 </div>
//               </div>

//               {loading && (
//                 <div className="mt-10">
//                   <div className="flex justify-between items-center px-1 mb-2">
//                     <span className="text-[10px] font-black text-indigo-600 uppercase italic animate-pulse">{statusMsg}</span>
//                     <span className="text-[10px] font-black text-slate-400">{progress}%</span>
//                   </div>
//                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
//                     <div className="h-full bg-indigo-600 transition-all duration-700 shadow-[0_0_10px_rgba(79,70,229,0.3)]" style={{ width: `${progress}%` }}></div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <CrawlerResultTable articles={crawlData?.raw_articles || []} analysis={crawlData?.analysis} />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default CrawlerDataView;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar'; 
// SỬA LỖI 2307: Đảm bảo import đúng tên file viết thường
import CrawlerResultTable from './crawler-result-table';
import { CrawlerSource } from './types';

const CrawlerDataView: React.FC = () => {
  const [sources, setSources] = useState<CrawlerSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(5);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [crawlData, setCrawlData] = useState<any>(null);
  
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/v1/sources/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setSources(data);
        if (data.length > 0) setSelectedSourceId(data[0]._id);
      } catch (err) { console.error("Lỗi lấy nguồn:", err); }
    };
    fetchSources();
    return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); };
  }, []);

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value);
    if (value > 5) value = 5;
    if (value < 1 || isNaN(value)) value = 1;
    setLimit(value);
  };

  const fetchFinalResult = async (resultId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/v1/history/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const rawData = res.data;
      setCrawlData({
        raw_articles: rawData.structured_data || [], 
        analysis: {
          summary: rawData.summary,
          category: rawData.category
        }
      });
      setLoading(false);
      setStatusMsg("Hoàn thành!");
    } catch (err) {
      console.error("Lỗi lấy kết quả:", err);
      setLoading(false);
    }
  };

  const startPolling = (taskId: string) => {
    pollingRef.current = window.setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/status/${taskId}`);
        const { status, progress, message, result_id } = res.data;

        setProgress(progress);
        setStatusMsg(message);

        if (status === 'completed') {
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          fetchFinalResult(result_id);
        } else if (status === 'failed') {
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          setLoading(false);
          alert("Lỗi: " + message);
        }
      } catch (err) {
        if (pollingRef.current) window.clearInterval(pollingRef.current);
        setLoading(false);
      }
    }, 2000); 
  };

  // SỬA LỖI 7006: Khai báo kiểu dữ liệu object cho payload
  const handleStartCrawl = async () => {
    if (!keyword.trim()) return alert("Nhập từ khóa đã Hào ơi!");
    setLoading(true);
    setProgress(5);
    setStatusMsg("Khởi tạo...");
    setCrawlData(null);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        keyword,
        limit,
        target_sources: [selectedSourceId]
      };

      const res = await axios.post('http://localhost:8000/api/v1/keyword', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.task_id) {
        startPolling(res.data.task_id);
      }
    } catch (err) {
      alert("Lỗi kết nối Server!");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
      <Sidebar activePage="Crawler Data" />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10 pt-12 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-10">
            <div>
              <h1 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter">
                Crawler <span className="text-indigo-600">Engine</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Async Polling System • Limit Max 5</p>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block">Nguồn tin</label>
                  <select value={selectedSourceId} onChange={(e)=>setSelectedSourceId(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    {sources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-5">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block">Từ khóa</label>
                  <input type="text" value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="Giá vàng hôm nay..." className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block">Số lượng</label>
                  <input type="number" min="1" max="5" value={limit} onChange={handleLimitChange} className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 font-black text-indigo-600 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <button onClick={handleStartCrawl} disabled={loading} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-20 shadow-xl shadow-indigo-100">
                    {loading ? "Chạy..." : "Bắt đầu"}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="mt-10">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase italic animate-pulse">{statusMsg}</span>
                    <span className="text-[10px] font-black text-slate-400">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <CrawlerResultTable articles={crawlData?.raw_articles || []} analysis={crawlData?.analysis} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CrawlerDataView;