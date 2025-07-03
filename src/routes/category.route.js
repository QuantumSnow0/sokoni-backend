import express from "express";
import { categoryController } from "../controllers/category.controller.js";

export const createCategoryRoutes = (io) => {
  const router = express.Router();
  const controller = categoryController(io);

  router.get("/", controller.getAll);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
};
