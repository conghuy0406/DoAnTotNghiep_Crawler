import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Layers, Database, Heart, Settings, 
  History, Download, ShieldAlert,
  ChevronDown, ChevronRight, LogOut, BookOpen,
  Users, Globe // Thêm icon Globe cho nhóm Admin
} from 'lucide-react';

interface SidebarProps {
  activePage?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // LẤY QUYỀN (ROLE) TỪ LOCAL STORAGE
  const userRole = localStorage.getItem('role') || 'user';

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Dịch vụ thu thập': location.pathname.includes('crawler') || location.pathname.includes('smart-auto'),
    'Hệ thống tự động': location.pathname.includes('auto')
  });

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  // 🌟 NÂNG CẤP: CHIA MENU THÀNH TỪNG NHÓM (GROUPS) ĐỂ KHÔNG BỊ RỐI
  const menuGroups = [
    {
      heading: "TỔNG QUAN",
      roles: ['user', 'admin'], // Ai cũng thấy
      items: [
        // Tự động đổi link trang chủ nếu là admin
        { name: 'Trang chủ', path: userRole === 'admin' ? '/dashboard' : '/home', icon: <Home size={18} /> },
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
        {
          name: 'Hệ thống tự động',
          icon: <Settings size={18} />,
          isDropdown: true,
          subItems: [
            { name: 'Cấu hình lịch chạy', path: '/auto-schedule' }, 
            { name: 'Nhật ký tự động', path: '/auto-history' }
          ]
        }
      ]
    },
    {
      heading: "QUẢN LÝ CÁ NHÂN",
      roles: ['user', 'admin'], // Ai cũng thấy
      items: [
        { name: 'Nguồn của tôi', path: '/sources', icon: <Database size={18} /> },
        { name: 'Lịch sử của tôi', path: '/history', icon: <History size={18} /> },
        { name: 'Yêu thích - Trợ giúp', path: '/favorites', icon: <Heart size={18} /> },
        { name: 'Xuất dữ liệu', path: '/export-excel', icon: <Download size={18} /> },
        { name: 'Hướng dẫn sử dụng', path: '/guide', icon: <BookOpen size={18} /> },
      ]
    },
    {
      heading: "QUẢN TRỊ HỆ THỐNG",
      roles: ['admin'], // 🌟 CHỈ ADMIN MỚI NHÌN THẤY NHÓM NÀY
      items: [
        { name: 'Quản lý Tài khoản', path: '/manage-users', icon: <Users size={18} className="text-rose-400" /> },
        { name: 'Kho Mẫu Toàn Cục', path: '/global-sources', icon: <Globe size={18} className="text-amber-400" /> },
        { name: 'Lịch sử Server', path: '/global-history', icon: <ShieldAlert size={18} className="text-emerald-400" /> },
      ]
    }
  ];

  return (
    <>
      <style>{`
        .hutech-scrollbar::-webkit-scrollbar { width: 4px; }
        .hutech-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .hutech-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>

      <aside className="fixed inset-y-0 left-0 w-64 bg-[#1b4b82] flex flex-col h-screen z-50 font-sans shadow-xl text-white transition-all">
        
        {/* LOGO AREA */}
        <div 
          className="h-16 bg-[#153c6b] flex items-center px-5 gap-3 shrink-0 cursor-pointer hover:bg-[#113259] transition-colors border-b border-white/5"
          onClick={() => navigate(userRole === 'admin' ? '/dashboard' : '/home')}
        >
          <div className="w-8 h-8 bg-[#fac031] rounded flex items-center justify-center text-[#153c6b] shadow-sm">
            <Database size={18} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] tracking-wide uppercase leading-tight">CRAWLER AI</span>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest flex items-center gap-1">
              System v3.0 {userRole === 'admin' && <span className="text-rose-400 font-black">| ADMIN</span>}
            </span>
          </div>
        </div>

        {/* SCROLLABLE MENU BẰNG CÁCH MAP QUA TỪNG NHÓM */}
        <nav className="flex-1 overflow-y-auto hutech-scrollbar py-4">
          {menuGroups.filter(group => group.roles.includes(userRole)).map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              
              {/* Tiêu đề của từng Nhóm (Heading) */}
              <div className="px-5 mb-2 text-[10px] font-black text-blue-300/50 uppercase tracking-[0.2em]">
                {group.heading}
              </div>

              {/* Render các chức năng trong nhóm */}
              {group.items.map((item) => {
                const isChildActive = item.isDropdown && item.subItems?.some(sub => location.pathname === sub.path || activePage === sub.name);
                const isActive = location.pathname === item.path || isChildActive || activePage === item.name;

                return (
                  <div key={item.name} className="mb-0.5">
                    <button 
                      onClick={() => item.isDropdown ? toggleMenu(item.name) : navigate(item.path!)}
                      className={`w-full flex items-center justify-between px-5 py-2.5 transition-colors relative
                        ${isActive ? 'bg-[#265e9f] text-white' : 'text-blue-100/80 hover:bg-[#205590] hover:text-white'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="opacity-80">{item.icon}</span>
                        <span className={`text-[13px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                          {item.name}
                        </span>
                      </div>
                      
                      {isActive && !item.isDropdown && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1cd4a5] absolute right-5 shadow-[0_0_5px_#1cd4a5]"></div>
                      )}

                      {item.isDropdown && (
                        <span className="opacity-60 text-sm">
                          {openMenus[item.name] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                        </span>
                      )}
                    </button>

                    {/* Mở menu con (Dropdown) */}
                    {item.isDropdown && openMenus[item.name] && (
                      <div className="bg-[#184476] py-1">
                        {item.subItems?.map((sub) => {
                          const isSubActive = location.pathname === sub.path || activePage === sub.name;
                          return (
                            <button
                              key={sub.name}
                              onClick={() => navigate(sub.path)}
                              className={`w-full text-left pl-[46px] pr-5 py-2.5 text-[12px] transition-colors relative
                                ${isSubActive ? 'text-white font-semibold' : 'text-blue-200/70 hover:text-white hover:bg-[#1c4d85]'}
                              `}
                            >
                              {sub.name}
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
            </div>
          ))}
        </nav>

        {/* LOGOUT BUTTON TẠI ĐÁY */}
        <div className="p-4 shrink-0 border-t border-white/5 bg-[#153c6b]/50">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-blue-200/70 hover:bg-rose-500 hover:text-white transition-colors group"
          >
            <LogOut size={18} className="opacity-80 group-hover:opacity-100" />
            <span className="text-[13px] font-bold tracking-wide">Đăng xuất</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;