import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// @ts-ignore
import bgImage from "../../assets/anhlogin.jpg"; 
import axiosClient from "../../api/axiosClient"; // Dùng axiosClient của bạn là chuẩn bài

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Gọi API đăng ký qua axiosClient
      await axiosClient.post('/api/v1/auth/register', {
        email: email,
        password: password,
        full_name: fullName 
      });
      
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      // Đăng ký xong đẩy thẳng về trang Đăng nhập
      navigate('/login');
      
    } catch (error: any) {
      console.error("Chi tiết lỗi:", error.response?.data);
      // Hiển thị lỗi chi tiết từ Backend (ví dụ: "Email này đã được sử dụng")
      alert(error.response?.data?.detail || "Đăng ký thất bại! Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f3f4f9] flex items-center justify-center min-h-screen p-4 font-['Inter']">
      <div className="bg-white flex flex-col md:flex-row-reverse max-w-5xl w-full md:h-[620px] overflow-hidden rounded-[40px] shadow-xl border border-white relative transition-all">
        
        {/* --- CỘT HÌNH NỀN (Phía bên phải) --- */}
        <div 
          className="hidden md:flex w-[50%] relative flex-col justify-end p-12 text-white bg-cover bg-center" 
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-indigo-600/30 z-0 backdrop-blur-[2px]"></div>
          
          {/* Logo góc trên (Cho đồng bộ với form Login) */}
          <div className="absolute top-12 left-12 z-10 flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-white flex items-center justify-center rotate-45"><span className="rotate-[-45deg] font-black text-xs">C</span></div>
            <span className="font-bold tracking-widest text-[10px] uppercase opacity-90">Crawler System v3.0</span>
          </div>

          <div className="relative z-10 text-right">
            <h2 className="text-5xl font-black italic uppercase leading-[1.1] tracking-tighter">
              Join The <br/>
              <span className="text-indigo-300">Network!</span>
            </h2>
            <p className="mt-4 text-sm font-medium opacity-80 max-w-xs ml-auto">Trở thành một phần của hệ thống Crawler dữ liệu chuyên nghiệp.</p>
          </div>
        </div>

        {/* --- CỘT FORM (Giao diện sáng) --- */}
        <div className="flex-1 bg-white p-8 md:p-14 flex flex-col justify-center relative">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-8 text-left">
              <h2 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter">Register</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium italic">Tạo tài khoản mới để bắt đầu trải nghiệm.</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" 
                  placeholder="Tên hiển thị của bạn" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" 
                  placeholder="email@example.com" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" 
                  placeholder="••••••••" 
                  required 
                  minLength={6} // Thêm validate tối thiểu 6 ký tự
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-[12px] uppercase tracking-widest mt-6 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'CREATE ACCOUNT'}
              </button>
            </form>

            <p className="mt-8 text-center text-gray-400 text-xs font-medium">
              Already a member? 
              <Link to="/login" className="text-indigo-600 font-black hover:underline italic ml-1">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;