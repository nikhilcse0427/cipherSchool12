import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(404, "User not found")
    }

    console.log("🔍 Generating tokens for user:", user._id);
    console.log("🔍 Environment check:", {
      accessSecret: process.env.ACCESS_TOKEN_SECRET ? "FOUND" : "NOT FOUND",
      refreshSecret: process.env.REFRESH_TOKEN_SECRET ? "FOUND" : "NOT FOUND",
      accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || "NOT FOUND",
      refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || "NOT FOUND"
    });

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    console.log("✅ Tokens generated successfully");

    user.refreshToken = refreshToken
    await user.save({
      validationBeforeSave: false
    })

    return { accessToken, refreshToken }
  } catch (error) {
    console.error("❌ Token generation error:", error);
    throw new ApiError(500, "Something went wrong while generating access and refresh token")
  }
}

const registerUser = async (req, res, next) => {
  try {
    const { fullName, userName, email, password } = req.body;

    // Validation for empty fields
    if ([fullName, userName, email, password].some(field => !field || field.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if username or email already exists
    const existedUser = await User.findOne({
      $or: [{ email }, { userName }]
    });

    if (existedUser) {
      throw new ApiError(409, "User with username or email already exists");
    }

    // Create user in DB
    const user = await User.create({
      fullName,
      userName,
      email,
      password,
      avatar: "",
      coverImage: ""
    });

    // Fetch created user without sensitive info
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: createdUser
    });

  } catch (error) {
    next(error); // Use global error handler
  }
};

const loginUser = async (req, res, next) => {
  try {
    // steps to login user
    // get user-login-detail from frontend
    // validate login detail -> not empty
    // find user by username or email in db
    // if user exist, check for password of that document
    // if password match -> generate refresh and refresh and access token and give to frontend throght cookie
    // login successfully

    const { userName, email, password } = req.body;

    if ([userName, email, password].some((field) => {
      return !field || field?.trim() === ""
    })) {
      throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({
      $or: [{ userName }, { email }]
    })

    if (!user) {
      throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password")// 401 -> unauthorized access
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedUser = await User.findById(user._id).select("-refreshToken -password")

    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        user: loggedUser,
        accessToken,
        refreshToken,
        message: "User logged in successfully"
      })

  } catch (error) {
    next(error);
  }
}

const logoutUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1
        },
      },
      {
        new: true
      }
    )

    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        success: true,
        message: "User logged out successfully"
      })

  } catch (error) {
    next(error);
  }
}

const refreshAcessToken = async (req, res) => {
  // take refresh token from cookie or header
  // throw error if it is empty
  // jwt se decode karo
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized action"
      });
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "refresh token not valid"
      });
    }
    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "refresh token is expired or used"
      });
    }

    const options = ({
      httpOnly: true,
      secure: true
    })

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    return res.status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newRefreshToken)
      .json({
        success: true,
        token: accessToken,
        incomingRefreshToken,
        newRefreshToken,
        message: "refresh token refresh"
      })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error?.message || "Invalid refresh token"
    });
  }

}

const changeCurrentPassword = async (req, res) => {
  // take oldPassword and newPassword from frontend
  // req.cookies se id nikalo
  // id ke madad se password nikalo db se
  // us password ko jwt se decode karo
  // old password age match kar rha ho db ke password se to db ke password ko replace kardo new password se
  // me data bhej do
  try {
    const { oldPassword, newPassword } = req.body


    const user = await User.findById(req.user._id)

    if (!user) {
      throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json({
      success: true,
      user: user,
      message: "new password saved successfully"
    })
  } catch (error) {
    throw new ApiError(401, "something went wrong while changing password")
  }
}

const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
      message: "current user got successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser
}
