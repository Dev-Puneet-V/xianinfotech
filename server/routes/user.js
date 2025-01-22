import express from "express";
import bcrypt from "bcrypt";
const router = express.Router();
import User from "../models/user.js";
import { generateAccessToken, generateRefreshToken } from "../utils/helper.js";

router.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      whatsapp,
      state,
      referralCode,
    } = req.body;

    // Check required fields
    if (!firstName || !email || !password || !phone) {
      return res.status(400).json({
        message: "First name, email, password, and phone are required",
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Handle referral code (optional)
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({
        _id: mongoose.Types.ObjectId(referralCode),
      });
      if (!referrer) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
      referredBy = referrer._id;
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      whatsapp,
      state,
      referredBy,
    });

    await newUser.save();

    // Send success response (excluding sensitive data like the password)
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        referredBy: referredBy ? referredBy : null,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      //   secure: true,
      //   sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const {
      password: _,
      refreshTokens: __,
      ...userWithoutPassword
    } = user.toObject();
    res.status(200).json({
      accessToken,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const userPayload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(userPayload.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      //   secure: true,
      //   sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const user = await User.findOneAndUpdate(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } }
    );

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      //   secure: true,
      //   sameSite: "Strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
