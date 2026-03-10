import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/login/Login';
import Register from '../pages/login/Register'; 
import Dashboard from '../pages/admin/Dashboard';
import Home from '../pages/user/Home';
import CrawlerDataView from '../pages/function/CrawlerData/crawler-data-view';
import CrawlerContentView from '../pages/function/CrawlerContent/crawler-content-view';


const AppRoutes = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); 

  const isAuthenticated = !!token;
  const isAdmin = userRole === 'admin';

  return (
    <Routes>
      {/* 1. Điều hướng gốc: Admin vào thẳng Dashboard, User vào Home */}
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
      
      {/* Chuyển 2 chức năng này sang cho User sử dụng */}
      <Route 
        path="/crawler-data" 
        element={isAuthenticated ? <CrawlerDataView /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/crawler-content" 
        element={isAuthenticated ? <CrawlerContentView /> : <Navigate to="/login" replace />} 
      />

      {/* 3. Routes dành riêng cho ADMIN */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated && isAdmin ? <Dashboard /> : <Navigate to="/home" replace />} 
      />

      {/* 4. Mặc định đẩy về trang chủ phù hợp */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;