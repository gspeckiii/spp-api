const pool = require("../config/database")

const User = {
  findAll: async () => {
    console.log("Attempting to query users table...")
    const result = await pool.query("SELECT * FROM users").catch(err => {
      console.error("Database query error:", err.stack)
      throw err
    })
    console.log("Query successful, rows:", result.rows.length)
    return result.rows
  },
  findById: async id => {
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [id])
    return result.rows[0]
  },
  create: async user => {
    const { username, email, avatar, bio, password } = user
    const result = await pool.query("INSERT INTO users (username, email, avatar, bio, password) VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf'))) RETURNING *", [username, email, avatar, bio, password])
    return result.rows[0]
  },
  update: async (id, user) => {
    const { username, email, avatar, bio, password } = user
    const result = await pool.query("UPDATE users SET username = $1, email = $2, avatar = $3, bio = $4, password = crypt($5, gen_salt('bf')) WHERE user_id = $6 RETURNING *", [username, email, avatar, bio, password, id])
    return result.rows[0]
  },
  delete: async id => {
    const result = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING *", [id])
    return result.rows[0]
  }
}

module.exports = User
