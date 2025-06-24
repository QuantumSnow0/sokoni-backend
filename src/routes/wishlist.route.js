import express from "express";
import { requireAuth } from "@clerk/express";
import { wishlistController } from "../controllers/wishlist.controller.js";

export default function wishlistRoutes(io) {
  const router = express.Router();
  const { toggleWishlistItem, getUserWishlist } = wishlistController(io);

  // Protected routes
  router.post("/toggle", toggleWishlistItem);
  router.get("/", getUserWishlist);

  return router;
}
