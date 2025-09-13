import express from 'express';
import { checkPincode } from '../controllers/pincode.controller.js';

const router = express.Router();

// Route to check pincode availability
router.get('/check/:pincode', checkPincode);

export default router;