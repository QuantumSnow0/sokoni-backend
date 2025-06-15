import express from "express";
import { requireAuth } from "@clerk/express";
import {
  toggleWishlistItem,
  getUserWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

// Protected routes
router.post("/toggle",  toggleWishlistItem);
router.get("/", getUserWishlist);

export default router;
