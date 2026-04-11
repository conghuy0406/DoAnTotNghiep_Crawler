import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/login/Login';
import Register from '../pages/login/Register'; 
import Dashboard from '../pages/admin/Dashboard';
import Home from '../pages/user/Home';

// ✅ CẬP NHẬT ĐÚNG THEO CẤU TRÚC THƯ MỤC MỚI
import CrawlerHTMLView from '../pages/function/CrawlerHtml/crawler-html-view'; 
import CrawlerContentView from '../pages/function/CrawlerContent/crawler-content-view';
import HistoryCrawlerView from '../pages/function/HistoryCrawler/history-crawler-view';
import HistoryDetailView from '../pages/function/HistoryCrawler/history-detail-view';
import ExportExcelView from '../pages/function/ExportExcel/export-excel-view'; 
import CrawlerApiView from '../pages/function/CrawlerApi/crawler-api-view';
import RegexTestView from '../pages/function/CrawlerRegex/crawler-regex-view'; 
import BrowserCrawlerView from '../pages/function/CrawlerBrowser/crawler-browser-view'; 
import FavoritesDetailView from '../pages/function/Favorites/favorites-detail-view';
import SmartAutoView from '../pages/function/CrawlerAuto/crawler-auto-view';
import AutoScheduleView from '../pages/function/AutoSchedule/auto-schedule-view';
import AutoHistoryView from '../pages/function/AutoSchedule/history-view';
import SourceManagerView from '../pages/function/SourceManager/source-manager-view'; 

import GuideView from '../pages/function/help/GuideView';
import ManageUsersView from '../pages/admin/ManageUsersView';
import GlobalHistoryView from '../pages/admin/global-history-view.tsx';
import GlobalSourceView from '../pages/admin/global-source-view';
// ==========================================
// 🌟 THÊM IMPORT CHO CÁC TRANG CÒN THIẾU 
// ==========================================
import CrawlerDataView from '../pages/function/CrawlerData/crawler-data-view';
import TestCrawlerView from '../pages/function/TestCrawler/test-crawler-view';

const AppRoutes = () => {
  // Lấy trạng thái đăng nhập và quyền từ LocalStorage
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); 

  const isAuthenticated = !!token;
  const isAdmin = userRole === 'admin';

  return (
    <Routes>
      {/* 1. ĐIỀU HƯỚNG GỐC (MẶC ĐỊNH SẼ ĐẨY VỀ HOME/DASHBOARD TÙY QUYỀN) */}
      <Route path="/" element={
        isAuthenticated 
          ? (isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />)
          : <Navigate to="/login" replace />
      } />

      {/* 2. AUTHENTICATION */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> 
      
      {/* 3. TRANG CHỦ USER */}
      <Route 
        path="/home" 
        element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} 
      />
      
      {/* 4. CHỨC NĂNG CRAWLER CHÍNH */}
      {/* ✅ ROUTE SMART AUTO (AI TỰ ĐỘNG NHẬN DIỆN) */}
      <Route 
        path="/smart-auto" 
        element={isAuthenticated ? <SmartAutoView /> : <Navigate to="/login" replace />} 
      />

      <Route 
        path="/crawler-html" 
        element={isAuthenticated ? <CrawlerHTMLView /> : <Navigate to="/login" replace />} 
      />
      
      <Route 
        path="/crawler-content" 
        element={isAuthenticated ? <CrawlerContentView /> : <Navigate to="/login" replace />} 
      />

      {/* ========================================== */}
      {/* 🌟 ROUTES CHO CÁC TRANG CÒN THIẾU */}
      {/* ========================================== */}
      <Route 
        path="/crawler-data" 
        element={isAuthenticated ? <CrawlerDataView /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/test-crawler" 
        element={isAuthenticated ? <TestCrawlerView /> : <Navigate to="/login" replace />} 
      />

      {/* 5. CRAWLER API */}
      <Route 
        path="/crawler-api" 
        element={isAuthenticated ? <CrawlerApiView /> : <Navigate to="/login" replace />} 
      />

      {/* 5b. CRAWLER REGEX */}
      <Route 
        path="/crawler-regex" 
        element={isAuthenticated ? <RegexTestView /> : <Navigate to="/login" replace />} 
      />

      {/* 5c. CRAWLER BROWSER */}
      <Route 
        path="/crawler-browser" 
        element={isAuthenticated ? <BrowserCrawlerView /> : <Navigate to="/login" replace />} 
      />

      {/* 5d. QUẢN LÝ NGUỒN CÀO */}
      <Route 
        path="/sources" 
        element={isAuthenticated ? <SourceManagerView /> : <Navigate to="/login" replace />} 
      />

      {/* 6. QUẢN LÝ LỊCH SỬ */}
      <Route 
        path="/history" 
        element={isAuthenticated ? <HistoryCrawlerView /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/history/:id" 
        element={isAuthenticated ? <HistoryDetailView /> : <Navigate to="/login" replace />} 
      />

      {/* 7. XUẤT DỮ LIỆU EXCEL */}
      <Route 
        path="/export-excel" 
        element={isAuthenticated ? <ExportExcelView /> : <Navigate to="/login" replace />} 
      />

      {/* 8. YÊU THÍCH */}
      <Route 
        path="/favorites" 
        element={isAuthenticated ? <FavoritesDetailView /> : <Navigate to="/login" replace />} 
      />

      {/* 9. SETTINGS */}
      <Route 
        path="/settings" 
        element={isAuthenticated ? <div className="text-white ml-64 p-10 font-bold uppercase italic">Setting Page (Coming Soon)</div> : <Navigate to="/login" replace />} 
      />

      {/* 10. ADMIN DASHBOARD & QUẢN LÝ TÀI KHOẢN (BẢO MẬT 2 LỚP) */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated && isAdmin ? <Dashboard /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/manage-users" 
        element={isAuthenticated && isAdmin ? <ManageUsersView /> : <Navigate to="/" replace />} 
      />
      <Route 
  path="/global-history" 
  element={isAuthenticated && isAdmin ? <GlobalHistoryView /> : <Navigate to="/" replace />} 
/>
<Route 
  path="/global-sources" 
  element={isAuthenticated && isAdmin ? <GlobalSourceView /> : <Navigate to="/" replace />} 
/>
      
      {/* 11. HỆ THỐNG TỰ ĐỘNG LÊN LỊCH & HƯỚNG DẪN */}
      <Route path="/auto-schedule" element={isAuthenticated ? <AutoScheduleView /> : <Navigate to="/login" replace />} />
      <Route path="/auto-history" element={isAuthenticated ? <AutoHistoryView /> : <Navigate to="/login" replace />} />
      <Route path="/guide" element={isAuthenticated ? <GuideView /> : <Navigate to="/login" replace />} />

      {/* 12. MẶC ĐỊNH BẮT CÁC ĐƯỜNG DẪN LỖI (404) ĐẨY VỀ TRANG CHỦ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;