import dotenv from 'dotenv'
dotenv.config({
  path: './.env'
})
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ MONGODB CONNECTED SUCCESSFULLY !!")
    console.log(`📦 Database: ${connection.connection.name}`)
    return connection
  } catch (error) {
    console.log("❌ Database connection failed", error)
    process.exit(1)
  }
}
export default connectDB