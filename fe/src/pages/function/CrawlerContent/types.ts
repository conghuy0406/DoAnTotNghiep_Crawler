
export interface ExtractRequest {
  url: string;
}

export interface ExtractResponse {
  url: string;
  title: string;
  content: string;
  extraction_method: string;
  status: string;
}