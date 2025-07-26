import express from 'express';
import { verifyToken, isAdmin, isSubAdmin } from '../middlewares/auth.middleware.js';
import { isEditor, isViewer, preventDeletion } from '../middlewares/cms-permissions.middleware.js';
import {
  getHomePage,
  updateHomePage,
  autosaveHomePage,
  getAboutPage,
  updateAboutPage,
  autosaveAboutPage,
  getContactPage,
  updateContactPage,
  autosaveContactPage,
  getFooter,
  updateFooter,
  autosaveFooter,
  submitEnquiry,
  getEnquiries,
  updateEnquiryStatus
} from '../controllers/site-content.controller.js';

const router = express.Router();

// Home Page routes
router.get('/home', getHomePage);
router.put('/home', verifyToken, isEditor, preventDeletion, updateHomePage);
router.post('/home/autosave', verifyToken, isEditor, preventDeletion, autosaveHomePage);

// About Page routes
router.get('/about', getAboutPage);
router.put('/about', verifyToken, isEditor, preventDeletion, updateAboutPage);
router.post('/about/autosave', verifyToken, isEditor, preventDeletion, autosaveAboutPage);

// Contact Page routes
router.get('/contact', getContactPage);
router.put('/contact', verifyToken, isEditor, preventDeletion, updateContactPage);
router.post('/contact/autosave', verifyToken, isEditor, preventDeletion, autosaveContactPage);

// Footer routes
router.get('/footer', getFooter);
router.put('/footer', verifyToken, isEditor, preventDeletion, updateFooter);
router.post('/footer/autosave', verifyToken, isEditor, preventDeletion, autosaveFooter);

// Enquiry routes
router.post('/enquiries', submitEnquiry); // Public route for form submissions
router.get('/enquiries', verifyToken, isViewer, getEnquiries);
router.put('/enquiries/:id/status', verifyToken, isEditor, updateEnquiryStatus);

export default router;