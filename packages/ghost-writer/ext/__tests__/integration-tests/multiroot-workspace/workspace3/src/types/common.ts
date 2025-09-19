
// Shared types: workspace3/src/types/common.ts
export interface ApiResponse<T> {
    data: T
    success: boolean
    message?: string
}

export interface PaginationParams {
    page: number
    limit: number
}

export interface SearchParams {
    query: string
    filters?: Record<string, any>
}
