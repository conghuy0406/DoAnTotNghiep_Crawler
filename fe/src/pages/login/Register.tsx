import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import bgImage from "../../assets/anhlogin.jpg";

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
      await axiosClient.post('/api/v1/auth/register', {
        email: email,
        password: password,
        full_name: fullName 
      });
      alert("Đăng ký thành công!");
      navigate('/login');
    } catch (error: any) {
      console.error("Chi tiết lỗi:", error.response?.data);
      alert(error.response?.data?.detail || "Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f3f4f9] flex items-center justify-center min-h-screen p-4 font-['Inter']">
      <div className="bg-white flex flex-col md:flex-row-reverse max-w-5xl w-full md:h-[620px] overflow-hidden rounded-[40px] shadow-xl border border-white">
        
        {/* --- CỘT HÌNH NỀN (Phía bên phải) --- */}
        <div 
          className="hidden md:flex w-[50%] relative flex-col justify-end p-12 text-white bg-cover bg-center" 
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-indigo-600/20"></div>
          <div className="relative z-10 text-right">
            <h2 className="text-5xl font-black italic uppercase leading-[1.1] tracking-tighter">
              Join The <br/>
              <span className="text-indigo-400">Network!</span>
            </h2>
            <p className="mt-4 text-sm font-medium opacity-80">Trở thành một phần của hệ thống Crawler dữ liệu chuyên nghiệp.</p>
          </div>
        </div>

        {/* --- CỘT FORM (Giao diện sáng) --- */}
        <div className="flex-1 bg-white p-8 md:p-14 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-8 text-left">
              <h2 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter">Register</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium">Tạo tài khoản mới để bắt đầu trải nghiệm.</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" 
                  placeholder="Tên đăng nhập" 
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
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-[12px] uppercase tracking-widest mt-6 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "INITIALIZING..." : "CREATE ACCOUNT"}
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