import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    open: true,
    allowedHosts: true, // Cho phép tên miền Ngrok đi qua
    
    // Đưa proxy vào BÊN TRONG khối server
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Trỏ thẳng về Backend FastAPI
        changeOrigin: true,
        secure: false,
      }
    }
  }
})