import express from "express";
import { requireAuth } from "@clerk/express";
import { getAdminSummary } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/stats", requireAuth(), getAdminSummary);

export default router;
