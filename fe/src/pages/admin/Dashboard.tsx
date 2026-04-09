import React from 'react';
import Sidebar from '../../components/Sidebar';

const Dashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b0724]">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Thống kê hệ thống</h1>
          <p className="text-slate-500 dark:text-slate-400">Biểu đồ tổng quan về dữ liệu crawler</p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-[#161b3d] p-10 rounded-[30px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
               <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">Biểu đồ đang được tải...</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center">Các thành phần biểu đồ của Công Huy sẽ được hiển thị tại đây theo đúng thiết kế nguyên bản.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;