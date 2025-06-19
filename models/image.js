const pool = require("../config/database")

const Image = {
  create: async (productId, image) => {
    const { img_path, img_name, img_desc } = image
    try {
      const result = await pool.query("INSERT INTO image_product (product_id, img_path, img_name, img_desc) VALUES ($1, $2, $3, $4) RETURNING *", [productId, img_path, img_name, img_desc])
      return result.rows[0]
    } catch (err) {
      console.error("Create image error:", err.stack)
      throw err
    }
  },

  findByProductId: async productId => {
    try {
      const result = await pool.query("SELECT * FROM image_product WHERE product_id = $1", [productId])
      return result.rows
    } catch (err) {
      console.error("Find by product ID error:", err.stack)
      throw err
    }
  }
}

module.exports = Image
