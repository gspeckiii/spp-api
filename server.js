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
console.log(
  "✅ SERVER RESTARTED SUCCESSFULLY! Running latest code as of [current date/time]."
);
// --- Your existing server code begins here ---
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
// === THE FIX ===
// Correctly import the path module.
const path = require("path");

// Import the payment controller for the webhook.
const paymentController = require("./controllers/paymentController");

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

// Define the Stripe webhook route BEFORE express.json()
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

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
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

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
