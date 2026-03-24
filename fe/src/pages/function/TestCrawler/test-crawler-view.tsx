import React, { useState } from 'react';
import { TabType } from './types';
// Import API (Bạn đảm bảo file src/api/crawlApi.ts đã có các hàm này như hướng dẫn trước)
import { 
    testCrawlApi, testCrawlRegex, testCrawlBrowser, 
    testCrawlHtml, testCrawlSmartAuto 
} from '../../../api/crawlApi';

const TestCrawlerView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('API');
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<any>(null);

    // --- State dùng chung cho tất cả các Form ---
    const [url, setUrl] = useState(''); // Dùng chung cho Regex, Browser, Html, Smart
    
    // --- State riêng cho API ---
    const [apiUrl, setApiUrl] = useState('');
    const [apiMethod, setApiMethod] = useState('GET');
    
    // --- State riêng cho Regex ---
    const [regexPattern, setRegexPattern] = useState('');
    
    // --- State riêng cho HTML / Browser ---
    const [postItemSel, setPostItemSel] = useState('');
    const [titleSel, setTitleSel] = useState('');

    // Hàm gọi API tương ứng khi bấm nút "Chạy"
    const handleExecute = async () => {
        setLoading(true);
        setResult(null); // Reset kết quả cũ
        try {
            let resData;
            switch (activeTab) {
                case 'API':
                    resData = await testCrawlApi({ api_url: apiUrl, api_method: apiMethod });
                    break;
                case 'REGEX':
                    resData = await testCrawlRegex({ url, regex_pattern: regexPattern });
                    break;
                case 'BROWSER':
                    resData = await testCrawlBrowser({ url, post_item_sel: postItemSel, title_sel: titleSel });
                    break;
                case 'HTML':
                    resData = await testCrawlHtml({ url, post_item_sel: postItemSel, title_sel: titleSel });
                    break;
                case 'SMART':
                    resData = await testCrawlSmartAuto({ url });
                    break;
            }
            setResult(resData);
        } catch (error: any) {
            setResult({ error: "Lỗi Call API: " + error.message });
        } finally {
            setLoading(false);
        }
    };
    // ==================================================
    // HÀM MỚI: LƯU CẤU HÌNH XUỐNG DATABASE
    // ==================================================
    const handleSaveConfig = async () => {
        const sourceName = prompt("Nhập tên cho Nguồn cào này (VD: Báo Dân Trí - Tin Mới):");
        if (!sourceName) return; // Người dùng bấm Hủy

        try {
            // 1. Lấy URL đang test (nếu là Tab API thì dùng apiUrl, còn lại dùng url chung)
            const currentUrl = activeTab === 'API' ? apiUrl : url;
            if (!currentUrl) {
                alert("Vui lòng nhập đường dẫn Web/API trước khi lưu!");
                return;
            }

            // 2. Tách lấy base_url
            let baseUrl = "https://unknown.com";
            try {
                baseUrl = new URL(currentUrl).origin;
            } catch (e) {
                console.warn("URL không đúng định dạng chuẩn");
            }

            // 3. Xác định Phương pháp Cào (Mapping với Backend)
            let method = "HTML";
            if (activeTab === 'API') method = "API";
            if (activeTab === 'REGEX') method = "REGEX";
            if (activeTab === 'BROWSER') method = "SELENIUM"; // Backend lưu là SELENIUM
            if (activeTab === 'HTML') method = "HTML";
            if (activeTab === 'SMART') method = "SMART_AUTO";

            // 4. Gói dữ liệu theo đúng chuẩn SourceConfig của Backend (file source.py)
            const payload = {
                name: sourceName,
                base_url: baseUrl,
                search_url_template: currentUrl,
                is_active: true,
                crawl_method: method,
                
                selectors: {
                    post_item: postItemSel || "",
                    title_link: titleSel || ""
                },
                regex_pattern: regexPattern || "",
                api_config: {
                    method: apiMethod || "GET",
                    headers: {},
                    body: {}
                }
            };

            // 5. Gọi API POST lưu xuống Database
            // Đảm bảo URL này khớp với port Backend của bạn (thường là 8000)
            const response = await fetch("http://localhost:8000/api/v1/sources/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert("🎉 " + result.message);
            } else {
                alert("❌ Lỗi: " + (result.detail || "Không thể lưu cấu hình"));
            }
        } catch (error) {
            console.error("Lỗi khi lưu cấu hình:", error);
            alert("❌ Đã có lỗi xảy ra khi kết nối với máy chủ!");
        }
    };
    // Style dùng chung để code đỡ rối
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' as const };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '16px', marginBottom: '24px' }}>
                    🕷️ Hệ thống Test Crawl (5 API)
                </h2>
                
                {/* MENU 5 TABS (GIỐNG SWAGGER) */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #1890ff', paddingBottom: '10px' }}>
                    {['API', 'REGEX', 'BROWSER', 'HTML', 'SMART'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => { setActiveTab(tab as TabType); setResult(null); }}
                            style={{
                                padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', border: 'none',
                                backgroundColor: activeTab === tab ? '#1890ff' : '#e6f7ff',
                                color: activeTab === tab ? '#fff' : '#1890ff',
                                borderRadius: '4px'
                            }}>
                            {tab === 'API' ? '1. API Request' : 
                             tab === 'REGEX' ? '2. Regex' : 
                             tab === 'BROWSER' ? '3. Playwright (Web động)' : 
                             tab === 'HTML' ? '4. HTML Tĩnh' : '5. Smart Auto'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                    {/* CỘT TRÁI: FORM ĐỘNG THEO TAB */}
                    <div style={{ flex: 1 }}>
                        
                        {/* FORM 1: API */}
                        {activeTab === 'API' && (
                            <div>
                                <label style={labelStyle}>Đường dẫn API (api_url):</label>
                                <input style={inputStyle} value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.openweathermap.org/..." />
                                
                                <label style={labelStyle}>Phương thức (api_method):</label>
                                <select style={inputStyle} value={apiMethod} onChange={e => setApiMethod(e.target.value)}>
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                </select>
                            </div>
                        )}

                        {/* FORM 2: REGEX */}
                        {activeTab === 'REGEX' && (
                            <div>
                                <label style={labelStyle}>Đường dẫn Web (url):</label>
                                <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://dantri.com.vn/..." />
                                
                                <label style={labelStyle}>Biểu thức Regex (regex_pattern):</label>
                                <input style={inputStyle} value={regexPattern} onChange={e => setRegexPattern(e.target.value)} placeholder='href="(.*?)" title="(.*?)"' />
                            </div>
                        )}

                        {/* FORM 3 & 4: BROWSER & HTML */}
                        {(activeTab === 'BROWSER' || activeTab === 'HTML') && (
                            <div>
                                <label style={labelStyle}>Đường dẫn Web (url):</label>
                                <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://vnexpress.net/..." />
                                
                                <label style={labelStyle}>CSS Selector Khung bài viết (post_item_sel):</label>
                                <input style={inputStyle} value={postItemSel} onChange={e => setPostItemSel(e.target.value)} placeholder=".article-item" />
                                
                                <label style={labelStyle}>CSS Selector Tiêu đề (title_sel):</label>
                                <input style={inputStyle} value={titleSel} onChange={e => setTitleSel(e.target.value)} placeholder="h3.title a" />
                            </div>
                        )}

                        {/* FORM 5: SMART AUTO */}
                        {activeTab === 'SMART' && (
                            <div>
                                <label style={labelStyle}>Đường dẫn Web TMĐT (Tiki, Shopee):</label>
                                <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://shopee.vn/..." />
                            </div>
                        )}

                        {/* NÚT SUBMIT VÀ NÚT LƯU */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button 
                                onClick={handleExecute} 
                                disabled={loading}
                                style={{ 
                                    flex: 1, padding: '12px', fontSize: '16px', fontWeight: 'bold',
                                    backgroundColor: loading ? '#ccc' : '#52c41a', color: '#fff', 
                                    border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' 
                                }}>
                                {loading ? '⏳ ĐANG XỬ LÝ...' : '🚀 CHẠY KIỂM THỬ GIAO THỨC'}
                            </button>

                            <button 
                                onClick={handleSaveConfig} 
                                disabled={loading}
                                style={{ 
                                    flex: 1, padding: '12px', fontSize: '16px', fontWeight: 'bold',
                                    backgroundColor: loading ? '#ccc' : '#1890ff', color: '#fff', 
                                    border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' 
                                }}>
                                💾 LƯU CẤU HÌNH NÀY
                            </button>
                        </div>
                    </div>

                    {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
                    <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ backgroundColor: '#333', padding: '10px 16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', color: '#fff', fontWeight: 'bold' }}>
                            📋 Server Response
                        </div>
                        <div style={{ padding: '16px', overflowY: 'auto', maxHeight: '500px', color: '#52c41a', fontFamily: 'monospace', fontSize: '14px' }}>
                            {result ? (
                                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            ) : (
                                <span style={{ color: '#888' }}>// Trạng thái: Đang chờ lệnh...</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCrawlerView;