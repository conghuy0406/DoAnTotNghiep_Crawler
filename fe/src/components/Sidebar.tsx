import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  activePage?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Tự động mở menu nếu đường dẫn liên quan đến chức năng cào
  const shouldOpenDropdown = 
    location.pathname.includes('crawler') || 
    location.pathname.includes('api') ||
    location.pathname.includes('regex') ||
    location.pathname.includes('browser') ||
    location.pathname.includes('html') ||
    location.pathname.includes('auto');

  const [isOverviewOpen, setIsOverviewOpen] = useState(shouldOpenDropdown);

  useEffect(() => {
    if (shouldOpenDropdown) {
      setIsOverviewOpen(true);
    }
  }, [location.pathname, shouldOpenDropdown]);

const menuItems = [
    { 
      name: 'Trang Chủ', 
      path: '/home', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
    },
    { 
      name: 'Chức Năng', 
      isDropdown: true, 
      icon: 'M4 6h16M4 12h16M4 18h7',
      subItems: [
        { name: 'Smart Auto', path: '/smart-auto' }, 
        { name: 'Crawler HTML', path: '/crawler-html' }, 
        { name: 'Crawler API', path: '/crawler-api' },
        { name: 'Crawler Regex', path: '/crawler-regex' },
        { name: 'Crawler Browser', path: '/crawler-browser' } 
      ]
    },
    { 
      name: 'Yêu Thích', 
      path: '/favorites',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' 
    },
    // ==========================================
    // THÊM MỚI: QUẢN LÝ NGUỒN CÀO (SOURCE MANAGER)
    // ==========================================
    { 
      name: 'Quản Lý Nguồn', 
      path: '/sources', 
      icon: 'M4 7v10c0 2 3.58 4 8 4s8-2 8-4V7M4 7c0 2 3.58 4 8 4s8-2 8-4M4 7c0-2 3.58-4 8-4s8 2 8 4m0 5c0 2-3.58 4-8 4s-8-2-8-4' // Icon hình Database
    },
    { 
      name: 'Lịch Sử Crawler', 
      path: '/history', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      name: 'Xuất Excel', 
      path: '/export-excel', 
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' 
    },
    { 
      name: 'Cài Đặt', 
      path: '/settings', 
      icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' 
    }
  ];

  return (
    <>
      {/* ✅ CSS ĐỂ TRIỆT TIÊU THANH CUỘN */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <aside className="fixed inset-y-0 left-0 w-20 md:w-64 bg-[#0b0724] border-r border-white/5 flex flex-col items-center md:items-start p-4 md:p-6 transition-all h-screen shadow-2xl z-50">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 mb-12 self-center md:self-start cursor-pointer group" 
          onClick={() => navigate('/home')}
        >
          <div className="w-10 h-10 border-2 border-cyan-500 flex items-center justify-center rotate-45 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-transform group-hover:scale-110">
            <span className="rotate-[-45deg] font-black text-sm uppercase text-white tracking-tighter">C</span>
          </div>
          <div className="hidden md:block">
            <span className="font-black tracking-tighter text-lg italic uppercase text-white leading-none block">Crawler AI</span>
            <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-[0.3em]">System v3.0</span>
          </div>
        </div>

        {/* Navigation Menu - Áp dụng class no-scrollbar */}
        <nav className="flex-1 w-full space-y-2 overflow-y-auto pr-2 no-scrollbar">
          {menuItems.map((item) => {
            const isChildActive = item.subItems?.some(sub => location.pathname === sub.path);
            const isActive = location.pathname === item.path || isChildActive;

            return (
              <div key={item.name}>
                {item.isDropdown ? (
                  <div className="mb-2">
                    <button 
                      onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group hover:bg-white/5 
                        ${isActive ? 'text-cyan-400 bg-cyan-400/5' : 'text-gray-400'}`}
                    >
                      <div className="flex items-center gap-4">
                        <svg className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}></path>
                        </svg>
                        <span className="hidden md:block text-[11px] font-bold uppercase tracking-[0.1em]">
                          {item.name}
                        </span>
                      </div>
                      <svg className={`w-3 h-3 transition-transform hidden md:block ${isOverviewOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>

                    {isOverviewOpen && (
                      <div className="mt-2 ml-4 md:ml-9 space-y-1 border-l border-white/10 pl-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        {item.subItems?.map((sub) => (
                          <button
                            key={sub.name}
                            onClick={() => navigate(sub.path)}
                            className={`w-full text-left p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                              ${location.pathname === sub.path ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate(item.path!)}
                    className={`w-full flex items-center justify-center md:justify-start gap-4 p-3.5 rounded-2xl transition-all group
                      ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                  >
                    <svg className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}></path>
                    </svg>
                    <span className={`hidden md:block text-[11px] font-bold uppercase tracking-[0.1em] ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                      {item.name}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="w-full pt-4 mt-4 border-t border-white/5">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              navigate('/login');
            }}
            className="w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl hover:bg-red-500/10 group transition-all"
          >
            <svg className="w-5 h-5 text-red-500/50 group-hover:text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path>
            </svg>
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-red-500/50 group-hover:text-red-500">
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;