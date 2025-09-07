import fs from 'fs';
import path from 'path';
import { executeQuery, executeStatement } from '../database/database';
import { 
  CallTranscript, 
  CallTranscriptRaw, 
  CreateCallTranscriptDto, 
  UpdateCallTranscriptDto 
} from '../types/CallTranscript';

/**
 * Filter options for retrieving call transcripts
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
 * Pagination options for retrieving call transcripts
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  totalCalls: number;
  averageSatisfactionScore: number;
  callsByCategory: CategoryCount[];
  callsByResolution: ResolutionCount[];
  callsByTier: TierCount[];
  callsBySeverity: SeverityCount[];
  averageCallDuration: number;
  followUpRequiredCount: number;
  callTrends: CallTrend[];
}

interface CategoryCount {
  category: string;
  count: number;
}

interface ResolutionCount {
  status: string;
  count: number;
}

interface TierCount {
  tier: string;
  count: number;
}

interface SeverityCount {
  severity: string;
  count: number;
}

interface CallTrend {
  date: string;
  count: number;
  averageSatisfaction: number;
}

/**
 * Service for managing call transcript operations
 */
export class CallTranscriptService {
  /**
   * Create a new call transcript record
   * @param transcriptData The call transcript data to create
   * @returns The created call transcript with ID
   */
  async createCallTranscript(transcriptData: CreateCallTranscriptDto): Promise<CallTranscript> {
    try {
      // ------------------------------------------------------------------
      // 1. Duplicate-prevention check
      // ------------------------------------------------------------------
      // A transcript is considered duplicate if the same customer,
      // agent and call date-time combination already exists.
      const duplicateCheckSql = `
        SELECT id 
        FROM call_transcripts
        WHERE customer_unique_id = ?
          AND call_date_time     = ?
          AND support_agent_id   = ?
        LIMIT 1
      `;
      const duplicate = await executeQuery<{ id: number }>(duplicateCheckSql, [
        transcriptData.customer_unique_id,
        transcriptData.call_date_time,
        transcriptData.support_agent_id
      ]);

      if (duplicate.length > 0) {
        // Duplicate found – abort insertion
        throw new Error('Duplicate call transcript detected');
      }

      // ------------------------------------------------------------------
      // 2. Validate the transcript data (existing validation logic)
      // ------------------------------------------------------------------
      this.validateTranscriptData(transcriptData);

      const columns = Object.keys(transcriptData).join(', ');
      const placeholders = Object.keys(transcriptData).map(() => '?').join(', ');
      const values = Object.values(transcriptData);

      const sql = `INSERT INTO call_transcripts (${columns}) VALUES (${placeholders})`;
      let result;
      try {
        result = await executeStatement(sql, values);
      } catch (err: any) {
        // Handle UNIQUE constraint violation at SQLite level
        // (e.g., if the composite unique index blocked the insert)
        if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
          throw new Error('Duplicate call transcript detected');
        }
        throw err;
      }

      // Retrieve the newly created record
      return this.getCallTranscriptById(result.lastID);
    } catch (error) {
      console.error('Error creating call transcript:', error);
      throw error;
    }
  }

  /**
   * Get all call transcripts with optional filtering and pagination
   * @param filter Optional filter criteria
   * @param pagination Optional pagination options
   * @returns Array of call transcripts matching the criteria
   */
  async getAllCallTranscripts(
    filter?: CallTranscriptFilter,
    pagination?: PaginationOptions
  ): Promise<{ transcripts: CallTranscript[], total: number }> {
    try {
      let whereClause = '';
      const params: any[] = [];

      // Build WHERE clause based on filter criteria
      if (filter) {
        const conditions: string[] = [];

        if (filter.customerName) {
          conditions.push('customer_name LIKE ?');
          params.push(`%${filter.customerName}%`);
        }

        if (filter.customerUniqueId) {
          conditions.push('customer_unique_id = ?');
          params.push(filter.customerUniqueId);
        }

        if (filter.supportAgentId) {
          conditions.push('support_agent_id = ?');
          params.push(filter.supportAgentId);
        }

        if (filter.categoryOfCall) {
          conditions.push('category_of_call = ?');
          params.push(filter.categoryOfCall);
        }

        if (filter.callResolutionStatus) {
          conditions.push('call_resolution_status = ?');
          params.push(filter.callResolutionStatus);
        }

        if (filter.customerTier) {
          conditions.push('customer_tier = ?');
          params.push(filter.customerTier);
        }

        if (filter.issueSeverity) {
          conditions.push('issue_severity = ?');
          params.push(filter.issueSeverity);
        }

        if (filter.startDate) {
          conditions.push('call_date_time >= ?');
          params.push(filter.startDate);
        }

        if (filter.endDate) {
          conditions.push('call_date_time <= ?');
          params.push(filter.endDate);
        }

        if (filter.minSatisfactionScore !== undefined) {
          conditions.push('overall_satisfaction_score >= ?');
          params.push(filter.minSatisfactionScore);
        }

        if (filter.maxSatisfactionScore !== undefined) {
          conditions.push('overall_satisfaction_score <= ?');
          params.push(filter.maxSatisfactionScore);
        }

        if (filter.followUpRequired) {
          conditions.push('follow_up_required = ?');
          params.push(filter.followUpRequired);
        }

        if (conditions.length > 0) {
          whereClause = `WHERE ${conditions.join(' AND ')}`;
        }
      }

      // Count total records matching the filter
      const countSql = `SELECT COUNT(*) as total FROM call_transcripts ${whereClause}`;
      const countResult = await executeQuery<{ total: number }>(countSql, params);
      const total = countResult[0]?.total || 0;

      // Build pagination clause
      let paginationClause = '';
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        paginationClause = `LIMIT ${pagination.limit} OFFSET ${offset}`;
      }

      // Get records with pagination
      const sql = `
        SELECT * FROM call_transcripts 
        ${whereClause} 
        ORDER BY call_date_time DESC 
        ${paginationClause}
      `;
      
      const transcripts = await executeQuery<CallTranscript>(sql, params);
      
      return { transcripts, total };
    } catch (error) {
      console.error('Error getting call transcripts:', error);
      throw error;
    }
  }

  /**
   * Get a single call transcript by ID
   * @param id The ID of the call transcript to retrieve
   * @returns The call transcript with the specified ID
   */
  async getCallTranscriptById(id: number): Promise<CallTranscript> {
    try {
      const sql = 'SELECT * FROM call_transcripts WHERE id = ?';
      const transcripts = await executeQuery<CallTranscript>(sql, [id]);
      
      if (transcripts.length === 0) {
        throw new Error(`Call transcript with ID ${id} not found`);
      }
      
      return transcripts[0];
    } catch (error) {
      console.error(`Error getting call transcript with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing call transcript
   * @param id The ID of the call transcript to update
   * @param updateData The data to update
   * @returns The updated call transcript
   */
  async updateCallTranscript(
    id: number, 
    updateData: UpdateCallTranscriptDto
  ): Promise<CallTranscript> {
    try {
      // Check if transcript exists
      await this.getCallTranscriptById(id);
      
      // Prepare update statement
      const setClause = Object.keys(updateData)
        .map(key => `${this.camelToSnake(key)} = ?`)
        .join(', ');
      
      const values = [...Object.values(updateData), id];
      
      const sql = `UPDATE call_transcripts SET ${setClause} WHERE id = ?`;
      await executeStatement(sql, values);
      
      // Return updated transcript
      return this.getCallTranscriptById(id);
    } catch (error) {
      console.error(`Error updating call transcript with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a call transcript
   * @param id The ID of the call transcript to delete
   * @returns True if deletion was successful
   */
  async deleteCallTranscript(id: number): Promise<boolean> {
    try {
      // Check if transcript exists
      await this.getCallTranscriptById(id);
      
      const sql = 'DELETE FROM call_transcripts WHERE id = ?';
      await executeStatement(sql, [id]);
      
      return true;
    } catch (error) {
      console.error(`Error deleting call transcript with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get statistics for the dashboard
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Dashboard statistics
   */
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    try {
      let whereClause = '';
      const params: any[] = [];
      
      if (startDate || endDate) {
        const conditions: string[] = [];
        
        if (startDate) {
          conditions.push('call_date_time >= ?');
          params.push(startDate);
        }
        
        if (endDate) {
          conditions.push('call_date_time <= ?');
          params.push(endDate);
        }
        
        if (conditions.length > 0) {
          whereClause = `WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      // Get total calls
      const totalCallsSql = `SELECT COUNT(*) as count FROM call_transcripts ${whereClause}`;
      const totalCallsResult = await executeQuery<{ count: number }>(totalCallsSql, params);
      const totalCalls = totalCallsResult[0]?.count || 0;
      
      // Get average satisfaction score
      const avgSatisfactionSql = `
        SELECT AVG(overall_satisfaction_score) as average 
        FROM call_transcripts ${whereClause}
      `;
      const avgSatisfactionResult = await executeQuery<{ average: number }>(avgSatisfactionSql, params);
      const averageSatisfactionScore = avgSatisfactionResult[0]?.average || 0;
      
      // Get calls by category
      const categoryCountSql = `
        SELECT category_of_call as category, COUNT(*) as count 
        FROM call_transcripts ${whereClause}
        GROUP BY category_of_call
        ORDER BY count DESC
      `;
      const callsByCategory = await executeQuery<CategoryCount>(categoryCountSql, params);
      
      // Get calls by resolution status
      const resolutionCountSql = `
        SELECT call_resolution_status as status, COUNT(*) as count 
        FROM call_transcripts ${whereClause}
        GROUP BY call_resolution_status
        ORDER BY count DESC
      `;
      const callsByResolution = await executeQuery<ResolutionCount>(resolutionCountSql, params);
      
      // Get calls by customer tier
      const tierCountSql = `
        SELECT customer_tier as tier, COUNT(*) as count 
        FROM call_transcripts ${whereClause}
        GROUP BY customer_tier
        ORDER BY count DESC
      `;
      const callsByTier = await executeQuery<TierCount>(tierCountSql, params);
      
      // Get calls by issue severity
      const severityCountSql = `
        SELECT issue_severity as severity, COUNT(*) as count 
        FROM call_transcripts ${whereClause}
        GROUP BY issue_severity
        ORDER BY count DESC
      `;
      const callsBySeverity = await executeQuery<SeverityCount>(severityCountSql, params);
      
      // Get average call duration
      const avgDurationSql = `
        SELECT AVG(call_duration) as average 
        FROM call_transcripts ${whereClause}
      `;
      const avgDurationResult = await executeQuery<{ average: number }>(avgDurationSql, params);
      const averageCallDuration = avgDurationResult[0]?.average || 0;
      
      // Get follow-up required count
      const followUpSql = `
        SELECT COUNT(*) as count 
        FROM call_transcripts 
        ${whereClause ? whereClause + ' AND' : 'WHERE'} follow_up_required = 'Yes'
      `;
      const followUpParams = [...params];
      const followUpResult = await executeQuery<{ count: number }>(followUpSql, followUpParams);
      const followUpRequiredCount = followUpResult[0]?.count || 0;
      
      // Get call trends (by day)
      const trendsSql = `
        SELECT 
          DATE(call_date_time) as date, 
          COUNT(*) as count,
          AVG(overall_satisfaction_score) as averageSatisfaction
        FROM call_transcripts ${whereClause}
        GROUP BY DATE(call_date_time)
        ORDER BY date DESC
        LIMIT 30
      `;
      const callTrends = await executeQuery<CallTrend>(trendsSql, params);
      
      return {
        totalCalls,
        averageSatisfactionScore,
        callsByCategory,
        callsByResolution,
        callsByTier,
        callsBySeverity,
        averageCallDuration,
        followUpRequiredCount,
        callTrends
      };
    } catch (error) {
      console.error('Error getting dashboard statistics:', error);
      throw error;
    }
  }

  /**
   * Parse and validate a JSON transcript file
   * @param filePath Path to the JSON file
   * @returns Parsed and validated transcript data
   */
  async parseTranscriptFile(filePath: string): Promise<CallTranscriptRaw> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Read and parse file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const transcriptData = JSON.parse(fileContent) as CallTranscriptRaw;
      
      // Validate the data
      this.validateTranscriptData(transcriptData);
      
      return transcriptData;
    } catch (error) {
      console.error(`Error parsing transcript file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Process a directory of transcript files and add them to the database
   * @param directoryPath Path to the directory containing JSON transcript files
   * @returns Array of created transcript IDs
   */
  async processTranscriptDirectory(directoryPath: string): Promise<number[]> {
    try {
      // Check if directory exists
      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory not found: ${directoryPath}`);
      }
      
      // Get all JSON files in the directory
      const files = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.json'));
      
      if (files.length === 0) {
        throw new Error(`No JSON files found in directory: ${directoryPath}`);
      }
      
      // Process each file
      const createdIds: number[] = [];
      
      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        
        try {
          const transcriptData = await this.parseTranscriptFile(filePath);
          const transcript = await this.createCallTranscript(transcriptData);
          createdIds.push(transcript.id);
          console.log(`Processed transcript file: ${file}, created ID: ${transcript.id}`);
        } catch (error) {
          console.error(`Error processing transcript file ${file}:`, error);
          // Continue with next file
        }
      }
      
      return createdIds;
    } catch (error) {
      console.error(`Error processing transcript directory ${directoryPath}:`, error);
      throw error;
    }
  }

  /**
   * Validate transcript data
   * @param data The transcript data to validate
   * @throws Error if validation fails
   */
  private validateTranscriptData(data: Partial<CallTranscriptRaw>): void {
    // Required fields
    const requiredFields = [
      'customer_name',
      'customer_unique_id',
      'support_agent_name',
      'support_agent_id',
      'call_transcript',
      'overall_satisfaction_score',
      'category_of_call',
      'call_duration',
      'call_date_time',
      'call_resolution_status',
      'escalation_level',
      'follow_up_required',
      'customer_tier',
      'issue_severity',
      'agent_experience_level',
      'customer_previous_contact_count'
    ];
    
    // Check for missing required fields
    const missingFields = requiredFields.filter(field => !data[field as keyof CallTranscriptRaw]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate satisfaction score (1-10)
    if (data.overall_satisfaction_score !== undefined && 
        (data.overall_satisfaction_score < 1 || data.overall_satisfaction_score > 10)) {
      throw new Error('Satisfaction score must be between 1 and 10');
    }
    
    // Validate call duration (positive number)
    if (data.call_duration !== undefined && data.call_duration <= 0) {
      throw new Error('Call duration must be a positive number');
    }
    
    // Validate date format
    if (data.call_date_time) {
      const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
      if (!dateRegex.test(data.call_date_time)) {
        throw new Error('Invalid date format. Expected: YYYY-MM-DD HH:MM:SS');
      }
    }
    
    // Validate follow-up required (Yes/No)
    if (data.follow_up_required && !['Yes', 'No'].includes(data.follow_up_required)) {
      throw new Error('Follow-up required must be "Yes" or "No"');
    }
  }

  /**
   * Convert camelCase to snake_case
   * @param str String in camelCase
   * @returns String in snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default new CallTranscriptService();
