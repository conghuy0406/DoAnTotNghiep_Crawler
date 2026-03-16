export interface StructuredDataItem {
  label: string;
  value: string | number;
}
export interface CrawlerExportData {
  _id: string;
  keyword: string;
  category: string;
  sentiment: string;
  summary: string;
  key_highlights: string[];
  structured_data: StructuredDataItem[];
  created_at: string | Date;
  is_bookmarked?: boolean;
}
export type ExportResponse = Blob;

export interface ExportExcelRequest {
  keyword: string;
  only_bookmarked: boolean;
}
export interface ExportUIState {
  isExporting: boolean;
  message: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}