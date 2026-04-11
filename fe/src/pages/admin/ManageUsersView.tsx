import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { 
  Users, Shield, User, Trash2, ShieldAlert, Loader2, Search, Mail
} from 'lucide-react';

const ManageUsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Lấy dữ liệu danh sách user khi vào trang
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      // Gọi API lấy danh sách user từ router auth của Backend
      const res = await axios.get('/api/v1/auth/admin/users', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setUsers(res.data);
    } catch (error: any) {
      alert("Lỗi tải danh sách tài khoản: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Đổi quyền (Role)
  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = newRole === 'admin' 
      ? "Thăng cấp người này lên làm Admin (Quản trị viên)?" 
      : "Giáng cấp người này xuống làm User thường?";
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/v1/auth/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Cập nhật quyền thành công!");
      fetchUsers(); // Refresh lại bảng
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.detail || "Không thể đổi quyền"));
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`🚨 NGUY HIỂM: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${email} không? Hành động này không thể hoàn tác!`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/auth/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Đã xóa tài khoản!");
      fetchUsers();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.detail || "Không thể xóa tài khoản"));
    }
  };

  // Lọc dữ liệu theo thanh tìm kiếm
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Quản lý Tài khoản" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-6xl mx-auto mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#1b4b82] shadow-md rounded-2xl flex items-center justify-center text-white">
                <Users size={32} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Users Management</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> Trung tâm quản trị đặc quyền
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* THANH TÌM KIẾM & THỐNG KÊ */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#1b4b82] transition-colors" />
                <input 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Tìm kiếm Email hoặc Tên..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-[#1b4b82] transition-all"
                />
              </div>
              <div className="flex gap-4">
                <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-3">
                  <User size={16} className="text-blue-500"/>
                  <span className="text-xs font-black text-blue-700 uppercase tracking-widest">
                    Tổng User: <span className="text-lg ml-1">{users.filter(u => u.role !== 'admin').length}</span>
                  </span>
                </div>
                <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex items-center gap-3">
                  <ShieldAlert size={16} className="text-rose-500"/>
                  <span className="text-xs font-black text-rose-700 uppercase tracking-widest">
                    Tổng Admin: <span className="text-lg ml-1">{users.filter(u => u.role === 'admin').length}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* BẢNG DANH SÁCH USER */}
            <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <Loader2 size={40} className="text-slate-300 animate-spin mb-4" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="p-6">Tài khoản</th>
                        <th className="p-6">ID Hệ thống</th>
                        <th className="p-6">Vai trò (Role)</th>
                        <th className="p-6 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((user, idx) => (
                        <tr key={user.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                          
                          {/* CỘT 1: THÔNG TIN */}
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shadow-sm ${user.role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-orange-400' : 'bg-[#1b4b82]'}`}>
                                {user.role === 'admin' ? <Shield size={20}/> : <User size={20}/>}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 text-[15px] mb-0.5">{user.full_name || "Chưa cập nhật tên"}</h3>
                                <p className="text-[12px] font-medium text-slate-400 flex items-center gap-1.5"><Mail size={12}/> {user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* CỘT 2: ID */}
                          <td className="p-6">
                            <code className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-mono">{user.id}</code>
                          </td>

                          {/* CỘT 3: ROLE */}
                          <td className="p-6">
                            {user.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <ShieldAlert size={12}/> ADMIN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <User size={12}/> USER
                              </span>
                            )}
                          </td>

                          {/* CỘT 4: HÀNH ĐỘNG */}
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              {/* Nút đổi quyền */}
                              <button 
                                onClick={() => handleChangeRole(user.id, user.role)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.role === 'admin' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                              >
                                {user.role === 'admin' ? 'Hạ cấp' : 'Thăng cấp'}
                              </button>
                              
                              {/* Nút Xóa */}
                              <button 
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                                title="Xóa tài khoản"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-20 text-slate-400 font-medium">Không tìm thấy tài khoản nào.</div>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageUsersView;