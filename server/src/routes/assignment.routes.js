import { Router } from 'express';
import {
  getAllAssignments,
  getAssignmentById,
  executeQuery,
  getHint,
  getUserAttempts
} from '../controllers/assignment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);

// Routes (execute and hint work without auth, attempts require auth)
router.post('/execute', executeQuery); // Optional auth - check in controller
router.post('/hint', getHint);
router.get('/:assignmentId/attempts', verifyJWT, getUserAttempts);

export default router;

