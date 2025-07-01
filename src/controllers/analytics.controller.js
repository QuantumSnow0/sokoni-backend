// File: controllers/analytics.controller.js
import { sql } from "../config/db.js";

export const getAdminSummary = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    const allOrders = await sql`
      SELECT user_id, status, total_amount, created_at
      FROM orders
    `;

    const stats = {
      totalOrders: allOrders.length,
      deliveredOrders: 0,
      totalEarnings: 0,
      todayEarnings: 0,
      yesterdayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      totalCustomers: new Set(),
    };

    for (const order of allOrders) {
      const amount = parseFloat(order.total_amount || 0);
      const createdAt = new Date(order.created_at);

      stats.totalEarnings += amount;
      stats.totalCustomers.add(order.user_id);

      if (order.status === "delivered") stats.deliveredOrders++;

      if (createdAt >= today) stats.todayEarnings += amount;
      else if (createdAt >= yesterday && createdAt < today)
        stats.yesterdayEarnings += amount;

      if (createdAt >= last7Days) stats.weekEarnings += amount;
      if (createdAt >= last30Days) stats.monthEarnings += amount;
    }

    res.json({
      totalOrders: stats.totalOrders,
      deliveredOrders: stats.deliveredOrders,
      totalEarnings: stats.totalEarnings,
      todayEarnings: stats.todayEarnings,
      yesterdayEarnings: stats.yesterdayEarnings,
      weekEarnings: stats.weekEarnings,
      monthEarnings: stats.monthEarnings,
      totalCustomers: stats.totalCustomers.size,
    });
  } catch (err) {
    console.error("Error generating analytics:", err);
    res.status(500).json({ message: "Server error" });
  }
};
