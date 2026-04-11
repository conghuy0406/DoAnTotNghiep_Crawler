import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bgImage from "../../assets/anhlogin.jpg"; 
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('remembered_user');
    const savedPass = localStorage.getItem('remembered_key');

    if (savedUser && savedPass) {
      setUsername(savedUser);
      try {
        setPassword(window.atob(savedPass));
        setRememberMe(true);
      } catch (e) {
        console.error("Lỗi giải mã mật khẩu");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await axios.post('/api/v1/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.access_token) {
        // 🌟 Lấy trực tiếp role và full_name từ API Login
        const { access_token, token_type, role, full_name } = response.data;

        // Lưu vào LocalStorage
        localStorage.setItem('token', access_token);
        localStorage.setItem('token_type', token_type);
        localStorage.setItem('role', role || 'user'); // Đã bắt được role admin ở đây
        localStorage.setItem('full_name', full_name || username);
        localStorage.setItem('username', full_name || username); // Dự phòng cho các component cũ
        
        // Xử lý ghi nhớ mật khẩu
        if (rememberMe) {
          localStorage.setItem('remembered_user', username);
          localStorage.setItem('remembered_key', window.btoa(password));
        } else {
          localStorage.removeItem('remembered_user');
          localStorage.removeItem('remembered_key');
        }

        // Điều hướng dựa trên quyền (Role)
        if (role === 'admin') {
          navigate('/dashboard'); // 👑 Bay thẳng vào trang Admin
        } else {
          navigate('/home');      // 👨‍💻 Bay vào trang User
        }
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error.response?.data);
      alert(error.response?.data?.detail || 'Thông tin đăng nhập không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f3f4f9] flex items-center justify-center min-h-screen p-4 font-['Inter']">
      <div className="bg-white flex flex-col md:flex-row max-w-5xl w-full h-full md:h-[600px] overflow-hidden rounded-[40px] shadow-2xl border border-white relative transition-all">
        <div className="hidden md:flex w-[50%] relative overflow-hidden flex-col justify-between p-12 text-white bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="absolute inset-0 bg-indigo-600/30 z-0 backdrop-blur-[2px]"></div> 
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-white flex items-center justify-center rotate-45"><span className="rotate-[-45deg] font-black text-xs">C</span></div>
            <span className="font-bold tracking-widest text-[10px] uppercase opacity-90">Crawler System v3.0</span>
          </div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black leading-[1.1] uppercase italic tracking-tighter mb-4">Start Your <br /><span className="text-indigo-300">Journey!</span></h2>
            <p className="text-sm font-medium opacity-80 max-w-xs leading-relaxed">Hệ thống thu thập dữ liệu dành cho Đồ Án Tốt Nghiệp.</p>
          </div>
        </div>

        <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter">Sign In</h2>
                <p className="text-gray-400 text-sm mt-2 font-medium italic">Chào mừng bạn quay trở lại!</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block ml-1">Email / Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="email@example.com" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block ml-1">Access Key</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="••••••••" required />
              </div>

              <div className="flex items-center justify-between py-2 px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all" />
                    <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className="text-xs text-indigo-500 font-bold hover:underline">Quên mã?</a>
              </div>

              <button type="submit" disabled={loading} className={`w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-[12px] uppercase tracking-widest mt-4 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Connect Now'}
              </button>
            </form>

            <p className="mt-10 text-gray-400 text-xs text-center font-medium">
              Bạn chưa có tài khoản? <Link to="/register" className="text-indigo-600 font-black hover:underline ml-1">Tạo ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;