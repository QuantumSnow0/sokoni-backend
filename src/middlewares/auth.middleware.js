// src/middlewares/auth.middleware.js
import { requireAuth } from "@clerk/express";

export const authenticateUser = requireAuth();
