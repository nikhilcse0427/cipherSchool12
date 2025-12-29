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

router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);

router.post('/execute', executeQuery);
router.post('/hint', getHint);
router.get('/:assignmentId/attempts', verifyJWT, getUserAttempts);

export default router;

