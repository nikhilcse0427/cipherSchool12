import { ApiError } from '../utils/ApiError.js';
import { Assignment } from '../models/assignment.model.js';
import { Attempt } from '../models/attempt.model.js';
import { executeSQLOnMongoDB } from '../utils/sqlToMongo.js';

/**
 * Get all assignments
 */
const getAllAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({}).select('-sampleData');
    
    return res.status(200).json({
      success: true,
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    next(new ApiError(500, 'Error fetching assignments', [error.message]));
  }
};

/**
 * Get assignment by ID
 */
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const assignment = await Assignment.findById(id);
    
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }
    
    return res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(500, 'Error fetching assignment', [error.message]));
    }
  }
};

/**
 * Execute SQL query
 */
const executeQuery = async (req, res, next) => {
  try {
    const { assignmentId, query } = req.body;
    
    if (!assignmentId || !query) {
      throw new ApiError(400, 'Assignment ID and query are required');
    }
    
    // Get assignment with sample data
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }
    
    // Execute SQL query using the SQL to MongoDB converter
    const result = await executeSQLOnMongoDB(query, {
      sampleData: assignment.sampleData
    });
    
    // Optionally save attempt if user is authenticated
    if (req.user) {
      try {
        await Attempt.create({
          assignmentId: assignment._id,
          userId: req.user._id,
          query: query,
          result: result
        });
      } catch (attemptError) {
        // Don't fail the request if saving attempt fails
        console.error('Error saving attempt:', attemptError);
      }
    }
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      // Return error result instead of throwing
      return res.status(200).json({
        success: false,
        data: {
          success: false,
          error: error.message,
          columns: [],
          rows: [],
          rowCount: 0
        }
      });
    }
  }
};

/**
 * Get hint for assignment (LLM-powered)
 */
const getHint = async (req, res, next) => {
  try {
    const { assignmentId } = req.body;
    
    if (!assignmentId) {
      throw new ApiError(400, 'Assignment ID is required');
    }
    
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Return generic hint
      return res.status(200).json({
        success: true,
        data: {
          hint: `Try to break down the problem: ${assignment.question}. Review the sample data structure and think about which SQL clauses you might need (SELECT, FROM, WHERE, ORDER BY, etc.).`
        }
      });
    }
    
    // Use OpenAI API for intelligent hints
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful SQL tutor. Provide hints to help students solve SQL problems without giving away the complete solution.'
          },
          {
            role: 'user',
            content: `Assignment: ${assignment.title}\nQuestion: ${assignment.question}\nDifficulty: ${assignment.difficulty}\n\nProvide a helpful hint to guide the student.`
          }
        ],
        max_tokens: 150
      });
      
      const hint = completion.choices[0].message.content;
      
      return res.status(200).json({
        success: true,
        data: { hint }
      });
    } catch (openaiError) {
      // Fallback to generic hint if OpenAI fails
      return res.status(200).json({
        success: true,
        data: {
          hint: `Try to break down the problem: ${assignment.question}. Review the sample data structure and think about which SQL clauses you might need.`
        }
      });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(500, 'Error generating hint', [error.message]));
    }
  }
};

/**
 * Get user attempts for an assignment
 */
const getUserAttempts = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user._id;
    
    const attempts = await Attempt.find({
      assignmentId,
      userId
    })
      .sort({ createdAt: -1 })
      .select('-userId');
    
    return res.status(200).json({
      success: true,
      data: attempts,
      count: attempts.length
    });
  } catch (error) {
    next(new ApiError(500, 'Error fetching attempts', [error.message]));
  }
};

export {
  getAllAssignments,
  getAssignmentById,
  executeQuery,
  getHint,
  getUserAttempts
};

