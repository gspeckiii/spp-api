const { Pool } = require("pg");
require("dotenv").config();

// Your pool configuration is correct.
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  // Optional: Add a connection timeout to prevent hanging
  connectionTimeoutMillis: 5000,
});

// === THE DEFINITIVE FIX ===
// 1. Use the 'on' event listener to catch errors from idle clients in the pool.
//    This is the recommended way to handle background pool errors.
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client in the pool:", err);
  process.exit(-1); // Exit the process if a background error occurs
});

// 2. Create a small async function to test the connection on startup.
//    This will give a clear success or a very clear error message.
async function testConnection() {
  let client;
  try {
    console.log("Attempting to connect to the database...");
    client = await pool.connect();
    console.log("Database connection successful!");
  } catch (err) {
    console.error("FATAL: Could not connect to the database.");
    console.error(err.stack);
    process.exit(1); // Exit with an error code if connection fails
  } finally {
    // Make sure to release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

// 3. Call the test function when this module is loaded.
testConnection();

// 4. Export the pool for the rest of your application to use.
module.exports = pool;
