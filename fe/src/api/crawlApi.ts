// Đường dẫn chính xác: src/api/crawlApi.ts

const API_BASE_URL = "http://localhost:8000";

export const testCrawlApi = async (payload: { api_url: string; api_method: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/crawl-test/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};

export const testCrawlRegex = async (payload: { url: string; regex_pattern: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/crawl-test/regex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};

export const testCrawlBrowser = async (payload: { url: string; post_item_sel: string; title_sel: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/crawl-test/browser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};

export const testCrawlHtml = async (payload: { url: string; post_item_sel: string; title_sel: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/crawl-test/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};

export const testCrawlSmartAuto = async (payload: { url: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/crawl-test/smart-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};