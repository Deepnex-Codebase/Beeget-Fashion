import express from 'express';
import {
  sendGuestOTP,
  verifyGuestOTP,
  checkEmailVerification
} from '../controllers/guest-verification.controller.js';

const router = express.Router();

// Send OTP to guest user's email
router.post('/send-otp', sendGuestOTP);

// Verify OTP sent to guest user's email
router.post('/verify-otp', verifyGuestOTP);

// Check if email is verified
router.get('/check/:email', checkEmailVerification);

export default router;