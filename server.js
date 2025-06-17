const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
let userRoutes // Change to let to allow reassignment if needed

console.log("Attempting to load userRoutes")
try {
  userRoutes = require("./routes/userRoutes")
} catch (error) {
  console.error("Failed to load userRoutes:", error.stack)
}

if (!userRoutes) {
  console.error("userRoutes is undefined, routes will not be available")
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

app.get("/", (req, res) => {
  res.json({ message: "SPP API is running" })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
