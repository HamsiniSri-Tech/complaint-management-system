const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // const conn = await mongoose.connect(process.env.MONGO_URI, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Create default admin on first run
    await createDefaultAdmin();
    await createDefaultCategories();

  } catch (error) {
    // console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('❌ MongoDB Connection Error: ',error);
    process.exit(1);
  }
};

// Create a default admin user if none exists
const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      await User.create({
        name: 'Super Admin',
        email: 'admin@complaint.com',
        password: hashedPassword,
        role: 'admin',
        phone: '0000000000',
        isActive: true,
      });

      console.log('✅ Default Admin Created → Email: admin@complaint.com | Password: Admin@123');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

// Create default categories if none exist
const createDefaultCategories = async () => {
  try {
    const Category = require('../models/Category');

    const count = await Category.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        { name: 'Technical Issue',    description: 'Software or hardware related issues',  color: '#3B82F6' },
        { name: 'Billing',            description: 'Payment and billing related complaints', color: '#10B981' },
        { name: 'Service Quality',    description: 'Issues related to service quality',      color: '#F59E0B' },
        { name: 'Staff Behavior',     description: 'Complaints about staff conduct',         color: '#EF4444' },
        { name: 'Delivery',           description: 'Delivery and shipping complaints',        color: '#8B5CF6' },
        { name: 'Product Defect',     description: 'Defective or damaged product issues',    color: '#EC4899' },
        { name: 'Other',              description: 'General complaints not listed above',    color: '#6B7280' },
      ];

      await Category.insertMany(defaultCategories);
      console.log('✅ Default Categories Created');
    }
  } catch (error) {
    console.error('❌ Error creating default categories:', error.message);
  }
};

module.exports = connectDB;