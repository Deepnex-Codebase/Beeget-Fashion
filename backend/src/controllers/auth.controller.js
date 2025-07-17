import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { generateOTP, sendOTPEmail } from '../services/email.service.js';
import { sendOTPSMS } from '../services/sms.service.js';
import { storeOTP, verifyOTP } from '../config/redis.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, whatsappNumber } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      throw new AppError('Name, email and password are required', 400);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      whatsappNumber,
      isVerified: false,
      roles: ['user'] // Default role
    });
    
    await user.save();
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in Redis
    await storeOTP(email, otp);
    
    // Send OTP via email
    await sendOTPEmail(email, otp);
    
    // Send OTP via SMS if whatsapp number is provided
    if (whatsappNumber) {
      await sendOTPSMS(whatsappNumber, otp);
    }
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email with OTP
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    // Validate required fields
    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify OTP
    const otpVerification = await verifyOTP(email, otp);
    
    if (!otpVerification.valid) {
      if (otpVerification.reason === 'EXPIRED_OTP') {
        throw new AppError('OTP has expired', 400);
      } else {
        throw new AppError('Invalid OTP', 400);
      }
    }
    
    // Update user verification status
    user.isVerified = true;
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN } // Use the environment variable
    );
    
    // Set token in cookie only (not in header)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      sameSite: 'strict'
    });
    
    // Return success response with token
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Check if user is banned
    if (user.isBanned) {
      throw new AppError(
        user.banReason 
          ? `Your account has been banned. Reason: ${user.banReason}` 
          : 'Your account has been banned', 
        403
      );
    }
    
    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        roles: user.roles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Return user data and token
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          isVerified: user.isVerified,
          isBanned: user.isBanned
        },
        token
      }
    });
  } catch (error) {
    logger.error(`Error in login: ${error.message}`);
    next(error);
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Validate required fields
    if (!email) {
      throw new AppError('Email is required', 400);
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in Redis
    await storeOTP(email, otp);
    
    // Send OTP via email
    await sendOTPEmail(email, otp);
    
    // Send OTP via SMS if whatsapp number is available
    if (user.whatsappNumber) {
      await sendOTPSMS(user.whatsappNumber, otp);
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with OTP
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Validate required fields
    if (!email || !otp || !newPassword) {
      throw new AppError('Email, OTP and new password are required', 400);
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify OTP
    const otpVerification = await verifyOTP(email, otp);
    
    if (!otpVerification.valid) {
      if (otpVerification.reason === 'EXPIRED_OTP') {
        throw new AppError('OTP has expired', 400);
      } else {
        throw new AppError('Invalid OTP', 400);
      }
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }
    
    // Find user
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 401);
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Return user profile
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roles[0], // For backward compatibility
          roles: user.roles,
          isVerified: user.isVerified,
          whatsappNumber: user.whatsappNumber,
          addresses: user.addresses,
          wishlist: user.wishlist,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, whatsappNumber } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    
    await user.save();
    
    // Return updated user profile
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.roles[0], // For backward compatibility
          roles: user.roles,
          isVerified: user.isVerified,
          whatsappNumber: user.whatsappNumber,
          addresses: user.addresses,
          wishlist: user.wishlist
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add address to user profile
 */
export const addAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      type, name, phone, line1, line2, city, state, zip, country, isDefault 
    } = req.body;
    
    // Validate required fields
    if (!type || !name || !phone || !line1 || !city || !state || !zip || !country) {
      throw new AppError('Missing required address fields', 400);
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }
    
    // Create new address
    const newAddress = {
      addressType: type,
      name,
      phone,
      line1,
      line2: line2 || '',
      city,
      state,
      zip,
      country,
      isDefault: isDefault || false
    };
    
    // If this is the first address or isDefault is true, set as default
    if (user.addresses.length === 0 || isDefault) {
      // Set all existing addresses to non-default
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      
      newAddress.isDefault = true;
    }
    
    // Add address to user
    user.addresses.push(newAddress);
    await user.save();
    
    // Return updated addresses
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update address
 */
export const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const { 
      type, name, phone, line1, line2, city, state, zip, country, isDefault 
    } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Find address
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new AppError('Address not found', 404);
    }
    
    // Update address fields if provided
    if (type) user.addresses[addressIndex].addressType = type;
    if (name) user.addresses[addressIndex].name = name;
    if (phone) user.addresses[addressIndex].phone = phone;
    if (line1) user.addresses[addressIndex].line1 = line1;
    if (line2 !== undefined) user.addresses[addressIndex].line2 = line2;
    if (city) user.addresses[addressIndex].city = city;
    if (state) user.addresses[addressIndex].state = state;
    if (zip) user.addresses[addressIndex].zip = zip;
    if (country) user.addresses[addressIndex].country = country;
    
    // Handle default address
    if (isDefault) {
      // Set all addresses to non-default
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      
      // Set this address as default
      user.addresses[addressIndex].isDefault = true;
    }
    
    await user.save();
    
    // Return updated addresses
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete address
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Find address
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new AppError('Address not found', 404);
    }
    
    // Check if this is the default address
    const isDefault = user.addresses[addressIndex].isDefault;
    
    // Remove address
    user.addresses.splice(addressIndex, 1);
    
    // If deleted address was default and there are other addresses, set a new default
    if (isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    // Return updated addresses
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    // Validate required fields
    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(200).json({
        success: true,
        message: 'Product is already in wishlist',
        data: {
          wishlist: user.wishlist
        }
      });
    }
    
    // Add product to wishlist
    user.wishlist.push(productId);
    await user.save();
    
    // Return updated wishlist
    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: {
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Check if product is in wishlist
    const productIndex = user.wishlist.indexOf(productId);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }
    
    // Remove product from wishlist
    user.wishlist.splice(productIndex, 1);
    await user.save();
    
    // Return updated wishlist
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: {
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wishlist
 */
export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find user and populate wishlist with product details
    const user = await User.findById(userId).populate('wishlist');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Return wishlist
    res.status(200).json({
      success: true,
      data: {
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};