// === THE DEFINITIVE DEBUGGING FIX ===
// These listeners will catch any crash and print a detailed error.
process.on("unhandledRejection", (reason, promise) => {
  console.error("!!!!!!!!!! UNHANDLED REJECTION !!!!!!!!!");
  console.error("Reason:", reason.stack || reason);
  console.error("Promise:", promise);
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  process.exit(1);
});

process.on("uncaughtException", (err, origin) => {
  console.error("!!!!!!!!!! UNCAUGHT EXCEPTION !!!!!!!!!");
  console.error("Error:", err.stack || err);
  console.error("Origin:", origin);
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  process.exit(1);
});

// --- Your existing server code begins here ---
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const path = require("path");

console.log(
  "Attempting to load userRoutes, categoryRoutes, imageRoutes, productRoutes, orderRoutes and categoryImageRoutes..."
);

let userRoutes,
  categoryRoutes,
  imageRoutes,
  productRoutes,
  categoryImageRoutes,
  orderRoutes;

try {
  orderRoutes = require("./routes/orderRoutes");
  userRoutes = require("./routes/userRoutes");
  categoryRoutes = require("./routes/categoryRoutes");
  imageRoutes = require("./routes/imageRoutes");
  productRoutes = require("./routes/productRoutes");
  categoryImageRoutes = require("./routes/categoryImageRoutes");
  console.log("All route files loaded successfully");
} catch (error) {
  console.error(
    "Failed to load one or more route files:",
    error.message,
    error.stack
  );
  process.exit(1);
}

if (
  !userRoutes ||
  !categoryRoutes ||
  !imageRoutes ||
  !productRoutes ||
  !categoryImageRoutes ||
  !orderRoutes
) {
  console.error(
    "One or more route files are undefined, routes will not be available"
  );
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use((req, res, next) => {
  console.log(
    `Received ${req.method} request for ${req.url} from ${req.get(
      "origin"
    )} with body:`,
    req.body
  );
  next();
});

// Mount all the top-level routers
app.use("/api", productRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", imageRoutes);
app.use("/api", categoryImageRoutes);
app.use("/api", orderRoutes);

app.get("/", (req, res) => {
  res.json({ message: "SPP API is running" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
