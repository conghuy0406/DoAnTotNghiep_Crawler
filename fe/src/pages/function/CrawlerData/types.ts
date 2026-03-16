// types.ts
export interface CrawlerSource {
  _id: string; // Sử dụng _id theo dữ liệu mẫu
  name: string;
  base_url: string;
  search_url_template: string;
}

export interface CrawlerResult {
  id: number;
  title: string;
  price: string;
  link: string;
  platform: string;
}