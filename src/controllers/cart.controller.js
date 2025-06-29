import { sql } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// GET USER CART
export const getUserCart = async (req, res) => {
  const userId = req.auth.userId;

  try {
    const cart = await sql`
      SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image, p.size, p.discount
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${userId}
    `;
    res.json(cart);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD TO CART
export const addToCart = (io) => async (req, res) => {
  const userId = req.auth.userId;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const existing = await sql`
      SELECT * FROM cart_items WHERE user_id = ${userId} AND product_id = ${productId}
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE cart_items
        SET quantity = quantity + ${quantity}
        WHERE user_id = ${userId} AND product_id = ${productId}
      `;
    } else {
      await sql`
        INSERT INTO cart_items (id, user_id, product_id, quantity)
        VALUES (${uuidv4()}, ${userId}, ${productId}, ${quantity})
      `;
    }

    io.to(userId).emit("cart:updated", {
      productId,
      type: existing.length > 0 ? "updated" : "added",
    });

    res.status(201).json({ message: "Cart updated" });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE CART ITEM QUANTITY
export const updateCartItem = (io) => async (req, res) => {
  const userId = req.auth.userId;
  const { id, quantity } = req.body;

  if (!id || quantity < 1) {
    return res.status(400).json({ message: "Invalid item or quantity" });
  }

  try {
    await sql`
      UPDATE cart_items
      SET quantity = ${quantity}
      WHERE id = ${id} AND user_id = ${userId}
    `;

    io.to(userId).emit("cart:updated", { itemId: id, type: "updated" });

    res.json({ message: "Cart item updated" });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE SINGLE CART ITEM
export const deleteCartItem = (io) => async (req, res) => {
  const userId = req.auth().userId;
  const { id } = req.params;

  try {
    await sql`
      DELETE FROM cart_items
      WHERE id = ${id} AND user_id = ${userId}
    `;

    io.to(userId).emit("cart:updated", { itemId: id, type: "deleted" });

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// CLEAR ENTIRE CART
export const clearCart = (io) => async (req, res) => {
  const userId = req.auth.userId;

  try {
    await sql`
      DELETE FROM cart_items
      WHERE user_id = ${userId}
    `;

    io.to(userId).emit("cart:updated", { type: "cleared" });

    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ message: "Server error" });
  }
};
