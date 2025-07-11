const pool = require("../config/database")

const Image = {
  create: async (productId, image) => {
    const { img_path, img_name, img_desc, img_order, img_media } = image
    try {
      const result = await pool.query("INSERT INTO image_product (product_id, img_path, img_name, img_desc, img_order, img_media) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [productId, img_path, img_name, img_desc || "", img_order || 0, img_media || 0])
      return result.rows[0]
    } catch (err) {
      console.error("Create image error:", err.stack)
      throw err
    }
  },

  findByProductId: async productId => {
    try {
      const result = await pool.query("SELECT * FROM image_product WHERE product_id = $1 ORDER BY img_order", [productId])
      return result.rows
    } catch (err) {
      console.error("Find by product ID error:", err.stack)
      throw err
    }
  },

  findById: async id => {
    try {
      const result = await pool.query("SELECT * FROM image_product WHERE id = $1", [id])
      return result.rows[0]
    } catch (err) {
      console.error("Find by ID error:", err.stack)
      throw err
    }
  },

  delete: async id => {
    try {
      await pool.query("DELETE FROM image_product WHERE id = $1", [id])
    } catch (err) {
      console.error("Delete image error:", err.stack)
      throw err
    }
  },

  update: async (id, updates) => {
    const { img_desc, img_order, img_media } = updates
    try {
      const result = await pool.query("UPDATE image_product SET img_desc = $1, img_order = $2, img_media = $3 WHERE id = $4 RETURNING *", [img_desc || "", img_order || 0, img_media || 0, id])
      return result.rows[0]
    } catch (err) {
      console.error("Update image error:", err.stack)
      throw err
    }
  }
}

module.exports = Image
