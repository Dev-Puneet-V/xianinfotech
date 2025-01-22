import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [3, "Name must be at least 3 characters long"],
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, "Please provide a valid email address"], // Regex for basic email validation
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  income: {
    type: Number,
    default: 0,
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
  },
  whatsapp: {
    type: String,
    match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
  },
  State: {
    type: String,
  },
  promotors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  partners: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  receivedPayment: {
    type: String,
    enum: ["Accept", "Reject"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  refreshTokens: {
    type: [String], // Array to store multiple refresh tokens
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", UserSchema);
export default User;
