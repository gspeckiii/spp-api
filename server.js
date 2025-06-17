const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const userRoutes = require("./routes/userRoutes")
const categoryRoutes = require("./routes/categoryRoutes") // New route file

console.log("Attempting to load userRoutes and categoryRoutes")
try {
  const userRoutes = require("./routes/userRoutes")
  const categoryRoutes = require("./routes/categoryRoutes") // Load category routes
  console.log("userRoutes.js and categoryRoutes.js loaded successfully")
} catch (error) {
  console.error("Failed to load routes:", error.stack)
}

if (!userRoutes || !categoryRoutes) {
  console.error("One or more route files are undefined, routes will not be available")
}

dotenv.config()

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
)

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url} from ${req.get("origin")} with body:`, req.body)
  next()
})

app.use("/api", userRoutes)
app.use("/api", categoryRoutes) // Mount category routes under /api

app.get("/", (req, res) => {
  res.json({ message: "SPP API is running" })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
