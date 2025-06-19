const pool = require("../config/database")
const qString = "select distinct categories.id,categories.cat_name,categories.cat_desc,categories.cat_vid , count(products.id) prod_count from categories left join products on categories.id=products.cat_fk group by categories.id, categories.cat_name,categories.cat_desc,categories.cat_vid"

const Category = {
  findAll: async () => {
    const result = await pool.query(qString)
    return result.rows
  },
  findById: async id => {
    const result = await pool.query("SELECT * FROM categories WHERE id = $1", [id])
    return result.rows[0]
  },
  create: async category => {
    const { cat_name, cat_desc, cat_vid } = category
    const result = await pool.query("INSERT INTO categories (cat_name, cat_desc, cat_vid) VALUES ($1, $2, $3) RETURNING *", [cat_name, cat_desc, cat_vid])
    return result.rows[0]
  },
  update: async (id, category) => {
    const { cat_name, cat_desc, cat_vid } = category
    const result = await pool.query("UPDATE categories SET cat_name = $1, cat_desc = $2, cat_vid = $3 WHERE id = $4 RETURNING *", [cat_name, cat_desc, cat_vid, id])
    return result.rows[0]
  },
  delete: async id => {
    const result = await pool.query("DELETE FROM categories WHERE id = $1 RETURNING *", [id])
    return result.rows[0]
  }
}

module.exports = Category
