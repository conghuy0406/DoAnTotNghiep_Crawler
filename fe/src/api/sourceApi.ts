// FILE: src/api/sourceApi.ts
import axios from 'axios';

export const saveSourceConfigToServer = async (configData: any) => {
  // 1. Hỏi tên cấu hình
  const sourceName = prompt("Nhập tên cho Nguồn cào này (VD: Báo VNExpress - Công nghệ):");
  if (!sourceName) return; 

  try {
    const token = localStorage.getItem('token');
    
    // 2. Gộp tên vào payload
    const finalPayload = {
      ...configData,
      name: sourceName,
      is_active: true
    };

    // 3. Bắn xuống Backend
    const response = await axios.post('http://localhost:8000/api/v1/sources/', finalPayload, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      }
    });

    if (response.data) {
      alert("🎉 Đã lưu cấu hình thành công! Hãy vào mục Quản Lý Nguồn để xem.");
    }
  } catch (error: any) {
    alert("❌ Lỗi khi lưu: " + (error.response?.data?.detail || error.message));
  }
};