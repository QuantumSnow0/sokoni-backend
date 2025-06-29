import express from "express";
import { requireAuth } from "@clerk/express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrdersAdmin,
} from "../controllers/order.controller.js";

const router = express.Router();

export const orderRoutes = (io) => {
  router.post("/create", requireAuth(), createOrder(io));
  router.get("/", requireAuth(), getUserOrders);
  router.get("/:id", requireAuth(), getOrderById);
  router.get("/admin/all", requireAuth(), getAllOrdersAdmin);
  return router;
};
