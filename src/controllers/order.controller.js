import { sql } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// CREATE ORDER (Checkout)

export const createOrder = (io) => async (req, res) => {
  const userId = req.auth.userId;
  const {
    shipping_address,
    shipping_fee = 0,
    payment_method = "cash",
  } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ message: "Shipping address is required" });
  }

  const client = sql; // Reuse sql directly as neon doesn't use client.connect()

  try {
    const cartItems = await client`
      SELECT c.product_id, c.quantity, p.title, p.price, p.discount, p.stock
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${userId}
    `;

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${item.title}` });
      }
    }

    const totalDiscount = cartItems.reduce((acc, item) => {
      return acc + ((item.price * item.discount) / 100) * item.quantity;
    }, 0);

    const total_amount =
      cartItems.reduce((sum, item) => {
        const itemPrice = item.price * (1 - item.discount / 100);
        return sum + itemPrice * item.quantity;
      }, 0) + Number(shipping_fee);

    // 🔐 Begin manual transaction
    await client`BEGIN`;

    // Insert order
    const result = await client`
      INSERT INTO orders (user_id, status, payment_method, total_amount, shipping_fee, discount)
      VALUES (${userId}, 'pending', ${payment_method}, ${total_amount}, ${shipping_fee}, ${totalDiscount})
      RETURNING id
    `;
    const orderId = result[0].id;

    for (const item of cartItems) {
      const itemPrice = item.price * (1 - item.discount / 100);
      await client`
        INSERT INTO order_items (id, order_id, product_id, quantity, price, discount)
        VALUES (${uuidv4()}, ${orderId}, ${item.product_id}, ${
        item.quantity
      }, ${itemPrice}, ${item.discount})
      `;

      await client`
        UPDATE products
        SET stock = stock - ${item.quantity}
        WHERE id = ${item.product_id}
      `;
    }

    await client`
      DELETE FROM cart_items WHERE user_id = ${userId}
    `;

    await client`COMMIT`;

    // 🔔 Emit events
    io.to(userId).emit("order:created", {
      orderId,
      total_amount,
      status: "pending",
    });

    io.emit("admin:order:new", {
      orderId,
      userId,
      total_amount,
    });

    res.json({ message: "Order placed", orderId, total_amount });
  } catch (err) {
    await client`ROLLBACK`;
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET USER ORDERS
export const getUserOrders = async (req, res) => {
  const userId = req.auth.userId;

  try {
    const orders = await sql`
      SELECT o.id, o.status, o.payment_method, o.total_amount, o.shipping_fee, o.discount, o.created_at,
             array_agg(
               json_build_object(
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'discount', oi.discount,
                 'title', p.title,
                 'image', p.image
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ${userId}
      GROUP BY o.id
    `;
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET SINGLE ORDER
export const getOrderById = async (req, res) => {
  const userId = req.auth.userId;
  const { id } = req.params;

  try {
    const orders = await sql`
      SELECT o.id, o.status, o.payment_method, o.total_amount, o.shipping_fee, o.discount, o.created_at,
             array_agg(
               json_build_object(
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'discount', oi.discount,
                 'title', p.title,
                 'image', p.image
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${id} AND o.user_id = ${userId}
      GROUP BY o.id
    `;

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(orders[0]);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await sql`
      SELECT o.id, o.user_id, o.status, o.payment_method, 
             o.total_amount, o.shipping_fee, o.discount, o.created_at,
             u.name as customer_name, u.email as customer_email,
             array_agg(
               json_build_object(
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'discount', oi.discount,
                 'title', p.title,
                 'image', p.image
               )
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.clerk_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
    `;
    res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};
