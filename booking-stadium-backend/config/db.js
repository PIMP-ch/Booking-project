import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // ดึงค่ามาจากไฟล์ .env
    const uri = process.env.MONGO_URI;

    // ตรวจสอบก่อนว่าค่า uri มีอยู่จริงไหม ถ้าไม่มีให้แจ้งเตือน
    if (!uri) {
      throw new Error("หาค่า MONGO_URI ในไฟล์ .env ไม่เจอครับ");
    }

    await mongoose.connect(uri); 
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;