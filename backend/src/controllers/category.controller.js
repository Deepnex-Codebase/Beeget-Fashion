import Category from '../models/category.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { deleteFile, getFileUrl } from '../config/multer.js';
import path from 'path';

/**
 * Create a new category
 */
export const createCategory = async (req, res, next) => {
  try {
    const {
      name,
      description,
      active,
      order,
      parent
    } = req.body;

    // Validate required fields
    if (!name) {
      throw new AppError('Category name is required', 400);
    }

    // Process uploaded image
    let image = null;
    if (req.file) {
      image = getFileUrl(req.file.path);
    }

    // Create new category
    const category = new Category({
      name,
      description,
      image,
      active: active !== undefined ? active : true,
      order: order || 0,
      parent: parent || null
    });

    await category.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

/**
 * Get all categories
 */
export const getCategories = async (req, res, next) => {
  try {
    // Only get top-level categories (no parent)
    const categories = await Category.find({ parent: null });

    // Return categories
    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Return category
    res.status(200).json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      active,
      order,
      parent,
      removeImage
    } = req.body;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if trying to set itself as parent
    if (parent && parent.toString() === id) {
      throw new AppError('Category cannot be its own parent', 400);
    }

    // Check for circular reference in parent hierarchy
    if (parent) {
      let currentParent = await Category.findById(parent);
      while (currentParent) {
        if (currentParent._id.toString() === id) {
          throw new AppError('Circular parent reference detected', 400);
        }
        currentParent = currentParent.parent ? await Category.findById(currentParent.parent) : null;
      }
    }

    // Update fields if provided
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (active !== undefined) category.active = active;
    if (order !== undefined) category.order = order;
    if (parent !== undefined) category.parent = parent || null;

    // Handle image removal if specified
    if (removeImage && category.image) {
      // Extract file path from URL
      const urlPath = new URL(category.image).pathname;
      const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
      if (filePath) {
        deleteFile(filePath);
      }
      category.image = null;
    }

    // Add new image if uploaded
    if (req.file) {
      // Delete old image if exists
      if (category.image) {
        const urlPath = new URL(category.image).pathname;
        const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        if (filePath) {
          deleteFile(filePath);
        }
      }
      // Set new image
      category.image = getFileUrl(req.file.path);
    }

    await category.save();

    // Return updated category
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      throw new AppError('Cannot delete category with children. Please delete or reassign children first.', 400);
    }

    // Delete category image from storage
    if (category.image) {
      // Extract file path from URL
      const urlPath = new URL(category.image).pathname;
      const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
      if (filePath) {
        deleteFile(filePath);
      }
    }

    // Delete category from database
    await Category.findByIdAndDelete(id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};