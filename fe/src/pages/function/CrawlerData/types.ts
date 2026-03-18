// types.ts
export interface CrawlerSource {
  _id: string; 
  name: string;
  base_url: string;
  search_url_template: string;
}

export interface CrawlerResult {
  _id?: string;      // ID từ MongoDB (nếu có)
  title: string;     // Tiêu đề bài báo
  url: string;       // Link bài báo (BE trả về 'url', không phải 'link')
  source?: string;   // Tên nguồn (VnExpress, v.v.)
  content?: string;  // Nội dung tóm tắt
  published_date?: string; 
}