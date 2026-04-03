import CallModel from "../audio/audio.model.js";
import ProductModel from "../products/product.model.js";
import { analyzeConversation } from "./ai.service.js";

export const analyzeCall = async (req, res) => {
  try {
    const { callId } = req.params;

    // Find the call record
    const call = await CallModel.findById(callId);

    if (!call) {
      return res.status(404).json({
        message: "Call not found",
        callId,
      });
    }

    // Check if transcript exists
    if (!call.transcript) {
      return res.status(400).json({
        message: "Transcript not available. Please transcribe the audio first.",
        callId,
      });
    }

    // Analyze conversation using AI
    const aiInsights = await analyzeConversation(call.transcript);

    // If AI detects a product but the call didn't have one selected natively, attempt to auto-link
    let targetProductId = call.productId || null;
    const aiDerivedProductName = aiInsights.productName || "Unknown";

    if (!targetProductId && aiDerivedProductName && aiDerivedProductName !== "Unknown") {
      try {
        // Find products for this company
        const companyProducts = await ProductModel.findByCompanyId(call.companyId);
        
        // Find the closest match (ignore casing/trimming)
        const matchedProduct = companyProducts.find(p => 
          p.productName?.toLowerCase().trim() === aiDerivedProductName.toLowerCase().trim() ||
          aiDerivedProductName.toLowerCase().includes(p.productName?.toLowerCase().trim())
        );

        if (matchedProduct) {
          targetProductId = matchedProduct._id.toString();
        }
      } catch (err) {
        console.error("Auto product linking failed silently:", err);
      }
    }

    // Update call record with AI insights and status
    await CallModel.updateOne(callId, {
      aiInsights,
      status: "analyzed",
      productId: targetProductId,
      product_name: aiInsights.productName || "Unknown",
      call_title: aiInsights.callTitle || "Untitled Call",
      call_type: aiInsights.callType || "other",
      customer_name: (call.customer_name && call.customer_name !== "Unknown") ? call.customer_name : (aiInsights.customer?.name || "Unknown"),
      customer_email: call.customer_email || aiInsights.customer?.email || "",
      customer_phone: call.customer_phone || aiInsights.customer?.phone || "",
      email_subject: aiInsights.emailDraft?.subject || "Follow-up on our call",
      salesperson_rating: aiInsights.salespersonPerformance?.rating || 5,
      salesperson_tone: aiInsights.salespersonTone?.overall || "neutral",
      customer_engagement: aiInsights.conversationAnalysis?.customerEngagementScore || 5,
      urgency_level: aiInsights.conversationAnalysis?.urgencyLevel || "medium",
    });

    res.status(200).json({
      message: "AI analysis completed successfully",
      callId,
      insights: aiInsights,
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    res.status(500).json({
      error: error.message,
      message: "AI analysis failed",
    });
  }
};

export const getInsights = async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await CallModel.findById(callId);

    if (!call) {
      return res.status(404).json({
        message: "Call not found",
        callId,
      });
    }

    if (!call.aiInsights) {
      return res.status(404).json({
        message: "AI insights not found. Please analyze the call first.",
        callId,
      });
    }

    res.status(200).json({
      callId,
      insights: call.aiInsights,
      transcript: call.transcript,
      createdAt: call.createdAt,
    });
  } catch (error) {
    console.error("Error retrieving insights:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to retrieve insights",
    });
  }
};
