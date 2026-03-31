import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/login/Login';
import Register from '../pages/login/Register'; 
import Dashboard from '../pages/admin/Dashboard';
import Home from '../pages/user/Home';
import CrawlerDataView from '../pages/function/CrawlerData/crawler-data-view';
import CrawlerContentView from '../pages/function/CrawlerContent/crawler-content-view';
import HistoryCrawlerView from '../pages/function/HistoryCrawler/history-crawler-view';
import HistoryDetailView from '../pages/function/HistoryCrawler/history-detail-view';
import ExportExcelView from '../pages/function/ExportExcel/export-excel-view'; 
import FavoritesDetailView from '../pages/function/Favorites/favorites-detail-view';

// --- BƯỚC 1: THÊM IMPORT GIAO DIỆN TEST CRAWL VÀO ĐÂY ---
import TestCrawlerView from '../pages/function/TestCrawler/test-crawler-view';

const AppRoutes = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); 

  const isAuthenticated = !!token;
  const isAdmin = userRole === 'admin';

  return (
    <Routes>
      {/* Điều hướng gốc */}
      <Route path="/" element={
        isAuthenticated 
          ? (isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />)
          : <Navigate to="/login" replace />
      } />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> 
      
      <Route 
        path="/home" 
        element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} 
      />
      
      {/* Chức năng Crawler cho User */}
      <Route 
        path="/crawler-data" 
        element={isAuthenticated ? <CrawlerDataView /> : <Navigate to="/login" replace />} 
      />
      
      <Route 
        path="/crawler-content" 
        element={isAuthenticated ? <CrawlerContentView /> : <Navigate to="/login" replace />} 
      />

      {/* --- BƯỚC 2: KHAI BÁO ROUTE CHO TEST CRAWL --- */}
      <Route 
        path="/admin/test-crawler" 
        element={isAuthenticated ? <TestCrawlerView /> : <Navigate to="/login" replace />} 
      />

      {/* Quản lý Lịch sử */}
      <Route 
        path="/history" 
        element={isAuthenticated ? <HistoryCrawlerView /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/history/:id" 
        element={isAuthenticated ? <HistoryDetailView /> : <Navigate to="/login" replace />} 
      />

      {/* Route Xuất dữ liệu Excel */}
      <Route 
        path="/export-excel" 
        element={isAuthenticated ? <ExportExcelView /> : <Navigate to="/login" replace />} 
      />

      {/* DỰ PHÒNG: Route Cài đặt */}
      <Route 
        path="/settings" 
        element={isAuthenticated ? <div className="text-white ml-64 p-10">Setting Page (Coming Soon)</div> : <Navigate to="/login" replace />} 
      />

      {/* Routes dành riêng cho ADMIN */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated && isAdmin ? <Dashboard /> : <Navigate to="/home" replace />} 
      />
      
      {/* ĐÃ FIX: Chỗ này lúc trước là <Navigate to="/favorites" replace /> gây lỗi vòng lặp */}
      <Route 
        path="/favorites" 
        element={isAuthenticated ? <FavoritesDetailView /> : <Navigate to="/login" replace />} 
      />

      {/* Mặc định đẩy về trang chủ phù hợp */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;