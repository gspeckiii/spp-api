const { Pool } = require("pg")
require("dotenv").config()

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE
}).on("error", (err, client) => {
  console.error("Unexpected error on idle client:", err.stack)
})
pool.connect((err, client, release) => {
  if (err) {
    console.error("Pool connection error:", err.stack)
  } else {
    console.log("Pool connected successfully")
    release()
  }
})

module.exports = pool
