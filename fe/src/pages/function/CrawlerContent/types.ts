export interface ExtractRequest {
  url: string;
}

export interface ExtractResponse {
  // ID định danh từ MongoDB (Bắt buộc để thực hiện Bookmark/Delete)
  _id: string; 
  
  url: string;
  title: string;
  content: string;
  extraction_method: string;
  status: string;

  // Thêm các trường này để hiển thị thông tin chi tiết hơn nếu cần
  category?: string;
  sentiment?: string;
  
  // Trạng thái bookmark để UI đồng bộ ngay khi load dữ liệu
  is_bookmarked?: boolean;
  bookmarked_at?: string;
  
  // Thời gian hệ thống
  created_at?: string;
}