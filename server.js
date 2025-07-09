const express = require("express")
const dotenv = require("dotenv")
dotenv.config()
console.log("DATABASE_URL from .env:", process.env.DATABASE_URL); // <-- Add this line
const cors = require("cors")
const path = require("path")
console.log("Attempting to load userRoutes, categoryRoutes, imageRoutes, productRoutes, and categoryImageRoutes...")

let userRoutes, categoryRoutes, imageRoutes, productRoutes, categoryImageRoutes
try {
  userRoutes = require("./routes/userRoutes")
  categoryRoutes = require("./routes/categoryRoutes")
  imageRoutes = require("./routes/imageRoutes")
  productRoutes = require("./routes/productRoutes")
  categoryImageRoutes = require("./routes/categoryImageRoutes")
  console.log("userRoutes.js, categoryRoutes.js, imageRoutes.js, productRoutes.js, and categoryImageRoutes.js loaded successfully")
} catch (error) {
  console.error("Failed to load one or more route files:", error.message, error.stack)
  process.exit(1)
}

if (!userRoutes || !categoryRoutes || !imageRoutes || !productRoutes || !categoryImageRoutes) {
  console.error("One or more route files are undefined, routes will not be available")
  process.exit(1)
}



const app = express()
app.use(express.json())
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
)
app.use("/images", express.static(path.join(__dirname, "images")))
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url} from ${req.get("origin")} with body:`, req.body)
  next()
})
app.use("/api", productRoutes)
app.use("/api", userRoutes)
app.use("/api", categoryRoutes)
app.use("/api", imageRoutes)
app.use("/api", categoryImageRoutes)

app.get("/", (req, res) => {
  res.json({ message: "SPP API is running" })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
