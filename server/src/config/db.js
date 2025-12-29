import dotenv from 'dotenv'
dotenv.config({
  path: './.env'
})
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ MONGODB CONNECTED SUCCESSFULLY !!")
  } catch (error) {
    console.log("❌ Database connection failed", error)
    process.exit(1)
  }
}
export default connectDB