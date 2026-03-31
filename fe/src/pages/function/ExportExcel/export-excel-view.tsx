import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { ExportExcelRequest, ExportUIState } from './types';

const ExportExcelView: React.FC = () => {
  const [filters, setFilters] = useState<ExportExcelRequest>({
    keyword: '',
    only_bookmarked: false
  });

  const [uiState, setUiState] = useState<ExportUIState>({
    isExporting: false,
    message: null,
    status: 'idle'
  });

  const handleExport = async () => {
    setUiState({ ...uiState, isExporting: true, status: 'loading', message: 'Đang khởi tạo tệp Excel...' });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/v1/export/excel`, {
        params: {
          keyword: filters.keyword || undefined,
          only_bookmarked: filters.only_bookmarked
        },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Bao_cao_AI_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setUiState({ isExporting: false, status: 'success', message: 'Tải tệp thành công!' });
      setTimeout(() => setUiState((prev: ExportUIState) => ({ ...prev, message: null })), 3000);
    } catch (error) {
      setUiState({ isExporting: false, status: 'error', message: 'Lỗi xuất tệp. Kiểm tra Backend!' });
    }
  };

  return (
    // Đổi bg sang xám nhạt (Slate-50) và chữ đen (Slate-900)
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar activePage="Xuất Excel" />

      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen relative">
        {/* Hiệu ứng kính (Glassmorphism) sáng hơn */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-200/30 rounded-full blur-[120px] -mr-80 -mt-80"></div>
        
        <main className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Header sáng với Gradient nhẹ */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-cyan-600 rounded-full shadow-[0_0_10px_rgba(8,145,178,0.3)]"></div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-800">
                  Data <span className="text-cyan-600">Exporter</span>
                </h1>
              </div>
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.5em] pl-5">
                Multi-threaded Database to Excel v3.0
              </p>
            </div>

            {/* Panel chính: Trắng tinh khôi, viền mềm, shadow sâu */}
            <div className="bg-white border border-slate-200 p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
              <div className="space-y-8">
                
                {/* Input Section */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                      Lọc theo từ khóa
                    </label>
                    <input 
                      type="text" 
                      placeholder="Nhập từ khóa..."
                      value={filters.keyword}
                      onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                      // Input sáng, viền xanh nhẹ khi focus
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-300"
                    />
                  </div>

                  {/* Checkbox Styled */}
                  <label className="flex items-center gap-4 cursor-pointer p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-cyan-200 hover:bg-white transition-all shadow-sm group/item">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={filters.only_bookmarked}
                        onChange={(e) => setFilters({ ...filters, only_bookmarked: e.target.checked })}
                        className="peer appearance-none w-6 h-6 rounded-lg border-2 border-slate-200 bg-white checked:bg-cyan-600 checked:border-cyan-600 transition-all cursor-pointer"
                      />
                      <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover/item:text-cyan-700 transition-colors">
                      Chỉ xuất các bản ghi đã lưu (Bookmark)
                    </span>
                  </label>
                </div>

                {/* Nút bấm Export: Xanh đậm sắc nét */}
                <button 
                  onClick={handleExport}
                  disabled={uiState.isExporting}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3
                    ${uiState.isExporting 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 hover:bg-cyan-700 text-white shadow-xl hover:shadow-cyan-200 active:scale-[0.98]'
                    }`}
                >
                  {uiState.isExporting ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Xác nhận xuất Excel
                    </>
                  )}
                </button>

                {uiState.message && (
                  <p className={`text-center text-[10px] font-black uppercase tracking-widest animate-pulse ${uiState.status === 'error' ? 'text-red-500' : 'text-cyan-600'}`}>
                    {uiState.message}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Status */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/50 rounded-3xl border border-white">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
              </div>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic font-serif">Hào Nguyễn - Graduation Project</span>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ExportExcelView;