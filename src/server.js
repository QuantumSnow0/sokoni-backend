import express from "express";
import "dotenv/config";
import { Server } from "socket.io";
import { requireAuth } from "@clerk/express";
import usersRoutes from "./routes/users.route.js";
import http from "http";
import { productRoutes } from "./routes/products.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.json());
const PORT = process.env.PORT || 5001;
app.get("/", (req, res) => {
  res.send({ message: "invalid token" });
});
app.use("/api/users", requireAuth(), usersRoutes);
app.use("/api/products", productRoutes(io));
app.use("/api/wishlist", requireAuth(), wishlistRoutes);

io.on("connection", (socket) => {
  console.log("✅ New socket connected");

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`listening to http://192.168.205.31:${PORT}`);
});
