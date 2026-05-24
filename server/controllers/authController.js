import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

const signToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

const sendAuthCookie = (res, user) => {
  const token = signToken(user._id);
  res.cookie("token", token, getCookieOptions());
  return res.status(200).json({ user: user.toSafeObject() });
};

const parseOptionalAge = (age) => {
  if (age === undefined || age === null || age === "") return null;

  const parsedAge = Number(age);
  return Number.isNaN(parsedAge) ? age : parsedAge;
};

const handleAuthError = (res, error, fallbackMessage) => {
  console.error(error);

  if (error.code === 11000) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((value) => value.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  return res.status(500).json({
    message: fallbackMessage,
    detail: process.env.NODE_ENV === "production" ? undefined : error.message
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, age, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      age: parseOptionalAge(age),
      location: location || ""
    });

    return sendAuthCookie(res, user);
  } catch (error) {
    return handleAuthError(res, error, "Unable to create account");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return sendAuthCookie(res, user);
  } catch (error) {
    return handleAuthError(res, error, "Unable to log in");
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  return res.status(200).json({ user: req.user.toSafeObject() });
};
