import express from "express";
import {
  getCurrentUser,
  createUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "../controllers/users.controller.js";

const router = express.Router();

// 🧑 Get the currently authenticated user’s profile (based on Clerk userId)
router.get("/me", getCurrentUser);

// 🆕 Create a user profile (only once after Clerk registration)
router.post("/", createUserProfile);

// ✏️ Update user profile
router.put("/", updateUserProfile);

// 📍 Address routes
router.get("/addresses", getUserAddresses);
router.post("/addresses", addUserAddress);
router.put("/addresses/:addressId", updateUserAddress);
router.delete("/addresses/:addressId", deleteUserAddress);

export default router;
