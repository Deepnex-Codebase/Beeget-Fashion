import PromoBanner from '../models/PromoBanner.js';
// import AppError from '../utils/appError';

// Define catchAsync utility function inline since the import is failing
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Get active banner for public display
const getActiveBanner = catchAsync(async (req, res, next) => {
  const banner = await PromoBanner.getActiveBanner();
  
  res.status(200).json({
    status: 'success',
    data: banner
  });
});

// Get all banners (for admin)
const getAllBanners = catchAsync(async (req, res, next) => {
  const banners = await PromoBanner.find().sort('-createdAt');
  
  res.status(200).json({
    status: 'success',
    results: banners.length,
    data: banners
  });
});

// Create new banner
const createBanner = catchAsync(async (req, res, next) => {
  // Add the current user as creator
  req.body.createdBy = req.user.id;
  
  const banner = await PromoBanner.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: banner
  });
});

// Get single banner
const getBanner = catchAsync(async (req, res, next) => {
  const banner = await PromoBanner.findById(req.params.id);
  
  if (!banner) {
    return next(new AppError('No banner found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: banner
  });
});

// Update banner
const updateBanner = catchAsync(async (req, res, next) => {
  const banner = await PromoBanner.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!banner) {
    return next(new AppError('No banner found with that ID', 404));
  }
  
  // If setting to active, deactivate all other banners
  if (req.body.isActive) {
    await PromoBanner.updateMany(
      { _id: { $ne: req.params.id }, isActive: true },
      { isActive: false }
    );
  }
  
  res.status(200).json({
    status: 'success',
    data: banner
  });
});

// Delete banner
const deleteBanner = catchAsync(async (req, res, next) => {
  const banner = await PromoBanner.findByIdAndDelete(req.params.id);
  
  if (!banner) {
    return next(new AppError('No banner found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Activate banner
const activateBanner = catchAsync(async (req, res, next) => {
  // First deactivate all banners
  await PromoBanner.updateMany({}, { isActive: false });
  
  // Then activate the requested banner
  const banner = await PromoBanner.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!banner) {
    return next(new AppError('No banner found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: banner
  });
});

export default {
  getActiveBanner,
  getAllBanners,
  createBanner,
  getBanner,
  updateBanner,
  deleteBanner,
  activateBanner
};