import api from './api';

/**
 * Send OTP to guest user's email
 * @param {string} email - Guest user's email
 * @returns {Promise} - API response
 */
export const sendGuestOTP = async (email) => {
  try {
    const response = await api.post('/guest-verification/send-otp', { email });
    return response.data;
  } catch (error) {
    // console.error('Error sending OTP:', error);
    throw error.response?.data || { success: false, message: 'Failed to send OTP' };
  }
};

/**
 * Verify OTP sent to guest user's email
 * @param {string} email - Guest user's email
 * @param {string} otp - OTP received by guest user
 * @returns {Promise} - API response
 */
export const verifyGuestOTP = async (email, otp) => {
  try {
    const response = await api.post('/guest-verification/verify-otp', { email, otp });
    return response.data;
  } catch (error) {
    // console.error('Error verifying OTP:', error);
    throw error.response?.data || { success: false, message: 'Failed to verify OTP' };
  }
};

/**
 * Check if email is verified
 * @param {string} email - Guest user's email
 * @returns {Promise} - API response
 */
export const checkEmailVerification = async (email) => {
  try {
    const response = await api.get(`/guest-verification/check/${email}`);
    return response.data;
  } catch (error) {
    // console.error('Error checking email verification:', error);
    throw error.response?.data || { success: false, message: 'Failed to check email verification' };
  }
};