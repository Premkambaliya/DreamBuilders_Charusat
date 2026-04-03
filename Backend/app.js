import express from "express";
import cors from "cors";
import "dotenv/config.js";
import authRoutes from "./modules/auth/auth.routes.js";
import audioRoutes from "./modules/audio/audio.routes.js";
import transcriptionRoutes from "./modules/transcription/transcription.routes.js";



const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded audio files statically
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/transcription", transcriptionRoutes);


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Conversation Intelligence & Action Platform 🚀",
    timestamp: new Date(),
    backend: "aisi",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: err.message,
    message: "Internal server error",
  });
});

export default app;
