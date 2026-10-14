import mongoose from 'mongoose';
import { seedAdminUser } from './seedAdmin.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Auto-seed and verify admin user
    await seedAdminUser();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
