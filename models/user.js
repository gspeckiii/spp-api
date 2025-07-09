const pool = require("../config/database")
const md5 = require("md5")

const User = {
  async testConnection() {
    try {
      const client = await pool.connect()
      console.log("Database connection successful, database:", (await client.query("SELECT current_database()")).rows[0].current_database)
      const schemaResult = await client.query("SELECT table_schema, column_name, data_type FROM information_schema.columns WHERE table_name = 'users'")
      console.log("Users table schema:", JSON.stringify(schemaResult.rows))
      const testQuery = await client.query('SELECT * FROM public.users WHERE "user_id" = $1', [6])
      console.log("Test query for user_id 6:", JSON.stringify(testQuery.rows))
      client.release()
      return schemaResult.rows
    } catch (err) {
      console.error("Test connection error:", err.stack)
      try {
        const client = await pool.connect()
        const altResult = await client.query('SELECT * FROM spp_db_schema.users WHERE "user_id" = $1', [6])
        console.log("Test query for spp_db_schema.users, user_id 6:", JSON.stringify(altResult.rows))
        client.release()
      } catch (altErr) {
        console.error("Alternative schema (spp_db_schema) test error:", altErr.stack)
      }
      throw err
    }
  },

  findAll: async () => {
    console.log("Attempting to query users table...")
    try {
      const result = await pool.query("SELECT * FROM public.users")
      console.log("Query successful, rows:", result.rows.length, "data:", JSON.stringify(result.rows))
      return result.rows
    } catch (err) {
      console.error("Database query error:", err.stack)
      throw err
    }
  },

  findByEmail: async email => {
    try {
      console.log(`Querying email: ${email}`)
      const result = await pool.query("SELECT * FROM public.users WHERE email ILIKE $1", [email])
      console.log(`Query result rows: ${JSON.stringify(result.rows)}`)
      return result.rows[0] || null
    } catch (err) {
      console.error("Find by email error:", err.stack)
      throw new Error("Database error while finding user")
    }
  },

  findById: async id => {
    try {
      console.log(`Querying user by user_id: ${id}`)
      const result = await pool.query('SELECT * FROM public.users WHERE "user_id" = $1', [id])
      console.log(`Find by user_id result: ${JSON.stringify(result.rows[0])}`)
      return result.rows[0] || null
    } catch (err) {
      console.error("Find by ID error:", err.stack)
      try {
        const altResult = await pool.query('SELECT * FROM spp_db_schema.users WHERE "user_id" = $1', [id])
        console.log("Alternative schema query result for user_id:", id, JSON.stringify(altResult.rows[0]))
        return altResult.rows[0] || null
      } catch (altErr) {
        console.error("Alternative schema (spp_db_schema) findById error:", altErr.stack)
      }
      throw err
    }
  },

  findByUsername: async username => {
    try {
      console.log(`Querying username: ${username}`)
      const result = await pool.query("SELECT * FROM public.users WHERE username ILIKE $1", [username])
      console.log(`Query result rows: ${JSON.stringify(result.rows)}`)
      return result.rows[0] || null
    } catch (err) {
      console.error("Find by username error:", err.stack)
      throw new Error("Database error while finding user")
    }
  },

  create: async user => {
    let { username, email, avatar, bio, password, admin = false, refresh_interval = 30 * 60 * 1000 } = user
    avatar = `https://gravatar.com/avatar/${md5(email)}?s=128`
    try {
      const result = await pool.query("INSERT INTO public.users (username, email, avatar, bio, password, admin, refresh_interval) VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), $6, $7) RETURNING *", [username, email, avatar, bio, password, admin, refresh_interval])
      console.log("User created:", JSON.stringify(result.rows[0]))
      return result.rows[0]
    } catch (err) {
      console.error("Create user error:", err.stack)
      throw err
    }
  },

  update: async (id, user) => {
    let { username, email, avatar, bio, password, admin, refresh_interval } = user
    avatar = email ? `https://gravatar.com/avatar/${md5(email)}?s=128` : undefined
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
    if (refresh_interval !== undefined && refresh_interval !== currentUser.refresh_interval) {
      updateFields.push(`refresh_interval = $${index++}`)
      values.push(refresh_interval)
    }
    values.push(id)

    if (updateFields.length === 0) return currentUser

    const query = `UPDATE public.users SET ${updateFields.join(", ")} WHERE "user_id" = $${index} RETURNING *`
    try {
      console.log("Executing update query:", query, "with values:", values)
      const result = await pool.query(query, values)
      console.log("Update result:", JSON.stringify(result.rows[0]))
      return result.rows[0]
    } catch (err) {
      console.error("Update user error:", err.stack)
      try {
        const altQuery = `UPDATE spp_db_schema.users SET ${updateFields.join(", ")} WHERE "user_id" = $${index} RETURNING *`
        console.log("Trying alternative schema update query:", altQuery, "with values:", values)
        const altResult = await pool.query(altQuery, values)
        console.log("Alternative schema update result:", JSON.stringify(altResult.rows[0]))
        return altResult.rows[0]
      } catch (altErr) {
        console.error("Alternative schema (spp_db_schema) update error:", altErr.stack)
      }
      throw err
    }
  },

  delete: async id => {
    try {
      const result = await pool.query('DELETE FROM public.users WHERE "user_id" = $1 RETURNING *', [id])
      if (!result.rows[0]) throw new Error("User not found")
      console.log("User deleted:", JSON.stringify(result.rows[0]))
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
      console.log("Password verification result:", result.rows[0].match)
      return result.rows[0].match
    } catch (err) {
      console.error("Verify password error:", err.stack)
      throw err
    }
  }
}

// Test schema on startup
User.testConnection().catch(err => console.error("Initial schema test failed:", err.stack))

module.exports = User
