// === THE DEFINITIVE FIX FOR 'fetch failed' ===
// This line forces Node.js to prefer IPv4 addresses, resolving network issues.
// It is good practice to have this early, but it MUST come AFTER dotenv.config().
// Let's move it to the correct spot.

// --- Application code begins here ---
const express = require("express");
const dotenv = require("dotenv");
// dotenv.config() MUST be the very first thing to run to ensure all variables are loaded.
dotenv.config();
const cors = require("cors");
const path = require("path");

// Force IPv4 DNS resolution. This should come after dotenv.config().
require("dns").setDefaultResultOrder("ipv4first");

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

// --- Import all controllers and route files ---

// Webhook controllers
const paymentController = require("./controllers/paymentController");
const printfulWebhookController = require("./controllers/printfulWebhookController");

// Routers
const easypostWebhookRoutes = require("./routes/easypostWebhookRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const imageRoutes = require("./routes/imageRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryImageRoutes = require("./routes/categoryImageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const printfulRoutes = require("./routes/printfulRoutes");

console.log("All route files loaded successfully.");
const app = express();

// --- WEBHOOK ROUTES (BEFORE express.json()) ---
// This section is correct. They need the raw request body.
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);
app.post(
  "/api/webhooks/printful",
  express.raw({ type: "application/json" }),
  printfulWebhookController.handleWebhook
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
app.use("/api/easypost-webhook", easypostWebhookRoutes);

// --- GLOBAL MIDDLEWARE (AFTER WEBHOOKS) ---
// This is the section that was missing from my last snippet and caused the login to fail.

app.use(express.json({ limit: "10mb" })); // <<< THIS IS CRITICAL FOR LOGIN
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://shermanpeckproductions.com",
  "https://www.shermanpeckproductions.com",
];
const corsOptions = {
  origin: function (origin, callback) {
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

// Logging middleware
app.use((req, res, next) => {
  console.log(
    `Received ${req.method} request for ${req.url} from ${req.get("origin")}`
  );
  next();
});

// --- API ROUTE MOUNTING ---
// All of your routes are now correctly mounted.
app.use("/api", productRoutes);
app.use("/api", userRoutes); // <<< THIS IS CRITICAL FOR LOGIN
app.use("/api", categoryRoutes);
app.use("/api", imageRoutes);
app.use("/api", categoryImageRoutes);
app.use("/api", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/printful", printfulRoutes);

// Root endpoint for health checks
app.get("/", (req, res) => {
  res.json({ message: "SPP API is running" });
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running successfully on port ${PORT}`);
});
