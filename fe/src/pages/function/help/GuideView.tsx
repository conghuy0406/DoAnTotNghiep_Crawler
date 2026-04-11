import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import { 
  BookOpen, Globe, Code2, Zap, Fingerprint, Sparkles, 
  AlertCircle, CheckCircle2, PlayCircle, HelpCircle
} from 'lucide-react';

const GuideView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('browser');

  const tools = [
    {
      id: 'browser',
      title: 'Công cụ lướt Web Tự động',
      subtitle: 'Dành cho web bán hàng (Shopee, Tiki)',
      icon: <Globe size={24} />,
      color: 'blue',
      description: 'Hệ thống sẽ giả lập một người thật: tự động mở Chrome, tự động kéo chuột xuống cuối trang để ép website hiện ra toàn bộ ảnh và giá tiền bị giấu.',
      tips: [
        '🎯 KHI NÀO DÙNG: Phù hợp nhất khi cào các trang Thương mại điện tử. Các trang này thường bắt bạn phải cuộn chuột xuống thì nó mới tải hình ảnh và giá sản phẩm.',
        '📝 CÁCH DÙNG CƠ BẢN: Bạn chỉ cần dán link Shopee/Tiki vào ô "URL Mục Tiêu" rồi bấm chạy. Hệ thống sẽ tự mò mẫm tìm ra sản phẩm.',
        '⚙️ CÁCH DÙNG NÂNG CAO (Lấy Ảnh, Giá tiền):',
        '1. Bật công tắc "Chế độ Kỹ Sư" lên.',
        '2. Mở tab mới trên Chrome, vào trang Shopee đó, bấm chuột phải chọn "Inspect" (Kiểm tra).',
        '3. Bấm vào mũi tên ở góc trái khung Inspect, chỉ vào tấm ảnh/giá tiền để tìm xem nó có tên là gì (VD: class="price" thì nhập ".price" vào ô Tọa độ Giá).',
        '4. Chờ một chút vì hệ thống phải lướt xong trang web mới trả về kết quả.'
      ]
    },
    {
      id: 'html',
      title: 'Công cụ đọc Mã nguồn',
      subtitle: 'Dành cho web đọc báo, blog',
      icon: <Code2 size={24} />,
      color: 'emerald',
      description: 'Hệ thống sẽ không mở trình duyệt, mà tải thẳng đoạn code mã nguồn của trang web về để bóc tách. Cực kỳ nhanh và tự động 100%.',
      tips: [
        '🎯 KHI NÀO DÙNG: Cực kỳ hoàn hảo để lấy Tiêu đề và Link từ các trang báo (VnExpress, Dân trí, Kênh 14).',
        '⚡ ƯU ĐIỂM: Tốc độ như điện xẹt, mất chưa tới 2 giây là có ngay danh sách 30 bài báo.',
        '📝 CÁCH DÙNG CƠ BẢN: Copy cái link chuyên mục báo (VD: vnexpress.net/the-thao) dán vào ô URL rồi bấm chạy. Vậy là xong!',
        '⚙️ CÁCH DÙNG NÂNG CAO: Bật "Chế độ Kỹ Sư", nhập ".item-news" (Khối Item) và ".title a" (Title/Link) nếu web có cấu trúc quá phức tạp mà hệ thống không tự hiểu được.'
      ]
    },
    {
      id: 'api',
      title: 'Công cụ rút Dữ liệu gốc',
      subtitle: 'Dành cho các trang có kết nối ngầm',
      icon: <Zap size={24} />,
      color: 'indigo',
      description: 'Một số trang web không viết chữ thẳng lên màn hình mà nhận một cục dữ liệu ngầm từ máy chủ. Công cụ này giúp bạn "chặn" cục dữ liệu đó lại.',
      tips: [
        '🎯 KHI NÀO DÙNG: Khi bạn kéo chuột trên web mãi không thấy hết bài (tải thêm liên tục), hoặc khi dùng 2 cách trên không lấy được gì.',
        '🔍 CÁCH TÌM LINK NGẦM (API):',
        '1. Vào trang web, nhấn phím F12 (hoặc chuột phải -> Kiểm tra).',
        '2. Chuyển sang tab "Network" (Mạng), rồi chọn bộ lọc "Fetch/XHR".',
        '3. Cuộn chuột trên trang web, bạn sẽ thấy các dòng nhảy lên ở tab Network. Nhấn vào từng dòng, xem mục "Preview", nếu thấy cấu trúc dạng {"data": [...]} thì đó chính là nó!',
        '4. Copy cái link Request URL dán vào hệ thống của chúng ta. Hệ thống có Trí tuệ Nhân tạo tự bới tung các ngóc ngách để xuất ra file gọn gàng.'
      ]
    },
    {
      id: 'regex',
      title: 'Công cụ Bắt Từ Khóa',
      subtitle: 'Công cụ săn lùng chuyên nghiệp',
      icon: <Fingerprint size={24} />,
      color: 'amber',
      description: 'Bạn dạy cho hệ thống một "câu thần chú" (Biểu thức chính quy). Nó sẽ đi rà soát cả một mớ lộn xộn để nhặt ra đúng những chữ thỏa mãn câu thần chú đó.',
      tips: [
        '🎯 KHI NÀO DÙNG: Khi trang web code quá ẩu, không có class hay id, hoặc khi bạn muốn moi ra tất cả các số điện thoại/email đang nằm rải rác khắp nơi.',
        '📝 CÁCH VIẾT CÂU THẦN CHÚ:',
        '- Dùng ký hiệu (.*?) để yêu cầu hệ thống nhặt lấy phần chữ ở giữa.',
        '- Ví dụ thực tế: Trang web có đoạn <h2 class="head">Tin tức hôm nay</h2>',
        '- Nếu bạn muốn lấy chữ "Tin tức hôm nay", hãy nhập câu thần chú sau:',
        '  <h2 class="head">(.*?)</h2>',
        '💡 Lưu ý: Công cụ này đòi hỏi sự chính xác tuyệt đối. Dư một dấu cách cũng làm nó quét sai.'
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <Sidebar activePage="Hướng Dẫn" />
      
      <div className="flex-1 ml-20 md:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          
          {/* HEADER */}
          <div className="max-w-5xl mx-auto mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
                <BookOpen size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase italic">Help Center</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Trung tâm hỗ trợ người dùng
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            
            {/* LỜI CHÀO */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-[32px] p-8 shadow-xl text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                <HelpCircle size={250} />
              </div>
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-2xl font-black mb-3">Chào mừng bạn đến với Hệ thống lấy tin! 🚀</h2>
                <p className="text-slate-300 font-medium leading-relaxed mb-6">
                  Bạn muốn copy hàng loạt sản phẩm trên Shopee? Hay muốn gom hết tin tức mới nhất về máy tính? Hãy chọn 1 trong 4 công cụ mạnh mẽ bên dưới để bắt đầu. Đừng lo nếu bạn là người mới, chúng tôi đã hướng dẫn từng bước một!
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold text-slate-200">
                  <AlertCircle size={16} className="text-yellow-400" />
                  Mẹo nhỏ: Nếu cào Báo chí, hãy chọn "Đọc Mã nguồn". Nếu cào Shopee, hãy chọn "Lướt Web".
                </div>
              </div>
            </div>

            {/* 4 CÔNG CỤ CHÍNH */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Sổ tay hướng dẫn chi tiết</h3>
              <div className="grid grid-cols-1 gap-6">
                {tools.map((tool) => (
                  <div 
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id)}
                    className={`cursor-pointer transition-all duration-300 rounded-[32px] border-2 p-6 flex flex-col md:flex-row gap-6
                      ${activeTab === tool.id 
                        ? `bg-white border-${tool.color}-500 shadow-lg shadow-${tool.color}-100` 
                        : `bg-slate-50 border-transparent hover:bg-white hover:border-${tool.color}-200 hover:shadow-md`
                      }`}
                  >
                    {/* Phần Giới thiệu Cột trái */}
                    <div className="md:w-1/3 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${tool.color}-50 text-${tool.color}-600`}>
                          {tool.icon}
                        </div>
                        {activeTab === tool.id && <CheckCircle2 size={28} className={`text-${tool.color}-500`} />}
                      </div>
                      <h4 className="text-xl font-black text-slate-800 mb-1">{tool.title}</h4>
                      <p className={`text-xs font-bold uppercase tracking-widest text-${tool.color}-500 mb-4`}>{tool.subtitle}</p>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    
                    {/* Phần Hướng dẫn Cột phải (TĂNG GIỚI HẠN CHIỀU CAO TỐI ĐA LÊN 3000px) */}
                    <div className={`flex-1 transition-all duration-700 overflow-hidden ${activeTab === tool.id ? 'opacity-100 max-h-[3000px]' : 'opacity-0 max-h-0 md:max-h-0 md:opacity-0'}`}>
                      <div className={`h-full p-6 rounded-2xl bg-${tool.color}-50/30 border border-${tool.color}-100`}>
                        <p className={`text-[11px] font-black uppercase tracking-widest text-${tool.color}-600 mb-5 flex items-center gap-2`}>
                          <Sparkles size={14} /> CÁCH SỬ DỤNG TỪ A - Z
                        </p>
                        
                        {/* TĂNG KHOẢNG CÁCH GIỮA CÁC DÒNG (space-y-5) ĐỂ ĐỌC DỄ HƠN */}
                        <div className="space-y-5">
                          {tool.tips.map((tip, idx) => {
                            const hasColon = tip.includes(':');
                            const highlight = hasColon ? tip.split(':')[0] : '';
                            const rest = hasColon ? tip.substring(tip.indexOf(':') + 1) : tip;
                            
                            const isStep = /^[0-9-]\./.test(tip) || tip.startsWith('-');

                            return (
                              <div key={idx} className={`text-[14px] text-slate-700 leading-relaxed flex items-start gap-3 ${isStep ? 'ml-5' : ''}`}>
                                {!isStep && <span className={`text-${tool.color}-500 mt-1`}><PlayCircle size={16} /></span>}
                                <div>
                                  {highlight ? (
                                    <>
                                      <span className={`font-black text-${tool.color}-700 tracking-wide`}>{highlight}:</span>
                                      <span className="font-medium">{rest}</span>
                                    </>
                                  ) : (
                                    <span className="font-medium">{tip}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TÍNH NĂNG AI PHÂN TÍCH */}
            <div className="bg-gradient-to-br from-violet-900 to-fuchsia-900 rounded-[32px] p-8 shadow-xl text-white mt-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-fuchsia-500/30 text-fuchsia-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-fuchsia-500/50">
                  <Sparkles size={12} /> Tính năng độc quyền
                </div>
                <h3 className="text-2xl font-black mb-3">AI Đọc Hiểu Thông Minh</h3>
                <p className="text-violet-200 text-sm leading-relaxed mb-6 font-medium">
                  Cào được danh sách về rồi thì làm gì tiếp? Hãy nhấn nút <b>"AI PHÂN TÍCH"</b>. Hệ thống Trí tuệ Nhân tạo của Google sẽ đọc toàn bộ dữ liệu vừa cào được và viết cho bạn một bản báo cáo tuyệt đẹp!
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-fuchsia-50"><CheckCircle2 size={18} className="text-fuchsia-400"/> Bạn cào Shopee? AI sẽ tự tìm món rẻ nhất, giảm giá sâu nhất.</li>
                  <li className="flex items-center gap-3 text-sm text-fuchsia-50"><CheckCircle2 size={18} className="text-fuchsia-400"/> Bạn cào Tin tức? AI sẽ tự động tóm tắt 3 chủ đề nóng nhất hôm nay.</li>
                  <li className="flex items-center gap-3 text-sm text-fuchsia-50"><CheckCircle2 size={18} className="text-fuchsia-400"/> Tiết kiệm hàng giờ đồng hồ ngồi đọc và gom dữ liệu bằng mắt thường.</li>
                </ul>
              </div>
              <div className="w-full md:w-1/3 bg-black/30 rounded-3xl p-6 backdrop-blur-md border border-white/10">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-2.5 bg-white/20 rounded-full w-3/4"></div>
                  <div className="h-2.5 bg-white/20 rounded-full w-full"></div>
                  <div className="h-2.5 bg-white/20 rounded-full w-5/6"></div>
                  <div className="h-10 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl w-2/3 mt-6 flex items-center justify-center gap-2 text-sm font-black shadow-lg shadow-fuchsia-500/50"><Sparkles size={16}/> AI PHÂN TÍCH</div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default GuideView;