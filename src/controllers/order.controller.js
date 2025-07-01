import { sql } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// ✅ CREATE ORDER
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

  const client = sql;

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

    await client`BEGIN`;

    const result = await client`
      INSERT INTO orders (
        user_id, status, payment_method, total_amount,
        shipping_fee, discount, shipping_address
      )
      VALUES (
        ${userId}, 'placed', ${payment_method}, ${total_amount},
        ${shipping_fee}, ${totalDiscount}, ${shipping_address}
      )
      RETURNING id
    `;
    const orderId = result[0].id;

    for (const item of cartItems) {
      const itemPrice = item.price * (1 - item.discount / 100);
      await client`
        INSERT INTO order_items (
          id, order_id, product_id, quantity, price, discount
        )
        VALUES (
          ${uuidv4()}, ${orderId}, ${item.product_id},
          ${item.quantity}, ${itemPrice}, ${item.discount}
        )
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

// ✅ GET ALL ORDERS FOR A USER
export const getUserOrders = async (req, res) => {
  const userId = req.auth.userId;

  try {
    const orders = await sql`
      SELECT o.id, o.status, o.payment_method, o.total_amount,
             o.shipping_fee, o.discount, o.created_at,
             a.full_name AS address_full_name,
             a.region AS address_region,
             a.street AS address_street,
             a.phone AS address_phone,
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
      LEFT JOIN addresses a ON o.shipping_address = a.id
      WHERE o.user_id = ${userId}
      GROUP BY o.id, a.full_name, a.region, a.street, a.phone
      ORDER BY o.created_at DESC
    `;

    const formatted = orders.map((o) => ({
      ...o,
      shipping_address: {
        full_name: o.address_full_name,
        region: o.address_region,
        street: o.address_street,
        phone: o.address_phone,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET SINGLE ORDER BY ID
export const getOrderById = async (req, res) => {
  const userId = req.auth.userId;
  const { id } = req.params;

  try {
    const result = await sql`
      SELECT o.id, o.status, o.payment_method, o.total_amount, o.shipping_fee,
             o.discount, o.created_at,
             a.full_name AS address_full_name,
             a.region AS address_region,
             a.street AS address_street,
             a.phone AS address_phone,
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
      LEFT JOIN addresses a ON o.shipping_address = a.id
      WHERE o.id = ${id} AND o.user_id = ${userId}
      GROUP BY o.id, a.full_name, a.region, a.street, a.phone
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = result[0];

    res.json({
      ...order,
      shipping_address: {
        full_name: order.address_full_name,
        region: order.address_region,
        street: order.address_street,
        phone: order.address_phone,
      },
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN - GET ALL ORDERS
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await sql`
      SELECT o.id, o.user_id, o.status, o.payment_method,
             o.total_amount, o.shipping_fee, o.discount, o.created_at,
             u.name AS customer_name, u.email AS customer_email,
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
// ✅ ADMIN - UPDATE ORDER STATUS

export const updateOrderStatus = (io) => async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // ✅ Updated status list
  const allowedStatuses = [
    "placed",
    "confirmed",
    "out_for_delivery",
    "shipped",
    "delivered",
    "cancelled",
    "rejected",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${id}
      RETURNING user_id
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = result[0].user_id;
    console.log("🚀 Emitting status update to:", userId, status);

    // ✅ Emit to specific user
    io.to(userId).emit("order:status:updated", {
      orderId: id,
      status,
    });

    // ✅ Emit to admins
    io.emit("admin:order:statusUpdated", {
      orderId: id,
      status,
    });

    res.json({ message: "Order status updated", orderId: id, status });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Server error" });
  }
};
