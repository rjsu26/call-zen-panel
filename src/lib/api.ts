/**
 * Base URL for the backend API
 * In production, this might be a relative URL or a full domain
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Interface for API error responses
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: any;
}

/**
 * Interface for API success responses
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(status: number, data: ApiErrorResponse) {
    super(data.message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Interface for pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Interface for paginated response data
 */
export interface PaginatedResponse<T> {
  transcripts: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Interface for call transcript filter options
 */
export interface CallTranscriptFilter {
  customerName?: string;
  customerUniqueId?: string;
  supportAgentId?: string;
  categoryOfCall?: string;
  callResolutionStatus?: string;
  customerTier?: string;
  issueSeverity?: string;
  startDate?: string;
  endDate?: string;
  minSatisfactionScore?: number;
  maxSatisfactionScore?: number;
  followUpRequired?: string;
}

/**
 * Interface for dashboard statistics
 */
export interface DashboardStats {
  totalCalls: number;
  averageSatisfactionScore: number;
  callsByCategory: Array<{ category: string; count: number }>;
  callsByResolution: Array<{ status: string; count: number }>;
  callsByTier: Array<{ tier: string; count: number }>;
  callsBySeverity: Array<{ severity: string; count: number }>;
  averageCallDuration: number;
  followUpRequiredCount: number;
  callTrends: Array<{ date: string; count: number; averageSatisfaction: number }>;
}

/**
 * Zod schema for call transcript validation
 */
export interface CallTranscript {
  id?: number;
  customer_name: string;
  customer_unique_id: string;
  support_agent_name: string;
  support_agent_id: string;
  call_transcript: string;
  overall_satisfaction_score: number; // 1 - 10
  category_of_call: string;
  call_duration: number; // minutes
  call_date_time: string; // ISO / YYYY-MM-DD HH:MM:SS
  call_resolution_status: string;
  escalation_level: string;
  follow_up_required: 'Yes' | 'No';
  customer_tier: string;
  issue_severity: string;
  agent_experience_level: string;
  customer_previous_contact_count: number;
  created_at?: string;
}

/**
 * Type for creating a new call transcript
 */
export type CreateCallTranscriptDto = Omit<CallTranscript, 'id' | 'created_at'>;

/**
 * Type for updating an existing call transcript
 */
export type UpdateCallTranscriptDto = Partial<CreateCallTranscriptDto>;

/**
 * Base API client for making requests to the backend
 */
class ApiClient {
  /**
   * Make a fetch request to the API
   * @param endpoint API endpoint
   * @param options Fetch options
   * @returns Promise with the API response
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiSuccessResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Parse the response as JSON
      const data = await response.json();

      // Check if the response is successful
      if (!response.ok) {
        throw new ApiError(response.status, data as ApiErrorResponse);
      }

      // Validate that the response has the expected structure
      if (!data.success) {
        throw new ApiError(response.status, data as ApiErrorResponse);
      }

      return data as ApiSuccessResponse<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors or other unexpected errors
      throw new ApiError(500, {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * Get all call transcripts with optional filtering and pagination
   * @param filter Optional filter criteria
   * @param pagination Optional pagination options
   * @returns Promise with paginated call transcripts
   */
  async getAllTranscripts(
    filter?: CallTranscriptFilter,
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<CallTranscript>> {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add pagination parameters
    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());
    
    // Add filter parameters if provided
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await this.fetch<PaginatedResponse<CallTranscript>>(
      `/transcripts?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Get a single call transcript by ID
   * @param id Transcript ID
   * @returns Promise with the call transcript
   */
  async getTranscriptById(id: number): Promise<CallTranscript> {
    const response = await this.fetch<CallTranscript>(`/transcripts/${id}`);
    return response.data;
  }

  /**
   * Create a new call transcript
   * @param transcriptData Transcript data to create
   * @returns Promise with the created call transcript
   */
  async createTranscript(transcriptData: CreateCallTranscriptDto): Promise<CallTranscript> {
    const response = await this.fetch<CallTranscript>('/transcripts', {
      method: 'POST',
      body: JSON.stringify(transcriptData)
    });
    
    return response.data;
  }

  /**
   * Update an existing call transcript
   * @param id Transcript ID
   * @param updateData Data to update
   * @returns Promise with the updated call transcript
   */
  async updateTranscript(
    id: number,
    updateData: UpdateCallTranscriptDto
  ): Promise<CallTranscript> {
    const response = await this.fetch<CallTranscript>(`/transcripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    return response.data;
  }

  /**
   * Delete a call transcript
   * @param id Transcript ID
   * @returns Promise indicating success
   */
  async deleteTranscript(id: number): Promise<boolean> {
    const response = await this.fetch<{ deleted: boolean }>(`/transcripts/${id}`, {
      method: 'DELETE'
    });
    
    return true;
  }

  /**
   * Process a directory of transcript files
   * @param directoryPath Path to the directory containing transcript files
   * @returns Promise with the processing result
   */
  async processTranscriptDirectory(directoryPath: string): Promise<{
    processedCount: number;
    createdIds: number[];
  }> {
    const response = await this.fetch<{
      processedCount: number;
      createdIds: number[];
    }>('/transcripts/bulk', {
      method: 'POST',
      body: JSON.stringify({ directoryPath })
    });
    
    return response.data;
  }

  /**
   * Get dashboard statistics
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Promise with dashboard statistics
   */
  async getDashboardStats(
    startDate?: string,
    endDate?: string
  ): Promise<DashboardStats> {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    const response = await this.fetch<DashboardStats>(
      `/transcripts/stats?${params.toString()}`
    );
    
    return response.data;
  }
}

// Export a singleton instance of the API client
export const api = new ApiClient();

// Export default for convenience
export default api;
