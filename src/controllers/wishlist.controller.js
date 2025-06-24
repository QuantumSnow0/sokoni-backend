import { sql } from "../config/db.js";

export const wishlistController = (io) => ({
  // Toggle wishlist item
  toggleWishlistItem: async (req, res) => {
    const userId = req.auth()?.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if item already in wishlist
    const existing = await sql`
      SELECT * FROM wishlists
      WHERE user_id = ${userId} AND product_id = ${productId};
    `;

    if (existing.length > 0) {
      // If exists → remove
      await sql`
        DELETE FROM wishlists
        WHERE user_id = ${userId} AND product_id = ${productId};
      `;
      io.to(userId).emit("wishlist:update", {
        userId,
        productId,
        action: "removed",
      });
      return res.json({ message: "Removed from wishlist" });
    } else {
      // If not exists → add
      await sql`
        INSERT INTO wishlists (user_id, product_id)
        VALUES (${userId}, ${productId});
      `;
      io.to(userId).emit("wishlist:update", {
        userId,
        productId,
        action: "added",
      });
      return res.status(201).json({ message: "Added to wishlist" });
    }
  },

  // Get all wishlisted products for the current user
  getUserWishlist: async (req, res) => {
    const userId = req.auth?.userId;

    const products = await sql`
      SELECT p.*
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ${userId}
      ORDER BY w.created_at DESC;
    `;

    res.json(products);
  },
});
