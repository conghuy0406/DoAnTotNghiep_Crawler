import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Layers, Database, Heart, Settings, 
  History, Download, Activity, FileText, ShieldAlert,
  ChevronDown, ChevronRight, LogOut
} from 'lucide-react';

interface SidebarProps {
  activePage?: string;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State quản lý mở/đóng của các menu Dropdown
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Dịch vụ thu thập': location.pathname.includes('crawler') || location.pathname.includes('smart-auto'),
    'Hệ thống tự động': location.pathname.includes('auto')
  });

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Cấu trúc Menu
  const menuItems = [
    { name: 'Trang chủ', path: '/home', icon: <Home size={18} /> },
    { name: 'Hồ sơ cá nhân', path: '/profile', icon: <UserIcon /> }, // Fake icon cho giống form mẫu
    { 
      name: 'Dịch vụ thu thập', 
      icon: <Layers size={18} />,
      isDropdown: true,
      subItems: [
        { name: 'Smart Auto AI', path: '/smart-auto' }, 
        { name: 'Cào Web Tĩnh (HTML)', path: '/crawler-html' }, 
        { name: 'Cào Web Động (Browser)', path: '/crawler-browser' },
        { name: 'Kết nối API & JSON', path: '/crawler-api' },
        { name: 'Trích Xuất Regex', path: '/crawler-regex' },
        { name: 'Đọc Báo Thông Minh', path: '/crawler-content' },
        { name: 'Crawl theo từ vựng', path: '/crawler-data' }
      ]
    },
    { name: 'Quản lý nguồn', path: '/sources', icon: <Database size={18} /> },
    { name: 'Yêu thích - Trợ giúp', path: '/favorites', icon: <Heart size={18} /> },
    { 
      name: 'Hệ thống tự động', 
      icon: <Settings size={18} />,
      isDropdown: true,
      subItems: [
        { name: 'Cấu hình lịch chạy', path: '/auto-schedule' }, 
        { name: 'Nhật ký tự động', path: '/auto-history' }
      ]
    },
    { name: 'Lịch sử Crawler', path: '/history', icon: <History size={18} /> },
    { name: 'Xuất dữ liệu', path: '/export-excel', icon: <Download size={18} /> },
    { name: 'Cài đặt tài khoản', path: '/settings', icon: <ShieldAlert size={18} /> }
  ];

  return (
    <>
      <style>{`
        .hutech-scrollbar::-webkit-scrollbar { width: 4px; }
        .hutech-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .hutech-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>

      {/* Màu nền xanh lam đặc trưng HUTECH (#1b4b82) */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#1b4b82] flex flex-col h-screen z-50 font-sans shadow-xl text-white transition-all">
        
        {/* LOGO AREA (Nền tối hơn chút #153c6b) */}
        <div 
          className="h-16 bg-[#153c6b] flex items-center px-5 gap-3 shrink-0 cursor-pointer hover:bg-[#113259] transition-colors"
          onClick={() => navigate('/home')}
        >
          {/* Icon Khiên Vàng (Mô phỏng logo HUTECH) */}
          <div className="w-8 h-8 bg-[#fac031] rounded flex items-center justify-center text-[#153c6b] shadow-sm">
            <Database size={18} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] tracking-wide uppercase leading-tight">CRAWLER AI</span>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest">System v3.0</span>
          </div>
        </div>

        {/* SCROLLABLE MENU */}
        <nav className="flex-1 overflow-y-auto hutech-scrollbar py-4">
          {menuItems.map((item) => {
            
            // Check active cho menu cha
            const isChildActive = item.subItems?.some(sub => location.pathname === sub.path);
            const isActive = location.pathname === item.path || isChildActive;

            return (
              <div key={item.name} className="mb-0.5">
                {/* NÚT BẤM MENU */}
                <button 
                  onClick={() => item.isDropdown ? toggleMenu(item.name) : navigate(item.path!)}
                  className={`w-full flex items-center justify-between px-5 py-3 transition-colors relative
                    ${isActive ? 'bg-[#265e9f] text-white' : 'text-blue-100/80 hover:bg-[#205590] hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="opacity-80">{item.icon}</span>
                    <span className="text-[14px] font-medium tracking-wide">{item.name}</span>
                  </div>
                  
                  {/* Chấm cyan cho item đang active (giống HUTECH) */}
                  {isActive && !item.isDropdown && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1cd4a5] absolute right-5 shadow-[0_0_5px_#1cd4a5]"></div>
                  )}

                  {/* Mũi tên cho Dropdown */}
                  {item.isDropdown && (
                    <span className="opacity-60 text-sm">
                      {openMenus[item.name] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                    </span>
                  )}
                </button>

                {/* DANH SÁCH MENU CON (DROPDOWN) */}
                {item.isDropdown && openMenus[item.name] && (
                  <div className="bg-[#184476] py-1">
                    {item.subItems?.map((sub) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <button
                          key={sub.name}
                          onClick={() => navigate(sub.path)}
                          className={`w-full text-left pl-[44px] pr-5 py-2.5 text-[13px] transition-colors relative
                            ${isSubActive ? 'text-white font-semibold' : 'text-blue-200/70 hover:text-white hover:bg-[#1c4d85]'}
                          `}
                        >
                          {sub.name}
                          
                          {/* Chấm cyan cho menu con */}
                          {isSubActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1cd4a5] absolute right-5 shadow-[0_0_5px_#1cd4a5]"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON TẠI ĐÁY */}
        <div className="p-4 shrink-0 border-t border-white/10">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-blue-200/70 hover:bg-rose-500 hover:text-white transition-colors group"
          >
            <LogOut size={18} className="opacity-80 group-hover:opacity-100" />
            <span className="text-[14px] font-medium tracking-wide">Đăng xuất</span>
          </button>
          <div className="text-center mt-4 mb-2">
            <span className="text-[10px] text-blue-300/40 uppercase tracking-widest font-medium">HUTECH © 2024 - 2026</span>
          </div>
        </div>

      </aside>
    </>
  );
};

// Fake icon component just to fill the list like the image
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export default Sidebar;