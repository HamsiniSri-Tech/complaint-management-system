const express = require('express');
const router  = express.Router();

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats,
} = require('../controllers/categoryController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── Public (authenticated) ───────────────────────────────────────────────────
router.get('/',                   protect, getAllCategories);
router.get('/stats',              protect, adminOnly, getCategoryStats);
router.get('/:id',                protect, getCategoryById);

// ─── Admin Only ───────────────────────────────────────────────────────────────
router.post('/',                  protect, adminOnly, createCategory);
router.put('/:id',                protect, adminOnly, updateCategory);
router.delete('/:id',             protect, adminOnly, deleteCategory);
router.patch('/:id/toggle',       protect, adminOnly, toggleCategoryStatus);

module.exports = router;