import express, { Request, Response } from 'express';
import callTranscriptService, { 
  CallTranscriptFilter, 
  PaginationOptions 
} from '../services/CallTranscriptService';
import { CreateCallTranscriptDto, UpdateCallTranscriptDto } from '../types/CallTranscript';

// Create router
const router = express.Router();

/**
 * @route   POST /api/transcripts/bulk
 * @desc    Process a directory of transcript files
 * @access  Private
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { directoryPath } = req.body;
    
    if (!directoryPath) {
      return res.status(400).json({
        success: false,
        message: 'Directory path is required'
      });
    }
    
    const createdIds = await callTranscriptService.processTranscriptDirectory(directoryPath);
    
    res.status(201).json({
      success: true,
      message: `Successfully processed ${createdIds.length} transcript files`,
      data: {
        processedCount: createdIds.length,
        createdIds
      }
    });
  } catch (error: any) {
    console.error('Error processing transcript directory:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process transcript directory',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   GET /api/transcripts/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    const stats = await callTranscriptService.getDashboardStats(startDate, endDate);
    
    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  } catch (error: any) {
    console.error('Error retrieving dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   GET /api/transcripts
 * @desc    Get all call transcripts with optional filtering and pagination
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Parse filter parameters from query string
    const filter: CallTranscriptFilter = {};
    
    if (req.query.customerName) filter.customerName = req.query.customerName as string;
    if (req.query.customerUniqueId) filter.customerUniqueId = req.query.customerUniqueId as string;
    if (req.query.supportAgentId) filter.supportAgentId = req.query.supportAgentId as string;
    if (req.query.categoryOfCall) filter.categoryOfCall = req.query.categoryOfCall as string;
    if (req.query.callResolutionStatus) filter.callResolutionStatus = req.query.callResolutionStatus as string;
    if (req.query.customerTier) filter.customerTier = req.query.customerTier as string;
    if (req.query.issueSeverity) filter.issueSeverity = req.query.issueSeverity as string;
    if (req.query.startDate) filter.startDate = req.query.startDate as string;
    if (req.query.endDate) filter.endDate = req.query.endDate as string;
    if (req.query.minSatisfactionScore) filter.minSatisfactionScore = parseInt(req.query.minSatisfactionScore as string);
    if (req.query.maxSatisfactionScore) filter.maxSatisfactionScore = parseInt(req.query.maxSatisfactionScore as string);
    if (req.query.followUpRequired) filter.followUpRequired = req.query.followUpRequired as string;
    
    // Parse pagination parameters
    const pagination: PaginationOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };
    
    // Get transcripts with filter and pagination
    const { transcripts, total } = await callTranscriptService.getAllCallTranscripts(filter, pagination);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / pagination.limit);
    
    res.status(200).json({
      success: true,
      message: 'Call transcripts retrieved successfully',
      data: {
        transcripts,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('Error retrieving call transcripts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve call transcripts',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   POST /api/transcripts
 * @desc    Create a new call transcript
 * @access  Private
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const transcriptData: CreateCallTranscriptDto = req.body;
    
    if (!transcriptData) {
      return res.status(400).json({
        success: false,
        message: 'No transcript data provided'
      });
    }
    
    const transcript = await callTranscriptService.createCallTranscript(transcriptData);
    
    res.status(201).json({
      success: true,
      message: 'Call transcript created successfully',
      data: transcript
    });
  } catch (error: any) {
    console.error('Error creating call transcript:', error);
    
    // Handle validation errors
    if (error.message && error.message.includes('Missing required fields')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create call transcript',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   GET /api/transcripts/:id
 * @desc    Get a single call transcript by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const transcript = await callTranscriptService.getCallTranscriptById(id);
    
    res.status(200).json({
      success: true,
      message: 'Call transcript retrieved successfully',
      data: transcript
    });
  } catch (error: any) {
    console.error(`Error retrieving call transcript with ID ${req.params.id}:`, error);
    
    // Handle not found error specifically
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve call transcript',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   PUT /api/transcripts/:id
 * @desc    Update a call transcript
 * @access  Private
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const updateData: UpdateCallTranscriptDto = req.body;
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }
    
    const updatedTranscript = await callTranscriptService.updateCallTranscript(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Call transcript updated successfully',
      data: updatedTranscript
    });
  } catch (error: any) {
    console.error(`Error updating call transcript with ID ${req.params.id}:`, error);
    
    // Handle not found error specifically
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update call transcript',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @route   DELETE /api/transcripts/:id
 * @desc    Delete a call transcript
 * @access  Private
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    await callTranscriptService.deleteCallTranscript(id);
    
    res.status(200).json({
      success: true,
      message: 'Call transcript deleted successfully',
      data: { deleted: true }
    });
  } catch (error: any) {
    console.error(`Error deleting call transcript with ID ${req.params.id}:`, error);
    
    // Handle not found error specifically
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete call transcript',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
