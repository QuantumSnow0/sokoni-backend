import { sql } from "../config/db.js";

// Toggle wishlist item
export const toggleWishlistItem = async (req, res) => {
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
    // If exists → remove (unheart)
    await sql`
      DELETE FROM wishlists
      WHERE user_id = ${userId} AND product_id = ${productId};
    `;
    return res.json({ message: "Removed from wishlist" });
  } else {
    // If not exists → add (heart)
    await sql`
      INSERT INTO wishlists (user_id, product_id)
      VALUES (${userId}, ${productId});
    `;
    return res.status(201).json({ message: "Added to wishlist" });
  }
};
// Get all wishlisted products for the current user
export const getUserWishlist = async (req, res) => {
  const userId = req.auth?.userId;

  const products = await sql`
    SELECT p.*
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ${userId}
    ORDER BY w.created_at DESC;
  `;

  res.json(products);
};
