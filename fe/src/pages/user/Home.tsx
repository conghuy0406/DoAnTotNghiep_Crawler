import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar'; 

const Home = () => {
  // Ưu tiên lấy tên từ localStorage, nếu không có thì dùng tên mặc định
  const displayName = localStorage.getItem('username') || 'Nguyễn Nhật Hào';
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Định dạng thời gian chuẩn Việt Nam
  const timeString = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    /* SỬA: Thêm h-screen và overflow-hidden để quản lý cuộn tập trung */
    <div className="flex h-screen bg-[#f3f4f9] overflow-hidden">
      
      {/* 1. SIDEBAR CỐ ĐỊNH (FIXED) */}
      <Sidebar activePage="Trang Chủ" />

      {/* 2. MAIN CONTENT AREA: Thêm ml-20 (mobile) và md:ml-64 (desktop) để tránh bị đè */}
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        
        {/* NỘI DUNG CÓ THỂ CUỘN */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
            
            {/* --- TOP SECTION: WELCOME & WEATHER/TIME --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Welcome Card */}
              <div className="lg:col-span-2 bg-white rounded-[32px] p-10 shadow-sm border border-white flex justify-between items-center relative overflow-hidden group">
                {/* Trang trí nền */}
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>
                
                <div className="relative z-10 max-w-lg">
                  <h2 className="text-3xl font-black text-indigo-600 mb-3 italic uppercase tracking-tighter">
                    🚀 Chào mừng quay trở lại, <br/> 
                    <span className="text-slate-800 not-italic lowercase">{displayName}!</span>
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium italic">
                    Hệ thống thu thập dữ liệu đa luồng phục vụ Đồ án tốt nghiệp đã sẵn sàng. 
                    Mời bạn bắt đầu phiên làm việc mới!
                  </p>
                  <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    Bắt đầu thu thập
                  </button>
                </div>
              </div>

              {/* Time & Weather Widget */}
              <div className="bg-indigo-600 rounded-[32px] p-8 shadow-lg shadow-indigo-100 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute bottom-[-10%] right-[-10%] opacity-10">
                    <svg width="150" height="150" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 5.106a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.061l-1.591-1.591a.75.75 0 010-1.061zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 010 1.06l-1.591 1.591a.75.75 0 11-1.061-1.06l1.591-1.591a.75.75 0 011.06 0zM12 18.75a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM5.106 18.894a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.061l-1.591-1.591a.75.75 0 010-1.06zM6.75 12a.75.75 0 01-.75.75H3.75a.75.75 0 010-1.5H6a.75.75 0 01.75.75zM5.106 5.106a.75.75 0 010 1.06L3.515 7.758a.75.75 0 01-1.06-1.06l1.591-1.591a.75.75 0 011.06 0z"/></svg>
                </div>
                
                <div className="z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Hệ thống thời gian</p>
                  <h3 className="text-4xl font-black tracking-tighter tabular-nums">{timeString}</h3>
                  <p className="text-[11px] font-bold opacity-90 mt-1 capitalize">{dateString}</p>
                </div>

                <div className="z-10 mt-6 flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                   <div className="text-3xl">☀️</div>
                   <div>
                      <p className="text-xs font-black uppercase tracking-widest">TP. Hồ Chí Minh</p>
                      <p className="text-2xl font-black">32°C <span className="text-[10px] font-medium opacity-70">Nắng nhẹ</span></p>
                   </div>
                </div>
              </div>
            </div>

            {/* --- STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Tổng Bookmark', val: '5', color: 'bg-emerald-50', text: 'text-emerald-600', icon: '🔖' },
                { label: 'Từ khóa đã dùng', val: '1', color: 'bg-sky-50', text: 'text-sky-600', icon: '📂' },
                { label: 'Website theo dõi', val: '11', color: 'bg-amber-50', text: 'text-amber-600', icon: '🌐' },
                { label: 'Hoạt động', val: '0', color: 'bg-indigo-50', text: 'text-indigo-600', icon: '💳' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 hover:shadow-md transition-all active:scale-95 cursor-pointer group">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform`}>{card.icon}</div>
                    <button className="text-gray-300 hover:text-gray-500 font-bold text-xl">···</button>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{card.label}</p>
                  <h3 className="text-4xl font-black text-slate-800 mt-1">{card.val}</h3>
                  <div className="flex items-center gap-2 mt-3">
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${card.color} ${card.text}`}>↑ Mới: {card.val}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* --- BOTTOM SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-50">
                  <h4 className="font-black text-slate-800 mb-6 uppercase text-[11px] tracking-[0.3em] flex items-center gap-2">
                     <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                     Hoạt động gần đây
                  </h4>
                  <div className="py-12 text-center text-gray-300 italic text-xs font-medium">Chưa có hoạt động mới được ghi nhận</div>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-50 flex flex-col items-center justify-center min-h-[250px] group">
                  <h4 className="font-black text-slate-800 mb-8 self-start uppercase text-[11px] tracking-[0.3em]">Website Status</h4>
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-500 font-black text-[10px]">AI</div>
                  </div>
                  <p className="mt-6 text-indigo-600 font-black text-[10px] uppercase tracking-widest animate-pulse">Đang quét dữ liệu...</p>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-50">
                  <h4 className="font-black text-slate-800 mb-6 uppercase text-[11px] tracking-[0.3em]">Từ khóa thịnh hành</h4>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform text-xs">01</div>
                           <div>
                              <p className="font-black text-slate-800 uppercase tracking-tighter">Giá vàng</p>
                              <p className="text-[10px] font-bold text-gray-400 italic">Đang phân tích...</p>
                           </div>
                        </div>
                        <div className="text-indigo-600 font-black italic">HOT</div>
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