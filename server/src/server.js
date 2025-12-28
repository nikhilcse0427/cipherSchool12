import dotenv from 'dotenv'
import app from './app.js'
import connectDB from './config/db.js'

dotenv.config({
  path: './.env'
})

const port = process.env.PORT || 3000


connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ app is running on port number: ${port}`)
    })
  }).catch((error) => {
    console.log("❌ Database connection failed", error)
  })