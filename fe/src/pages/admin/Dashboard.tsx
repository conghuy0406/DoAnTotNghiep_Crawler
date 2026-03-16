import React from 'react';
// 1. Import Sidebar từ thư mục components
import Sidebar from '../../components/Sidebar'; 

import Charts from '../../components/Charts';

const UserDashboard = () => {
  return (
    // 2. Sử dụng 'flex' để chia màn hình thành cột dọc (Sidebar bên trái)
    <div className="flex min-h-screen bg-[#050214]">
      
      {/* THANH SIDEBAR CỐ ĐỊNH */}
      <Sidebar />
        {/* Nội dung Dashboard cuộn được */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Charts />
            <div className="bg-[#0b0724] border border-white/5 rounded-[30px] p-6 shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                    Thống kê Crawler
                </h3>
                {/* Nội dung thống kê của bạn */}
            </div>
          </div>
    
        </main>
      </div>
  
  );
};

export default UserDashboard;