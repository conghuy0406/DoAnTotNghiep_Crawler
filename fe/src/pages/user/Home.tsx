import React from 'react';
import Sidebar from '../../components/Sidebar';
import { 
  Bell, User, ChevronDown, Sparkles, Globe, 
  Search, Zap, ArrowRight, BarChart3, Database,
  TrendingUp, Clock, Terminal, CheckCircle2
} from 'lucide-react';

const Home: React.FC = () => {
  const displayName = localStorage.getItem('username') || "Người dùng HUTECH";

  // Data mẫu cho Dashboard
  const stats = [
    { label: "Tổng số Web đã cào", value: "1,284", icon: <Globe size={20} />, color: "bg-blue-500" },
    { label: "Dữ liệu đã trích xuất", value: "84.2k", icon: <Database size={20} />, color: "bg-emerald-500" },
    { label: "Độ chính xác AI", value: "98.4%", icon: <Zap size={20} />, color: "bg-amber-500" },
    { label: "Thời gian trung bình", value: "1.2s", icon: <Clock size={20} />, color: "bg-rose-500" }
  ];

  const recentActivities = [
    { id: 1, type: "Smart Auto", target: "thegioididong.com", time: "2 phút trước", status: "Hoàn tất" },
    { id: 2, type: "Browser", target: "cellphones.com.vn", time: "15 phút trước", status: "Hoàn tất" },
    { id: 3, type: "Regex", target: "vnexpress.net", time: "1 giờ trước", status: "Error" },
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-[#0b0724] font-sans text-slate-700 dark:text-slate-200 transition-colors">
      <Sidebar activePage="Trang Chủ" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white dark:bg-[#0b0724] border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[13px]">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div className="flex items-center gap-5">
            <button className="relative text-slate-400 hover:text-[#1b4b82] dark:hover:text-cyan-400 transition-colors">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#0b0724]"></span>
            </button>
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-[#1b4b82]/10 dark:bg-cyan-400/10 text-[#1b4b82] dark:text-cyan-400 flex items-center justify-center font-black shadow-inner group-hover:bg-[#1b4b82] dark:group-hover:bg-cyan-400 group-hover:text-white dark:group-hover:text-[#0b0724] transition-colors">
                <User size={16} />
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-slate-700 dark:text-slate-200 leading-none text-[13px]">{displayName}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Quản trị viên</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-[#1b4b82] dark:group-hover:text-cyan-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-transparent dark:bg-[#0b0724]">
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            
            {/* 1. HERO BANNER - ĐỒNG BỘ MÀU SIDEBAR (#153c6b tới #265e9f) */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#153c6b] to-[#265e9f] rounded-[30px] p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-6">
                  <Sparkles size={12} className="text-cyan-300" />
                  Hệ thống AI Cào Dữ Liệu Thế Hệ Mới
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                  Chào buổi sáng, <span className="text-cyan-300 italic">{displayName.split(' ').pop()}</span>
                </h1>
                <p className="text-blue-100/80 text-lg mb-8 leading-relaxed font-medium">
                  Hệ thống đã thu thập thêm <span className="text-white font-bold">1,402</span> bản ghi dữ liệu mới từ các nguồn bạn đã cấu hình trong 24 giờ qua.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-8 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-blue-900 font-black rounded-2xl transition-all shadow-lg shadow-cyan-400/20 flex items-center gap-2 group">
                    Bắt đầu cào ngay
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-bold rounded-2xl transition-all">
                    Xem báo cáo AI
                  </button>
                </div>
              </div>
              
              {/* Trang trí nền */}
              <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                <Terminal size={400} className="scale-150 translate-x-1/2 translate-y-1/4" />
              </div>
            </div>

            {/* 2. STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-[#0b0724] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner`}>
                      {stat.icon}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp size={10} />
                      +12%
                    </div>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</h3>
                </div>
              ))}
            </div>

            {/* 3. MAIN CONTENT: RECENT & CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Bảng hoạt động gần đây */}
              <div className="lg:col-span-1 bg-white dark:bg-[#0b0724] rounded-[30px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden h-full">
                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <History size={16} className="text-indigo-500" />
                    Lịch sử cào
                  </h3>
                  <button className="text-[11px] font-bold text-[#1b4b82] dark:text-cyan-400 hover:underline">Chi tiết</button>
                </div>
                <div className="p-4 space-y-3">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{act.type}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{act.time}</span>
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-[13px] truncate">{act.target}</p>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-500 mt-2 font-bold">
                        <CheckCircle2 size={12} />
                        {act.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box hướng dẫn nhanh / Gợi ý AI */}
              <div className="lg:col-span-2 bg-white dark:bg-[#0b0724] rounded-[30px] border border-slate-100 dark:border-white/5 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                  <BarChart3 size={32} className="text-[#1b4b82] dark:text-cyan-400" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Sẵn sàng thu thập dữ liệu mới?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-8 font-medium">
                  Hãy thử tính năng <span className="text-[#1b4b82] dark:text-cyan-400 font-bold">Smart Auto AI</span> để hệ thống tự động tìm kiếm và trích xuất dữ liệu mà không cần viết cấu hình.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                  <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl text-left border border-transparent hover:border-blue-200 dark:hover:border-cyan-900 transition-all cursor-pointer group">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Công vụ mới</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">Cào web thế hệ 4.0</p>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl text-left border border-transparent hover:border-blue-200 dark:hover:border-cyan-900 transition-all cursor-pointer group">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Mẹo hay</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">Tối ưu Regex nâng cao</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;