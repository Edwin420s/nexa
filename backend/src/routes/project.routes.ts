import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller';
import { validate } from '../middleware/validation';
import { createProjectSchema, updateProjectSchema } from '../validations/project.validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Project routes
router.post('/', validate(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.patch('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;