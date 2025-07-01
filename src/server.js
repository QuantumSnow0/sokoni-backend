import express from "express";
import "dotenv/config";
import job from "./config/cron.js";
import { Server } from "socket.io";
import { requireAuth } from "@clerk/express";
import usersRoutes from "./routes/users.route.js";
import http from "http";
import cors from "cors";
import { productRoutes } from "./routes/products.route.js";
import { orderRoutes } from "./routes/order.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import addressRoutes from "./routes/address.route.js";
import cartRoutes from "./routes/cart.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

const app = express();
const server = http.createServer(app);

// ✅ Allow multiple origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.135.31:5173", // your LAN IP
  "https://sokoni-backend-uvp5.onrender.com", // optional: keep this if you're tunneling
];

// ✅ CORS for HTTP (Express)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// ✅ Create Socket.IO server with matching CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
});

// ✅ USER ROOM REGISTRY
io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    console.log(`✅ ${userId} joined room`);
    socket.join(userId);
  }

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ✅ Inject io into routes
app.use("/api/users", requireAuth(), usersRoutes);
app.use("/api/products", productRoutes(io));
app.use("/api/wishlist", requireAuth(), wishlistRoutes(io));
app.use("/api/addresses", requireAuth(), addressRoutes);
app.use("/api/orders", orderRoutes(io));
app.use("/api/admin", requireAuth(), analyticsRoutes);
app.use("/api/cart", requireAuth(), cartRoutes(io));

// ✅ Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
