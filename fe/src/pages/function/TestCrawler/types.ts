// Định nghĩa chính xác các trường dữ liệu Backend đang cần
export interface ApiPayload {
    api_url: string;
    api_method: string;
    headers?: Record<string, string>; // Tùy chọn
    payload?: Record<string, any>;    // Tùy chọn
}

export interface RegexPayload {
    url: string;
    regex_pattern: string;
}

export interface HtmlBrowserPayload {
    url: string;
    post_item_sel: string;
    title_sel: string;
}

export interface SmartPayload {
    url: string;
}

// Kiểu dữ liệu để chuyển Tab
export type TabType = 'API' | 'REGEX' | 'BROWSER' | 'HTML' | 'SMART';