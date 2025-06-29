import { sql } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// 🟢 Create address
export const createAddress = async (req, res) => {
  const userId = req.auth().userId;
  const { full_name, region, street, phone, is_default } = req.body;

  const id = uuidv4();

  if (is_default) {
    // Reset others first
    await sql`UPDATE addresses SET is_default = FALSE WHERE clerk_id = ${userId}`;
  }

  await sql`
    INSERT INTO addresses (id, clerk_id, full_name, region, street, phone, is_default)
    VALUES (${id}, ${userId}, ${full_name}, ${region}, ${street}, ${phone}, ${
    is_default || false
  });
  `;

  res.status(201).json({ message: "Address created", id });
};

// 🟡 Get all addresses
export const getAddresses = async (req, res) => {
  const userId = req.auth().userId;

  const addresses = await sql`
    SELECT * FROM addresses
    WHERE clerk_id = ${userId}
    ORDER BY is_default DESC, full_name;
  `;

  res.json(addresses);
};

// 🟠 Update address
export const updateAddress = async (req, res) => {
  const userId = req.auth().userId;
  const { id } = req.params;
  const { full_name, region, street, phone, is_default } = req.body;

  if (is_default) {
    await sql`UPDATE addresses SET is_default = FALSE WHERE clerk_id = ${userId}`;
  }

  await sql`
    UPDATE addresses
    SET full_name = ${full_name},
        region = ${region},
        street = ${street},
        phone = ${phone},
        is_default = ${is_default || false}
    WHERE id = ${id} AND clerk_id = ${userId};
  `;

  res.json({ message: "Address updated" });
};

// 🔴 Delete address
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { id } = req.params;

    await sql`DELETE FROM addresses WHERE id = ${id} AND clerk_id = ${userId};`;

    res.json({ message: "Address deleted" });
  } catch (error) {
    console.log("error deleting addreses: ", error);
  }
};
