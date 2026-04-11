import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import axiosClient from "../../api/axiosClient";
import { 
  Users, Database, ShieldAlert, CheckCircle2, 
  Settings, History, Globe, ArrowRight,
  TrendingUp, Activity, Server, Info, XCircle, PieChart,
  X, Key, Cpu, Save, Eye, EyeOff 
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem('full_name') || 'Super Admin';
  const [currentTime, setCurrentTime] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0, adminUsers: 0, totalSources: 0,
    globalSources: 0, totalCrawls: 0, successRate: 100
  });

  // 🌟 STATE ĐIỀU KHIỂN MODAL CÀI ĐẶT
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingTab, setActiveSettingTab] = useState('api'); // BIẾN NÀY ĐÂY
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState({
    geminiApiKey: 'AIzaSyA88-xxxxxxxxxxxxxxxxxxxxxxx',
    proxyApiUrl: 'https://api.proxies.com/v1',
    maxThreads: 5,
    timeoutSeconds: 30,
    autoClearLogs: 30
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [usersRes, sourcesRes, historyRes] = await Promise.all([
          axiosClient.get('/api/v1/auth/admin/users', config).catch(() => ({ data: [] })),
          axiosClient.get('/api/v1/sources/', config).catch(() => ({ data: [] })),
          axiosClient.get('/api/v1/history?limit=20', config).catch(() => ({ data: [] }))
        ]);

        const usersData = usersRes.data || [];
        const sourcesData = sourcesRes.data || [];
        const historyData = historyRes.data?.items || historyRes.data || [];

        const adminCount = usersData.filter((u: any) => u.role === 'admin').length;
        const globalCount = sourcesData.filter((s: any) => s.is_global === true).length;
        const totalCrawlsCount = historyRes.data?.total_crawls || historyData.length || 0;
        const successCount = historyData.filter((h: any) => h.status === 'success').length;
        const calcSuccessRate = historyData.length > 0 ? Math.round((successCount / historyData.length) * 100) : 100;

        setStats({
          totalUsers: usersData.length, adminUsers: adminCount,
          totalSources: sourcesData.length, globalSources: globalCount,
          totalCrawls: totalCrawlsCount, successRate: calcSuccessRate
        });

        setRecentLogs(historyData.slice(0, 6));
      } catch (error) {
        console.error("Lỗi tải data Admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const systemStats = [
    { title: 'Tổng Tài Khoản', value: stats.totalUsers, sub: `${stats.adminUsers} Quản trị viên`, icon: <Users size={24} />, color: 'rose' },
    { title: 'Kho Template', value: stats.totalSources, sub: `${stats.globalSources} Mẫu dùng chung`, icon: <Globe size={24} />, color: 'blue' },
    { title: 'Tổng Phiên Cào', value: stats.totalCrawls, sub: 'Toàn bộ máy chủ', icon: <Database size={24} />, color: 'indigo' },
    { title: 'Tỷ lệ Thành Công', value: `${stats.successRate}%`, sub: 'Các phiên gần nhất', icon: <CheckCircle2 size={24} />, color: 'emerald' },
  ];

  const adminActions = [
    { title: 'Quản lý Users', path: '/manage-users', icon: <Users size={20} />, color: 'rose', desc: 'Cấp quyền & Xóa' },
    { title: 'Kho Mẫu Chung', path: '/global-sources', icon: <Globe size={20} />, color: 'blue', desc: 'Shopee, VnExpress...' },
    { title: 'Lịch sử Toàn cục', path: '/global-history', icon: <History size={20} />, color: 'emerald', desc: 'Nhật ký Server' },
    { title: 'Cấu hình Hệ thống', action: 'SETTINGS', icon: <Settings size={20} />, color: 'indigo', desc: 'API Keys & Biến' }, 
  ];

  const handleSaveConfig = () => {
    alert("Đã lưu cấu hình thành công!");
    setShowSettings(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans relative">
      <Sidebar activePage="Trang chủ" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-rose-200">
                  <ShieldAlert size={12} /> QUẢN TRỊ TỐI CAO
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                Bảng điều khiển Server, <span className="text-rose-600">{adminName}</span>! 👑
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Hôm nay là {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Database: OK</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">API: Online</span>
              </div>
            </div>
          </div>

          {/* THỐNG KÊ SERVER */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {systemStats.map((stat, index) => (
              <div key={index} className={`bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:border-${stat.color}-200 hover:shadow-md transition-all group`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500 group-hover:scale-110 transition-transform shadow-inner`}>
                    {stat.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest bg-${stat.color}-50 text-${stat.color}-600 px-2.5 py-1 rounded-full flex items-center gap-1`}>
                    <TrendingUp size={12} /> Live
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-1">
                  {loading ? <Activity size={28} className="animate-spin text-slate-300 my-1" /> : stat.value}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.title}</p>
                <p className="text-[10px] text-slate-400 font-medium">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              
              {/* NÚT LỐI TẮT */}
              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800">⚡ Điều hướng Quản trị</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {adminActions.map((action, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        if (action.action === 'SETTINGS') setShowSettings(true);
                        else navigate(action.path!);
                      }}
                      className={`p-5 rounded-[24px] border-2 border-transparent bg-white hover:border-${action.color}-200 hover:shadow-lg shadow-sm transition-all group flex flex-col items-center text-center`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-${action.color}-50 flex items-center justify-center text-${action.color}-500 mb-3 group-hover:-translate-y-1 transition-transform`}>
                        {action.icon}
                      </div>
                      <h3 className="font-bold text-slate-700 text-sm mb-1">{action.title}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">{action.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* BIỂU ĐỒ */}
              <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm min-h-[350px] flex flex-col relative overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-5"><Server size={200} /></div>
                <div className="relative z-10 flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800">📈 Báo cáo Trích xuất</h2>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Biểu đồ lượng Request trong tháng</p>
                  </div>
                  <select className="bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 rounded-xl px-3 py-2 outline-none">
                    <option>Tháng này</option>
                    <option>Tháng trước</option>
                  </select>
                </div>
                <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed flex items-center justify-center text-slate-400 relative overflow-hidden z-10">
                  <div className="absolute bottom-0 w-full h-full flex items-end justify-around px-8 pb-4 opacity-40">
                    <div className="w-10 bg-indigo-300 rounded-t-lg" style={{ height: '40%' }}></div>
                    <div className="w-10 bg-indigo-500 rounded-t-lg" style={{ height: '70%' }}></div>
                    <div className="w-10 bg-indigo-400 rounded-t-lg" style={{ height: '30%' }}></div>
                    <div className="w-10 bg-indigo-600 rounded-t-lg" style={{ height: '90%' }}></div>
                    <div className="w-10 bg-indigo-400 rounded-t-lg" style={{ height: '50%' }}></div>
                    <div className="w-10 bg-indigo-700 rounded-t-lg" style={{ height: '100%' }}></div>
                    <div className="w-10 bg-indigo-500 rounded-t-lg" style={{ height: '60%' }}></div>
                  </div>
                  <span className="text-[11px] font-black tracking-widest uppercase relative z-10 bg-white px-4 py-2 rounded-xl shadow-sm">&lt;Admin System Charts /&gt;</span>
                </div>
              </div>

            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex flex-col">
                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-5">
                  <PieChart size={16} className="text-[#1b4b82]"/> Phân bổ Hệ thống
                </h2>
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    <span>Mẫu Dùng Chung (Global)</span>
                    <span className="text-[#1b4b82]">{stats.totalSources > 0 ? Math.round((stats.globalSources / stats.totalSources) * 100) : 0}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#1b4b82] rounded-full transition-all duration-1000" style={{ width: `${stats.totalSources > 0 ? (stats.globalSources / stats.totalSources) * 100 : 0}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-right">{stats.globalSources} / {stats.totalSources} Template</p>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    <span>Tỷ lệ Crawl Thành Công</span>
                    <span className="text-emerald-500">{stats.successRate}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-rose-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${stats.successRate}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-right">Dữ liệu {recentLogs.length} phiên gần nhất</p>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                    <Activity size={16} className="text-rose-500"/> Realtime Logs
                  </h2>
                </div>
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {loading ? (
                    <div className="flex h-full items-center justify-center"><Activity className="animate-spin text-slate-300" size={32} /></div>
                  ) : recentLogs.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-400 text-[11px] font-medium">Chưa có hoạt động nào</div>
                  ) : (
                    recentLogs.map((log, index) => (
                      <div key={index} className="p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${log.status === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                          {log.status === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h4 className="text-[13px] font-bold text-slate-800 truncate mb-1">{log.method ? `Crawler: ${log.method}` : 'Auto Crawl'}</h4>
                          <div className="text-[10px] font-bold text-slate-400 truncate">Target: <span className="text-[#1b4b82] italic">{log.target_url}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 🌟 MODAL SETTING CẤU HÌNH HỆ THỐNG */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-full max-h-[750px] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Settings size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase italic">System Configuration</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Environment Variables</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"><X size={24} /></button>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-64 bg-slate-50/30 border-r border-slate-100 p-6 space-y-2">
                <button onClick={() => setActiveSettingTab('api')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeSettingTab === 'api' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <Key size={18} /> API & Tích hợp
                </button>
                <button onClick={() => setActiveSettingTab('engine')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeSettingTab === 'engine' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <Cpu size={18} /> Lõi Crawler
                </button>
                <button onClick={() => setActiveSettingTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeSettingTab === 'data' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  <Database size={18} /> Bảo trì Dữ liệu
                </button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                {activeSettingTab === 'api' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Cấu hình Google Gemini AI</h3>
                      <p className="text-xs text-slate-400 mb-4">Mã khóa API dùng để phân tích cảm xúc và tóm tắt dữ liệu.</p>
                      <div className="relative">
                        <input type={showKey ? "text" : "password"} value={config.geminiApiKey} onChange={(e) => setConfig({...config, geminiApiKey: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono text-slate-700 outline-none focus:border-indigo-500 transition-all"/>
                        <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600">{showKey ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100"></div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Proxy / IP Rotation</h3>
                      <p className="text-xs text-slate-400 mb-4">Tránh bị chặn IP khi cào web liên tục.</p>
                      <input type="text" value={config.proxyApiUrl} onChange={(e) => setConfig({...config, proxyApiUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all"/>
                    </div>
                  </div>
                )}

                {activeSettingTab === 'engine' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Số luồng (Max Threads)</label>
                        <input type="number" value={config.maxThreads} onChange={(e) => setConfig({...config, maxThreads: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-indigo-600 outline-none focus:border-indigo-500"/>
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Timeout (Giây)</label>
                        <input type="number" value={config.timeoutSeconds} onChange={(e) => setConfig({...config, timeoutSeconds: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:border-indigo-500"/>
                      </div>
                    </div>
                  </div>
                )}

                {/* ĐÃ SỬA LẠI THÀNH activeSettingTab */}
                {activeSettingTab === 'data' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tự động dọn dẹp Log sau</label>
                      <select value={config.autoClearLogs} onChange={(e) => setConfig({...config, autoClearLogs: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:border-indigo-500">
                        <option value={7}>7 ngày</option>
                        <option value={30}>30 ngày</option>
                        <option value={0}>Không bao giờ xóa</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all">Hủy bỏ</button>
              <button onClick={handleSaveConfig} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                <Save size={16}/> Lưu Hệ Thống
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;