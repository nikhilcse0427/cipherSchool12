import express from 'express'
const app = express()
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'

import { ApiError } from './utils/ApiError.js'

app.use(cors({
  origin: '*',
  credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.use(morgan('dev'))

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

import userRouter from './routes/user.routes.js'
import assignmentRouter from './routes/assignment.routes.js'

//router
app.use('/api/v1/users', userRouter)
app.use('/api/v1/assignments', assignmentRouter)

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("❌ Global error handler caught:", err);

  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], error.stack);
  }

  const response = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
});

export default app