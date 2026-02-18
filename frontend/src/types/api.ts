// Generic API response types

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiMeta {
  [key: string]: unknown;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
}

export interface ApiErrorResponse {
  errors: ApiError[];
}
