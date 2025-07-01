import express from "express";
import { requireAuth } from "@clerk/express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrdersAdmin,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

export const orderRoutes = (io) => {
  router.post("/create", requireAuth(), createOrder(io));
  router.get("/admin/all", requireAuth(), getAllOrdersAdmin);
  router.get("/", requireAuth(), getUserOrders);
  router.patch("/update-status/:id", requireAuth(), updateOrderStatus(io));
  router.get("/:id", requireAuth(), getOrderById);
  return router;
};
