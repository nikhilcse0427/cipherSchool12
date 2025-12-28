import mongoose, { Schema } from "mongoose"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
  fullName: {
    type: String,
    minlength: [8, "fullName should contain atleast 8 characters"],
    maxlength: [24, "fullName must not contain more than 24 characters"],
    index: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    minlength: [5, "email should contain atleast 8 characters"],
    maxlength: [24, "email must not contain more than 24 characters"],
    lowercase: true,
    trim: true,
    required: true
  },
  password: {
    type: String,
    minlength: [8, "password should contain atleast 8 characters"],
    maxlength: [60, "password must not contain more than 60 characters"],
    required: [true, "password is required"]
  },
  refreshToken: {
    type: String,
  }
}, {
  timestamps: true
})

//it will run just before saving document in db
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next() //isko nahi add karenge to agr kuch bhi add karenge to baar baar password hash karega
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      userName: this.userName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User", userSchema)