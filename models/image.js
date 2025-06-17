const pool = require("../config/database")

const Image = {
  findAll: async () => {
    const result = await pool.query("SELECT * FROM images")
    return result.rows
  },
  findById: async id => {
    const result = await pool.query("SELECT * FROM images WHERE id = $1", [id])
    return result.rows[0]
  },
  create: async image => {
    const { img_name, img_display } = image
    const result = await pool.query("INSERT INTO images (img_name, img_display) VALUES ($1, $2) RETURNING *", [img_name, img_display])
    return result.rows[0]
  },
  update: async (id, image) => {
    const { img_name, img_display } = image
    const result = await pool.query("UPDATE images SET img_name = $1, img_display = $2 WHERE id = $3 RETURNING *", [img_name, img_display, id])
    return result.rows[0]
  },
  delete: async id => {
    const result = await pool.query("DELETE FROM images WHERE id = $1 RETURNING *", [id])
    return result.rows[0]
  },
  linkCategoryImage: async (cat_fk, img_fk) => {
    const result = await pool.query("INSERT INTO category_image (cat_fk, img_fk) VALUES ($1, $2) RETURNING *", [cat_fk, img_fk])
    return result.rows[0]
  },
  getCategoryImages: async () => {
    const result = await pool.query("SELECT * FROM category_image")
    return result.rows
  },
  linkProductImage: async (prod_fk, img_fk) => {
    const result = await pool.query("INSERT INTO product_image (prod_fk, img_fk) VALUES ($1, $2) RETURNING *", [prod_fk, img_fk])
    return result.rows[0]
  },
  getProductImages: async () => {
    const result = await pool.query("SELECT * FROM product_image")
    return result.rows
  }
}

module.exports = Image
