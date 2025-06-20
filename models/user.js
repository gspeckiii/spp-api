const pool = require("../config/database")
const md5 = require("md5")

const User = {
  findAll: async () => {
    console.log("Attempting to query users table...")
    try {
      const result = await pool.query("SELECT * FROM users").catch(err => {
        console.error("Database query error:", err.stack)
        throw err
      })
      console.log("Query successful, rows:", result.rows.length)
      return result.rows
    } catch (err) {
      console.error("Database query error:", err.stack)
      throw err
    }
  },

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
  },
  findById: async id => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [id])
      return result.rows[0]
    } catch (err) {
      console.error("Find by ID error:", err.stack)
      throw err
    }
  },

  findByUsername: async username => {
    try {
      console.log(`Querying username: ${username}`)
      const result = await pool.query("SELECT * FROM users WHERE username ILIKE $1", [username])
      console.log(`Query result rows: ${JSON.stringify(result.rows)}`)
      return result.rows[0] || null
    } catch (err) {
      console.error("Find by username error:", err.stack)
      throw new Error("Database error while finding user")
    }
  },

  create: async user => {
    let { username, email, avatar, bio, password, admin = false } = user
    avatar = `https://gravatar.com/avatar/${md5(email)}?s=128`
    try {
      const result = await pool.query("INSERT INTO users (username, email, avatar, bio, password, admin) VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), $6) RETURNING *", [username, email, avatar, bio, password, admin])
      return result.rows[0]
    } catch (err) {
      console.error("Create user error:", err.stack)
      throw err
    }
  },

  update: async (id, user) => {
    let { username, email, avatar, bio, password, admin } = user
    avatar = `https://gravatar.com/avatar/${md5(email)}?s=128`
    const currentUser = await User.findById(id)
    if (!currentUser) throw new Error("User not found")

    const updateFields = []
    const values = []
    let index = 1

    if (username && username !== currentUser.username) {
      updateFields.push(`username = $${index++}`)
      values.push(username)
    }
    if (email && email !== currentUser.email) {
      updateFields.push(`email = $${index++}`)
      values.push(email)
    }
    if (avatar !== undefined && avatar !== currentUser.avatar) {
      updateFields.push(`avatar = $${index++}`)
      values.push(avatar)
    }
    if (bio !== undefined && bio !== currentUser.bio) {
      updateFields.push(`bio = $${index++}`)
      values.push(bio)
    }
    if (password && password !== currentUser.password) {
      updateFields.push(`password = crypt($${index++}, gen_salt('bf'))`)
      values.push(password)
    }
    if (admin !== undefined && admin !== currentUser.admin) {
      updateFields.push(`admin = $${index++}`)
      values.push(admin)
    }
    values.push(id)

    if (updateFields.length === 0) return currentUser

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = $${index} RETURNING *`
    try {
      const result = await pool.query(query, values)
      console.log("Update result:", result.rowCount)
      return result.rows[0]
    } catch (err) {
      console.error("Update user error:", err.stack)
      throw err
    }
  },

  delete: async id => {
    try {
      const result = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING *", [id])
      if (!result.rows[0]) throw new Error("User not found")
      return result.rows[0]
    } catch (err) {
      console.error("Delete user error:", err.stack)
      throw err
    }
  },

  verifyPassword: async (username, password) => {
    try {
      const user = await User.findByUsername(username)
      if (!user) throw new Error("User not found")
      const result = await pool.query("SELECT crypt($1, $2) = $2 AS match", [password, user.password])
      return result.rows[0].match
    } catch (err) {
      console.error("Verify password error:", err.stack)
      throw err
    }
  }
}

module.exports = User
