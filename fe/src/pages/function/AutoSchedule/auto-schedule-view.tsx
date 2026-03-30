import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { 
  Clock, CalendarDays, Search, Loader2, Save, 
  Trash2, Power, Activity, ChevronRight, BellRing 
} from 'lucide-react';

const AutoScheduleView: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [time, setTime] = useState('06:00');
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  // 1. TẢI DANH SÁCH LỊCH TRÌNH
  const fetchSchedules = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/schedules');
      setSchedules(res.data || []);
    } catch (error) {
      console.error("Lỗi tải lịch trình:", error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // Tự động làm mới danh sách mỗi 10 giây để xem status
    const interval = setInterval(fetchSchedules, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. LƯU LỊCH TRÌNH MỚI
  const handleSaveSchedule = async () => {
    if (!keyword || !time) {
      alert("Vui lòng nhập đủ từ khóa và thời gian!");
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/v1/schedules', {
        keyword: keyword,
        time: time,
        is_active: true
      });
      alert(`Đã lên lịch thành công! Hệ thống sẽ cào "${keyword}" lúc ${time} mỗi ngày.`);
      setKeyword('');
      fetchSchedules(); // Tải lại danh sách
    } catch (error) {
      alert("Lỗi khi lưu lịch trình!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Lên Lịch Tự Động" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* HEADER SECTION */}
          <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between border-b border-violet-100 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                <Clock size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Auto Schedule</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-ping"></span> Hệ thống chạy ngầm Cronjob
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10">
            
            {/* CỘT TRÁI: FORM LÊN LỊCH */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-violet-50 space-y-8">
                
                <div className="space-y-6">
                  {/* Nhập Từ khóa */}
                  <div className="group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Từ khóa bóc tách</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-violet-500 transition-colors" />
                      <input 
                        placeholder="VD: Giá vàng hôm nay..."
                        value={keyword} onChange={(e) => setKeyword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-violet-400 transition-all shadow-inner text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Chọn Thời gian */}
                  <div className="group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Giờ chạy tự động (Hàng ngày)</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-violet-500 transition-colors" />
                      <input 
                        type="time"
                        value={time} onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-lg font-black outline-none focus:bg-white focus:border-violet-400 transition-all shadow-inner text-violet-600"
                      />
                    </div>
                  </div>
                </div>

                {/* NÚT LƯU */}
                <button 
                  onClick={handleSaveSchedule} disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-200 disabled:opacity-50 active:scale-95"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  <span className="tracking-widest uppercase text-sm">{loading ? "Đang xử lý..." : "LƯU LỊCH TRÌNH"}</span>
                </button>

              </div>

              {/* Status Box */}
              <div className="bg-violet-50/50 border border-violet-100 p-6 rounded-[30px] flex gap-4 items-center">
                 <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-violet-500"></span>
                </div>
                 <div className="space-y-1">
                    <p className="text-[12px] text-violet-900 font-bold uppercase tracking-tighter">Heartbeat Server is running</p>
                    <p className="text-[11px] text-violet-900/60 font-medium italic">
                      Hệ thống rà soát mỗi 60 giây.
                    </p>
                 </div>
              </div>
            </div>

            {/* CỘT PHẢI: DANH SÁCH LỊCH TRÌNH */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-5 px-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  Danh sách chờ xử lý <span className="bg-violet-100 text-violet-600 px-3 py-0.5 rounded-full text-[10px]">{schedules.length}</span>
                </h2>
              </div>

              <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {schedules.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-40">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-slate-200">
                      <BellRing size={48} className="opacity-20" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Chưa có lịch trình nào</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar h-full">
                    {schedules.map((item, i) => (
                      <div key={i} className="p-7 hover:bg-slate-50/80 transition-all group flex gap-6 items-center border-l-4 border-transparent hover:border-violet-500">
                         {/* THỜI GIAN KHỐI BÊN TRÁI */}
                         <div className="flex-none w-20 h-20 rounded-[24px] bg-violet-50 flex flex-col items-center justify-center shadow-inner group-hover:bg-violet-600 transition-colors">
                           <span className="text-[10px] font-bold text-violet-400 group-hover:text-violet-200 uppercase tracking-widest mb-1">HÀNG NGÀY</span>
                           <span className="text-xl font-black text-violet-700 group-hover:text-white leading-none">{item.time}</span>
                         </div>
                         
                         {/* THÔNG TIN TỪ KHÓA */}
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 text-[18px] leading-snug mb-1 group-hover:text-violet-600 transition-colors truncate">
                              {item.keyword}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              <Activity size={14} className={item.is_active ? "text-emerald-500" : "text-slate-300"} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${item.is_active ? "text-emerald-500" : "text-slate-400"}`}>
                                {item.is_active ? "ĐANG CANH GIỜ" : "ĐÃ TẮT"}
                              </span>
                            </div>
                         </div>
                         
                         {/* NÚT XÓA / TẮT (Giao diện giả lập) */}
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all" title="Xóa lịch">
                              <Trash2 size={16} />
                            </button>
                         </div>
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

export default AutoScheduleView;