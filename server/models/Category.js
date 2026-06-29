const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    color: {
      type: String,
      default: '#6B7280',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    complaintCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to increment complaint count
categorySchema.statics.incrementCount = async function (categoryId) {
  await this.findByIdAndUpdate(categoryId, { $inc: { complaintCount: 1 } });
};

// Static method to decrement complaint count
categorySchema.statics.decrementCount = async function (categoryId) {
  await this.findByIdAndUpdate(categoryId, { $inc: { complaintCount: -1 } });
};

module.exports = mongoose.model('Category', categorySchema);