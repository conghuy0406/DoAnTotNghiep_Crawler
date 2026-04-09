import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AddFavoritesProps {
  reportId: string;
  initialStatus: boolean;
  onStatusChange?: (newStatus: boolean) => void;
}

const AddFavorites: React.FC<AddFavoritesProps> = ({ reportId, initialStatus, onStatusChange }) => {
  const [isBookmarked, setIsBookmarked] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsBookmarked(initialStatus);
  }, [initialStatus, reportId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!reportId) {
      console.error("❌ Lỗi: reportId bị undefined hoặc null!");
      return;
    }

    // ✅ BỎ LOCALHOST: Dùng đường dẫn tương đối qua Proxy
    const url = `/api/v1/bookmarks/${reportId}`;
    const token = localStorage.getItem('token');

    try {
      setLoading(true);
      
      // Cấu hình Header vì BE đã bật hệ thống Auth
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (isBookmarked) {
        // DELETE để gỡ bookmark
        await axios.delete(url, config);
        setIsBookmarked(false);
        if (onStatusChange) onStatusChange(false);
      } else {
        // POST để thêm bookmark
        await axios.post(url, {}, config);
        setIsBookmarked(true);
        if (onStatusChange) onStatusChange(true);
      }
    } catch (error: any) {
      // In lỗi gốc từ Backend ra console để dễ check
      const serverError = error.response?.data?.detail;
      console.error("❌ Lỗi Backend gốc:", serverError || error.message);
      
      // Nếu lỗi 404, nghĩa là bài này chưa có trong DB universal_knowledge
      if (error.response?.status === 404) {
        alert("Bài viết này chưa được lưu vào hệ thống, không thể bookmark!");
      } else if (error.response?.status === 401) {
        alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
      } else {
        alert("Lỗi: " + (serverError || "Không kết nối được server"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[40px] ${
        isBookmarked ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:bg-slate-100'
      }`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin"></div>
      ) : (
        <svg 
          className={`w-6 h-6 transition-transform active:scale-90 ${isBookmarked ? 'fill-current' : 'fill-none'}`} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
};

export default AddFavorites;