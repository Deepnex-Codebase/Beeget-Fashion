import express from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This file is kept for backward compatibility
// All CMS functionality has been moved to site-content routes

export default router;