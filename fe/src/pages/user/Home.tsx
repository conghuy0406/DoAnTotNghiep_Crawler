import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar'; 
import axiosClient from "../../api/axiosClient";
import { 
  Sparkles, Search, FileCode, Layout, Zap, Fingerprint, 
  ArrowRight, Activity, Database, CheckCircle2, XCircle, Clock, 
  Bell, User, ChevronDown, Server, History, ShieldAlert // 🌟 Thêm ShieldAlert
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  
  // 🌟 LẤY ROLE VÀ TÊN TỪ LOCAL STORAGE
  const userRole = localStorage.getItem('role') || 'user';
  const displayName = localStorage.getItem('full_name') || localStorage.getItem('username') || 'Người dùng';
  const roleDisplay = userRole === 'admin' ? 'Quản trị viên' : 'Thành viên';
  
  const [quickUrl, setQuickUrl] = useState('');
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Chào bạn');
  
  const [stats, setStats] = useState({
    crawls: 0,
    bookmarks: 0,
    sources: 0,
    successRate: 98
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [historyRes, bookmarkRes, sourceRes] = await Promise.all([
          axiosClient.get('/api/v1/history?limit=5', config).catch(() => ({ data: [] })),
          axiosClient.get('/api/v1/bookmarks/?limit=1', config).catch(() => ({ data: { total: 0 } })),
          axiosClient.get('/api/v1/sources/', config).catch(() => ({ data: [] }))
        ]);

        const historyData = historyRes.data?.items || historyRes.data || [];
        const totalCrawls = historyRes.data?.total_crawls || historyData.length || 0;
        
        setStats({
          crawls: totalCrawls,
          bookmarks: bookmarkRes.data?.total || 0,
          sources: Array.isArray(sourceRes.data) ? sourceRes.data.length : 0,
          successRate: 98
        });
        
        setRecentHistory(historyData.slice(0, 4));
      } catch (error) {
        console.error("Lỗi Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl) return alert("Vui lòng nhập link cần thu thập!");
    navigate('/smart-auto', { state: { targetUrl: quickUrl } });
  };

  const tools = [
    { name: 'Cào Web Tĩnh', desc: 'Trích xuất HTML siêu tốc độ', path: '/crawler-html', icon: <FileCode size={24} />, color: 'text-[#1b4b82]', bg: 'bg-[#1b4b82]/10', hoverBorder: 'hover:border-[#1b4b82]/30' },
    { name: 'Cào TMĐT', desc: 'Giả lập Browser, tự cuộn trang', path: '/crawler-browser', icon: <Layout size={24} />, color: 'text-[#265e9f]', bg: 'bg-[#265e9f]/10', hoverBorder: 'hover:border-[#265e9f]/30' },
    { name: 'Kết nối API', desc: 'Lấy dữ liệu JSON trực tiếp', path: '/crawler-api', icon: <Zap size={24} />, color: 'text-[#1cd4a5]', bg: 'bg-[#1cd4a5]/10', hoverBorder: 'hover:border-[#1cd4a5]/30' },
    { name: 'Trích xuất Regex', desc: 'Bóc tách dữ liệu theo khuôn mẫu', path: '/crawler-regex', icon: <Fingerprint size={24} />, color: 'text-[#fac031]', bg: 'bg-[#fac031]/10', hoverBorder: 'hover:border-[#fac031]/30' }
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-sans text-slate-700">
      <Sidebar activePage="Trang chủ" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium text-[13px]">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            
            {/* 🌟 NÚT CHUYỂN TRANG DÀNH RIÊNG CHO ADMIN */}
            {userRole === 'admin' && (
              <button 
                onClick={() => navigate('/dashboard')}
                className="hidden md:flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors text-[11px] font-black uppercase tracking-widest"
              >
                <ShieldAlert size={14} /> Vào Admin Dashboard
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-5">
            <button className="relative text-slate-400 hover:text-[#1b4b82] transition-colors">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-5 bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black shadow-inner transition-colors
                ${userRole === 'admin' ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' : 'bg-[#1b4b82]/10 text-[#1b4b82] group-hover:bg-[#1b4b82] group-hover:text-white'}
              `}>
                {userRole === 'admin' ? <ShieldAlert size={16} /> : <User size={16} />}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-slate-700 leading-none text-[13px]">{displayName}</p>
                <p className={`text-[10px] mt-1 font-bold ${userRole === 'admin' ? 'text-rose-500' : 'text-slate-400'}`}>
                  {roleDisplay}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-[#1b4b82]" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            
            {/* 1. HERO BANNER - ĐỒNG BỘ MÀU SIDEBAR (#153c6b tới #265e9f) */}
            <div className="bg-gradient-to-r from-[#153c6b] to-[#265e9f] rounded-3xl p-8 md:p-12 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-[-20%] right-[-5%] w-80 h-80 bg-[#1cd4a5]/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 w-full md:w-7/12">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm">
                  <Sparkles size={12} className="text-[#fac031]" /> Trợ lý AI Thu Thập Dữ Liệu
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                  {greeting}, <br className="hidden md:block" /> <span className={userRole === 'admin' ? 'text-rose-300' : 'text-white'}>{displayName}</span>!
                </h1>
                <p className="text-blue-100/80 text-sm md:text-[15px] font-medium leading-relaxed mb-8 pr-4">
                  Chỉ cần dán đường dẫn website vào đây, hệ thống sẽ tự động nhận diện cấu trúc và bóc tách dữ liệu một cách thông minh.
                </p>
                
                <form onSubmit={handleQuickStart} className="flex bg-white p-1.5 rounded-2xl shadow-lg focus-within:ring-4 focus-within:ring-white/20 transition-all">
                  <div className="flex items-center pl-4 pr-2">
                    <Search className="text-slate-300 w-5 h-5" />
                  </div>
                  <input 
                    type="url"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    placeholder="Nhập URL (VD: shopee.vn, dantri.com...)"
                    className="flex-1 bg-transparent border-none text-slate-700 text-sm font-medium outline-none px-2 placeholder:text-slate-400"
                  />
                  <button type="submit" className="bg-[#1cd4a5] hover:bg-[#16b58d] text-[#0b2849] font-black px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 text-xs uppercase tracking-widest shrink-0 active:scale-95 shadow-sm">
                    Phân Tích
                  </button>
                </form>
              </div>

              <div className="relative z-10 hidden md:flex w-5/12 justify-center items-center">
                 <div className="w-full max-w-[240px] aspect-square bg-[#113259]/50 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 relative flex flex-col gap-4">
                    <div className="w-2/3 h-3 bg-white/10 rounded-full animate-pulse"></div>
                    <div className="w-full h-24 bg-white/10 rounded-xl flex items-center justify-center">
                       <FileCode size={32} className="text-white/30" />
                    </div>
                    <div className="w-1/2 h-3 bg-white/10 rounded-full animate-pulse delay-75"></div>
                    <div className="w-3/4 h-3 bg-[#1cd4a5]/40 rounded-full animate-pulse delay-150"></div>
                 </div>
              </div>
            </div>

            {/* 2. CHỈ SỐ NHANH */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Tổng phiên thu thập', value: stats.crawls, icon: <Activity size={20}/>, color: 'text-[#1b4b82]', bg: 'bg-[#1b4b82]/10' },
                { label: 'Dữ liệu lưu trữ', value: stats.bookmarks, icon: <Database size={20}/>, color: 'text-[#1cd4a5]', bg: 'bg-[#1cd4a5]/10' },
                { label: 'Nguồn cấu hình', value: stats.sources, icon: <Layout size={20}/>, color: 'text-[#fac031]', bg: 'bg-[#fac031]/10' },
                { label: 'Tỉ lệ thành công', value: `${stats.successRate}%`, icon: <CheckCircle2 size={20}/>, color: 'text-[#265e9f]', bg: 'bg-[#265e9f]/10' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                    {stat.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 leading-none mb-1">{stat.value}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. KHU VỰC CÔNG CỤ & HỆ THỐNG */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-2">
                      <Server size={16} className="text-slate-400" /> Chọn công cụ thủ công
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tools.map((tool, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => navigate(tool.path)}
                      className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md ${tool.hoverBorder} transition-all cursor-pointer group active:scale-95 flex flex-col justify-between min-h-[140px] relative overflow-hidden`}
                    >
                      <div className={`relative z-10 w-10 h-10 rounded-xl ${tool.bg} ${tool.color} flex items-center justify-center mb-3`}>
                        {tool.icon}
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-bold text-slate-700 text-[15px] mb-1">{tool.name}</h4>
                        <p className="text-[11px] text-slate-500">{tool.desc}</p>
                      </div>
                      <div className={`absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity ${tool.color}`}>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-2">
                     <History size={16} className="text-slate-400" /> Hoạt động & Hệ thống
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      <span>Server Load (CPU)</span>
                      <span className="text-[#1b4b82]">24%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1b4b82] w-[24%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      <span>Bộ nhớ đệm (RAM)</span>
                      <span className="text-[#1cd4a5]">68%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1cd4a5] w-[68%] rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-100 pb-2">Lịch sử gần nhất</h4>
                  {loading ? (
                     <div className="flex-1 flex items-center justify-center"><Activity className="animate-spin text-slate-300" /></div>
                  ) : recentHistory.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl py-6 border border-slate-100">
                       <span className="text-[11px] font-medium text-slate-400">Chưa có hoạt động</span>
                    </div>
                  ) : (
                    recentHistory.map((hist, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer border border-transparent hover:border-slate-200">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-slate-200">
                          {hist.status === 'success' ? <CheckCircle2 size={16} className="text-[#1cd4a5]" /> : <XCircle size={16} className="text-rose-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-700 truncate group-hover:text-[#1b4b82] transition-colors">{hist.target_url || "Cào dữ liệu hệ thống"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{hist.method || "AUTO"}</span>
                            <span className="text-[9px] text-slate-400">{new Date(hist.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <button onClick={() => navigate('/history')} className="mt-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 rounded-xl transition-colors border border-slate-200">
                    Xem toàn bộ lịch sử
                  </button>
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