// cart.route.js
import express from "express";
import { requireAuth } from "@clerk/express";
import {
  addToCart,
  getUserCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from "../controllers/cart.controller.js";

const cartRoutes = (io) => {
  const router = express.Router();

  router.use(requireAuth());

  router.post("/add", addToCart(io));
  router.get("/", getUserCart);
  router.put("/update", updateCartItem(io));
  router.delete("/:id", deleteCartItem(io));
  router.delete("/clear/all", clearCart(io));

  return router;
};

export default cartRoutes;
