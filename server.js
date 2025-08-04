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
const easypostWebhookRoutes = require("./routes/easypostWebhookRoutes");
// Import the payment controller for the webhook.
const paymentController = require("./controllers/paymentController");

console.log(
  "Attempting to load all route files: userRoutes, categoryRoutes, imageRoutes, productRoutes, orderRoutes, categoryImageRoutes, and adminRoutes..."
);

// Correctly declare all route variables
let userRoutes,
  categoryRoutes,
  imageRoutes,
  productRoutes,
  categoryImageRoutes,
  orderRoutes,
  adminRoutes; // <-- Fixed declaration

try {
  // Require all route files
  userRoutes = require("./routes/userRoutes");
  categoryRoutes = require("./routes/categoryRoutes");
  imageRoutes = require("./routes/imageRoutes");
  productRoutes = require("./routes/productRoutes");
  orderRoutes = require("./routes/orderRoutes");
  categoryImageRoutes = require("./routes/categoryImageRoutes");
  adminRoutes = require("./routes/adminRoutes"); // <-- Correctly assigned
  console.log("All route files loaded successfully.");
} catch (error) {
  console.error(
    "Failed to load one or more route files:",
    error.message,
    error.stack
  );
  process.exit(1);
}

// Check if any route files failed to load
if (
  !userRoutes ||
  !categoryRoutes ||
  !imageRoutes ||
  !productRoutes ||
  !categoryImageRoutes ||
  !orderRoutes ||
  !adminRoutes
) {
  console.error(
    "One or more route files are undefined, which means they failed to load. The server will not start."
  );
  process.exit(1);
}

const app = express();

// IMPORTANT: Define the Stripe webhook route BEFORE express.json()
// This route needs the raw request body.
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);
app.use("/api/easypost-webhook", (req, res, next) => {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk;
  });
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
});
// Define global middleware for all OTHER routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// --- THE DEFINITIVE CORS FIX ---
const allowedOrigins = [
  "http://localhost:3000",
  "https://shermanpeckproductions.com",
  "https://www.shermanpeckproductions.com",
];
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

// Serve static images
app.use("/images", express.static(path.join(__dirname, "images")));

// Optional: Logging middleware to see incoming requests
app.use((req, res, next) => {
  console.log(
    `Received ${req.method} request for ${req.url} from ${req.get("origin")}`
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
app.use("/api/admin", adminRoutes); // Mount the admin router under its own prefix
app.use("/api/easypost-webhook", easypostWebhookRoutes);
// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "SPP API is running" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running successfully on port ${PORT}`);
});
