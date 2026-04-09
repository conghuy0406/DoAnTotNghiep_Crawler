import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { 
  UserPlus, Search, Edit2, Trash2, Mail, 
  Shield, User, Check, X, Filter 
} from 'lucide-react';
import axios from 'axios';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', password: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert("Lỗi khi xóa người dùng");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/v1/auth/register', newUser);
      setShowAddModal(false);
      setNewUser({ email: '', full_name: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      alert("Lỗi khi thêm người dùng");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0b1120] font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">QUẢN LÝ NGƯỜI DÙNG</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Danh sách tài khoản truy cập hệ thống Crawler</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#1b4b82] hover:bg-[#153c6b] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            <UserPlus size={20} />
            Thêm người dùng
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/5 mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <Filter size={18} />
          </button>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white dark:bg-[#1e293b] rounded-[30px] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Vai trò</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">Không tìm thấy người dùng</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        {user.full_name?.[0]?.toUpperCase() || <User size={18}/>}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{user.full_name || 'Hội viên'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      user.role === 'admin' 
                        ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="opacity-50" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER STATS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[24px] border border-slate-100 dark:border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
                <User size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng cộng</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white">{users.length} <span className="text-sm font-medium text-slate-400 ml-1 italic text-lowercase">Người dùng</span></h4>
              </div>
           </div>
        </div>

      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Thêm tài khoản mới</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X/></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Họ và tên</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email đăng nhập</label>
                  <input 
                    type="email" required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@gmail.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mật khẩu</label>
                  <input 
                    type="password" required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Vai trò</label>
                   <select 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                   >
                     <option value="user">User (Người dùng thường)</option>
                     <option value="admin">Admin (Quản trị viên)</option>
                   </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#1b4b82] text-white py-4 rounded-2xl font-black mt-4 hover:shadow-lg hover:shadow-blue-900/20 list-none transition-all"
                >
                  Xác nhận thêm
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
