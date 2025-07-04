// product.controller.js
import { sql } from "../config/db.js";

export const productController = (io) => ({
  getAllProducts: async (req, res) => {
    try {
      let {
        minPrice = 0,
        maxPrice = 999999,
        category,
        sort, // "priceAsc", "priceDesc", etc.
      } = req.query;

      minPrice = parseFloat(minPrice);
      maxPrice = parseFloat(maxPrice);

      let query = sql`SELECT * FROM products WHERE price BETWEEN ${minPrice} AND ${maxPrice}`;

      if (category) {
        query = sql`${query} AND LOWER(category) = LOWER(${category})`;
      }

      if (sort === "priceAsc") {
        query = sql`${query} ORDER BY price ASC`;
      } else if (sort === "priceDesc") {
        query = sql`${query} ORDER BY price DESC`;
      } else {
        query = sql`${query} ORDER BY created_at DESC`; // Default
      }

      const products = await query;
      res.json(products);
    } catch (err) {
      console.error("Error fetching filtered products:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getProductById: async (req, res) => {
    const { id } = req.params;
    const product = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (product.length === 0)
      return res.status(404).json({ message: "Not found" });
    res.json(product[0]);
  },

  createProduct: async (req, res) => {
    const {
      title,
      description,
      price,
      image,
      stock,
      category,
      discount,
      size,
    } = req.body;

    const [newProduct] = await sql`
      INSERT INTO products (title, description, price, image, stock, category, discount, size)
      VALUES (${title}, ${description}, ${price}, ${image}, ${stock}, ${category}, ${discount}, ${size})
      RETURNING *;
    `;

    io.emit("product:new", newProduct); // 🔥 Broadcast to all clients
    res.status(201).json(newProduct);
  },

  updateProduct: async (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      image,
      stock,
      category,
      discount,
      size,
    } = req.body;

    const [updated] = await sql`
      UPDATE products
      SET title = ${title},
          description = ${description},
          price = ${price},
          image = ${image},
          stock = ${stock},
          category = ${category},
          discount = ${discount},
          size = ${size}
      WHERE id = ${id}
      RETURNING *;
    `;

    io.emit("product:update", updated); // 🔥 Notify updates
    res.json(updated);
  },

  deleteProduct: async (req, res) => {
    const { id } = req.params;
    await sql`DELETE FROM products WHERE id = ${id}`;
    io.emit("product:delete", id); // 🔥 Notify deletion
    res.status(204).send();
  },
});
