const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const userRoutes = require("./routes/userRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const imageRoutes = require("./routes/imageRoutes") // New route file

console.log("Attempting to load userRoutes, categoryRoutes, and imageRoutes")
try {
  const userRoutes = require("./routes/userRoutes")
  const categoryRoutes = require("./routes/categoryRoutes")
  const imageRoutes = require("./routes/imageRoutes") // Load image routes
  console.log("userRoutes.js, categoryRoutes.js, and imageRoutes.js loaded successfully")
} catch (error) {
  console.error("Failed to load routes:", error.stack)
}

if (!userRoutes || !categoryRoutes || !imageRoutes) {
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
app.use("/api", categoryRoutes)
app.use("/api", imageRoutes) // Mount image routes under /api

app.get("/", (req, res) => {
  res.json({ message: "SPP API is running" })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
