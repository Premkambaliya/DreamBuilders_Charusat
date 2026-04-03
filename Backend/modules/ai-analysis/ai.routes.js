import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { analyzeCall, getInsights } from "./ai.controller.js";

const router = express.Router();

// Protected Routes - Require Authentication
// POST - Analyze call and generate AI insights
router.post("/analyze/:callId", authMiddleware, analyzeCall);

// GET - Retrieve AI insights
router.get("/insights/:callId", authMiddleware, getInsights);

export default router;
