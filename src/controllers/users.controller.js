import { sql } from "../config/db.js";
import { v4 as uuidv4 } from "uuid"; // still used for addresses

// 🔐 Get current user profile
export const getCurrentUser = async (req, res) => {
  const userId = req.auth()?.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await sql`SELECT * FROM users WHERE clerk_id = ${userId}`;
    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// 🆕 Create a new user profile
export const createUserProfile = async (req, res) => {
  const userId = req.auth()?.userId;
  const { email, name, phone } = req.body;

  try {
    await sql`
      INSERT INTO users (clerk_id, email, name, phone)
      VALUES (${userId}, ${email}, ${name}, ${phone})
    `;
    res.status(201).json({ message: "User profile created" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create user", detail: err.message });
  }
};

// ✏️ Update user profile
export const updateUserProfile = async (req, res) => {
  const userId = req.auth()?.userId;
  const { name, phone } = req.body;

  try {
    await sql`
      UPDATE users
      SET name = ${name}, phone = ${phone}
      WHERE clerk_id = ${userId}
    `;
    res.json({ message: "User profile updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed", detail: err.message });
  }
};

// 📍 Get all addresses for user
export const getUserAddresses = async (req, res) => {
  const userId = req.auth()?.userId;

  try {
    const addresses = await sql`
      SELECT * FROM addresses WHERE clerk_id = ${userId}
    `;
    res.json(addresses);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not fetch addresses", detail: err.message });
  }
};

// ➕ Add new address
export const addUserAddress = async (req, res) => {
  const userId = req.auth()?.userId;
  const { street, city, postal_code, country } = req.body;

  try {
    await sql`
      INSERT INTO addresses (id, clerk_id, street, city, postal_code, country)
      VALUES (${uuidv4()}, ${userId}, ${street}, ${city}, ${postal_code}, ${country})
    `;
    res.status(201).json({ message: "Address added" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add address", detail: err.message });
  }
};

// ✏️ Update specific address
export const updateUserAddress = async (req, res) => {
  const addressId = req.params.addressId;
  const { street, city, postal_code, country } = req.body;

  try {
    await sql`
      UPDATE addresses
      SET street = ${street}, city = ${city}, postal_code = ${postal_code}, country = ${country}
      WHERE id = ${addressId}
    `;
    res.json({ message: "Address updated" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update address", detail: err.message });
  }
};

// ❌ Delete address
export const deleteUserAddress = async (req, res) => {
  const addressId = req.params.addressId;

  try {
    await sql`DELETE FROM addresses WHERE id = ${addressId}`;
    res.json({ message: "Address deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete address", detail: err.message });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at DESC`; // if you have created_at
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch users", detail: err.message });
  }
};
