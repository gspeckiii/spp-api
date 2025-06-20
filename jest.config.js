const pool = require("../config/database")

const User = {
  findByEmail: async email => {
    try {
      console.log(`Querying email: ${email}`)
      const result = await pool.query("SELECT * FROM users WHERE email ILIKE $1", [email])
      console.log(`Query result rows: ${JSON.stringify(result.rows)}`)
      return result.rows[0] || null
    } catch (err) {
      console.error("Find by email error:", err.stack)
      throw new Error("Database error while finding user")
    }
  }

  // Other model functions (findByUsername, findById, etc.) remain unchanged
  // ...
}

module.exports = User
