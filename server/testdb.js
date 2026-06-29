const mongoose = require('mongoose');
require('dotenv').config();

console.log('Trying to connect to:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Connection failed:', err.message);
    process.exit(1);
  });