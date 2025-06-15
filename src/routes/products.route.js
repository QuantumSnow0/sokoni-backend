// product.routes.js
import express from "express";
import { productController } from "../controllers/products.controller.js";

export const productRoutes = (io) => {
  const router = express.Router();
  const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  } = productController(io);

  router.get("/", getAllProducts);
  router.get("/:id", getProductById);
  router.post("/", createProduct);
  router.put("/:id", updateProduct);
  router.delete("/:id", deleteProduct);

  return router;
};
