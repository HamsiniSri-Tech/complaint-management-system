const Category = require('../models/Category');
const Complaint = require('../models/Complaint');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ─── Get All Categories ───────────────────────────────────────────────────────
// GET /api/categories
const getAllCategories = asyncHandler(async (req, res) => {
  const { includeInactive = false, search } = req.query;

  const filter = {};

  // Non-admins only see active categories
  if (req.user?.role !== 'admin' || !includeInactive) {
    filter.isActive = true;
  }

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const categories = await Category.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    total: categories.length,
    categories,
  });
});

// ─── Get Single Category ──────────────────────────────────────────────────────
// GET /api/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Get complaint breakdown for this category
  const complaintStats = await Complaint.aggregate([
    { $match: { category: category._id } },
    {
      $group: {
        _id:   '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = complaintStats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    category,
    complaintStats: {
      pending:    statsMap['pending']     || 0,
      assigned:   statsMap['assigned']    || 0,
      inProgress: statsMap['in-progress'] || 0,
      resolved:   statsMap['resolved']    || 0,
      rejected:   statsMap['rejected']    || 0,
      total:      category.complaintCount || 0,
    },
  });
});

// ─── Create Category (Admin) ──────────────────────────────────────────────────
// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  // Check for duplicate name
  const exists = await Category.findOne({
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
  });

  if (exists) {
    res.status(400);
    throw new Error(`Category "${name}" already exists`);
  }

  const category = await Category.create({
    name:        name.trim(),
    description: description?.trim() || '',
    color:       color || '#6B7280',
    isActive:    true,
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category,
  });
});

// ─── Update Category (Admin) ──────────────────────────────────────────────────
// PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, color, isActive } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check for duplicate name (excluding current)
  if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const exists = await Category.findOne({
      name:  { $regex: `^${name.trim()}$`, $options: 'i' },
      _id:   { $ne: req.params.id },
    });

    if (exists) {
      res.status(400);
      throw new Error(`Category "${name}" already exists`);
    }
  }

  // Update fields
  if (name        !== undefined) category.name        = name.trim();
  if (description !== undefined) category.description = description.trim();
  if (color       !== undefined) category.color       = color;
  if (isActive    !== undefined) category.isActive    = isActive;

  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    category,
  });
});

// ─── Delete Category (Admin) ──────────────────────────────────────────────────
// DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if category has complaints
  const complaintCount = await Complaint.countDocuments({
    category: req.params.id,
  });

  if (complaintCount > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete category "${category.name}" — it has ${complaintCount} complaint(s) attached. Deactivate it instead.`
    );
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: `Category "${category.name}" deleted successfully`,
  });
});

// ─── Toggle Category Active Status (Admin) ────────────────────────────────────
// PATCH /api/categories/:id/toggle
const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    success: true,
    message: `Category "${category.name}" has been ${
      category.isActive ? 'activated' : 'deactivated'
    }`,
    category,
  });
});

// ─── Get Category Statistics (Admin) ─────────────────────────────────────────
// GET /api/categories/stats
const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await Category.aggregate([
    {
      $lookup: {
        from:         'complaints',
        localField:   '_id',
        foreignField: 'category',
        as:           'complaints',
      },
    },
    {
      $project: {
        name:           1,
        color:          1,
        isActive:       1,
        complaintCount: 1,
        total:          { $size: '$complaints' },
        pending: {
          $size: {
            $filter: {
              input: '$complaints',
              as:    'c',
              cond:  { $eq: ['$$c.status', 'pending'] },
            },
          },
        },
        resolved: {
          $size: {
            $filter: {
              input: '$complaints',
              as:    'c',
              cond:  { $eq: ['$$c.status', 'resolved'] },
            },
          },
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  res.status(200).json({
    success: true,
    stats,
  });
});

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats,
};