import { sql } from "../config/db.js";

export const categoryController = (io) => ({
  // ✅ Get all categories
  getAll: async (req, res) => {
    const categories = await sql`SELECT * FROM categories ORDER BY id DESC`;
    res.json(categories);
  },

  // ✅ Create new category
  create: async (req, res) => {
    const { label, icon, icon_lib, bg_color } = req.body;

    const [newCategory] = await sql`
      INSERT INTO categories (label, icon, icon_lib, bg_color)
      VALUES (${label}, ${icon}, ${icon_lib}, ${bg_color})
      RETURNING *;
    `;

    io.emit("category:new", newCategory);
    res.status(201).json(newCategory);
  },

  // ✅ Update category
  update: async (req, res) => {
    const { id } = req.params;
    const { label, icon, icon_lib, bg_color } = req.body;

    const [updated] = await sql`
      UPDATE categories
      SET label = ${label}, icon = ${icon}, icon_lib = ${icon_lib}, bg_color = ${bg_color}
      WHERE id = ${id}
      RETURNING *;
    `;

    io.emit("category:update", updated);
    res.json(updated);
  },

  // ✅ Delete category
  remove: async (req, res) => {
    const { id } = req.params;

    await sql`DELETE FROM categories WHERE id = ${id}`;
    io.emit("category:delete", Number(id));
    res.status(204).send();
  },
});
