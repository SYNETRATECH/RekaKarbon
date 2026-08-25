export interface ApiMetaPagination {
  page?: number;
  limit?: number;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ApiMetaPagination;
}

export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetails;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
