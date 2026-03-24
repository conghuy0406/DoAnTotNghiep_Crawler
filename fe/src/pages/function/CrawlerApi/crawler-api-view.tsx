import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';
import { Search, Loader2, Globe, ExternalLink, Newspaper, Zap } from 'lucide-react';

const CrawlerApiView: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [foundTotal, setFoundTotal] = useState<number | null>(null);

  /**
   * Hàm Parser: Tối ưu để 'quét' đúng Tiêu đề và Link từ VnExpress
   * Sửa lỗi 'Tiêu đề đang cập nhật'
   */
  const parseRawContent = (item: any) => {
    // Nếu BE đã lọc sẵn (ví dụ cào từ API sạch) thì dùng luôn
    if (item.title && item.title !== "Tiêu đề đang cập nhật") return item;

    const rawHtml = item.raw_html_chunk || "";
    if (!rawHtml) return null; // Bỏ qua bài báo không có dữ liệu

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // 1. Lấy Tiêu đề & Link: Nhắm thẳng vào thẻ <a> có title hoặc trong thẻ h3
    const aTag = doc.querySelector('h3 a, h2 a, .title-news a, a[title]');
    const title = aTag?.getAttribute('title') || aTag?.textContent?.trim() || "Tiêu đề bài báo";
    const link = aTag?.getAttribute('href') || "#";

    // 2. Lấy Mô tả & Sửa lỗi dính chữ
    const pTag = doc.querySelector('.description, p');
    let description = pTag?.textContent?.trim() || "Nhấn xem chi tiết để đọc nội dung...";
    description = description.replace(/\.([^\s])/g, '. $1'); // Thêm khoảng trắng sau dấu chấm

    // 3. Lấy Ảnh: Xử lý Lazy load (data-src) của VnExpress
    const imgTag = doc.querySelector('img');
    const image = imgTag?.getAttribute('data-src') || imgTag?.getAttribute('src') || "";

    return { title, link, description, image };
  };

  const handleSearch = async () => {
    if (!keyword) return alert("Vui lòng, nhập từ khóa tìm kiếm");
    setLoading(true);
    setNewsResults([]); // Xóa kết quả cũ
    setFoundTotal(null);

    try {
      const token = localStorage.getItem('token');
      // Payload để cào Universal (VnExpress)
      const payloadData = {
        method: "HTML",
        url_template: "https://timkiem.vnexpress.net/?q={query}",
        keyword: keyword,
        post_item_sel: "article.item-news" 
      };

      const res = await axios.post('http://localhost:8000/api/v1/crawl-test/execute-universal', payloadData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.status === "success") {
        // Áp dụng hàm parse và lọc bỏ kết quả null
        const cleanedData = (res.data.data || [])
          .map((item: any) => parseRawContent(item))
          .filter((item: any) => item !== null);

        setNewsResults(cleanedData);
        setFoundTotal(cleanedData.length);
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi kết nốis, Vui lòng thử lại sau nhé!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden text-slate-700">
      <Sidebar activePage="Crawler API" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header: Đưa lên sát trên, loại bỏ khung thừa */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-3.5 rounded-2xl text-white">
                     <Zap className="w-6 h-6" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black uppercase italic tracking-tight text-slate-900">Crawler <span className="text-indigo-600"> Api</span></h1>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tìm kiếm tin tức trực tiếp từ các trang báo lớn</p>
                  </div>
               </div>
            </div>

            {/* Search Bar Giao diện User */}
            <div className="bg-white p-3 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Nhập chủ đề tìm kiếm (ví dụ: xe điện, AI...)"
                  className="w-full bg-slate-50/50 border-none rounded-[22px] py-5 pl-16 pr-8 font-bold text-slate-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-slate-900 text-white font-black px-10 py-5 rounded-[22px] text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {loading ? "Đang xử lý..." : "Tìm kiếm"}
              </button>
            </div>

            {/* News Stream Area (Hủy Grid, dùng List cho gọn) */}
            <div className="space-y-6">
              {foundTotal !== null && (
                <div className="flex items-center gap-4 px-2">
                  <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full">
                    KẾT QUẢ TÌM KIẾM ({foundTotal})
                  </span>
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                </div>
              )}

              {newsResults.length > 0 ? (
                <div className="space-y-6 pb-12">
                  {newsResults.map((item, index) => (
                    <div key={index} className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-7 flex gap-7 items-center group hover:shadow-xl hover:border-indigo-100 transition-all">
                      {/* Thumbnail nhỏ gọn bên trái */}
                      <div className="w-40 h-32 bg-slate-100 rounded-3xl overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt="thumb" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-100 bg-indigo-50/20">
                             <Newspaper className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* Content bên phải */}
                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-3 mb-2.5">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5">
                              <Newspaper className="w-3.5 h-3.5" /> VnExpress
                           </span>
                           <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                           <span className="text-[9px] font-bold text-slate-400">Live Data</span>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 leading-tight mb-3 line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic">
                          {item.description}
                        </p>
                      </div>

                      {/* Nút External Link */}
                      <a 
                         href={item.link} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex-shrink-0 bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                      >
                         <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : !loading && (
                <div className="py-24 flex flex-col items-center justify-center opacity-40 bg-white rounded-[40px] border border-slate-100">
                   <div className="bg-slate-50 p-7 rounded-full mb-5 text-slate-300">
                      <Search className="w-12 h-12" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Nhập từ khóa bên trên và nhấn 'Tìm kiếm'</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CrawlerApiView;