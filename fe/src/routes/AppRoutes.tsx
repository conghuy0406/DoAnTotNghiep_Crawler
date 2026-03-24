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

const AppRoutes = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); 

  const isAuthenticated = !!token;
  const isAdmin = userRole === 'admin';

  return (
    <Routes>
      {/* 1. ĐIỀU HƯỚNG GỐC */}
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

      {/* 10. ADMIN DASHBOARD */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated && isAdmin ? <Dashboard /> : <Navigate to="/home" replace />} 
      />

      {/* 11. MẶC ĐỊNH */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;