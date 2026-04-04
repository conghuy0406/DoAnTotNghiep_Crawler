import axios from 'axios';

const axiosClient = axios.create({
  // Xóa link Ngrok backend đi, chỉ để vầy thôi:
  baseURL: '/', 
  
  headers: {
    'Content-Type': 'application/json',
    // Giờ không bị chặn nữa nên dòng ngrok-skip... xóa luôn cũng được
  },
});

export default axiosClient;