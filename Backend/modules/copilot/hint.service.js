/**
 * Real-Time AI Sales Copilot — Hint Engine v2 (RAG + Talk Tracks)
 *
 * Analyzes the live transcript, searches the Knowledge Base for
 * relevant products/FAQs, and generates hints with exact Talk Tracks.
 *
 *   🔴 Objection detected   → counter-argument + talk track
 *   🔵 Question detected    → data-backed answer + talk track
 *   🟢 Buying signal        → closing move + talk track
 *   🟡 Coaching tip         → technique advice + talk track
 *
 * Uses Groq (llama-3.3-70b-versatile) for ultra-fast inference.
 */

import Groq from "groq-sdk";
import "dotenv/config.js";
import { searchKnowledgeBase } from "./knowledge.service.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 15_000,
});

const MIN_NEW_WORDS = 8;

/**
 * Analyze the recent transcript, search the Knowledge Base,
 * and generate a real-time hint with a Talk Track.
 *
 * @param {Array<{text: string, timestamp: number}>} transcriptBuffer
 * @param {Object} callContext - { customerName, productName, callType }
 * @param {number} fromIndex - Start analyzing from this transcript index
 * @returns {Promise<Object|null>} - Hint object or null
 */
export const generateHint = async (transcriptBuffer, callContext = {}, fromIndex = 0) => {
  try {
    const recentTranscripts = transcriptBuffer.slice(fromIndex);
    if (recentTranscripts.length === 0) return null;

    const recentText = recentTranscripts.map((t) => t.text).join(" ");
    if (recentText.split(/\s+/).length < MIN_NEW_WORDS) return null;

    // Context window — last 10 entries
    const contextWindow = transcriptBuffer.slice(-10).map((t) => t.text).join(" ");

    // ── RAG: Search the Knowledge Base ──
    const kbResults = searchKnowledgeBase(recentText, callContext);
    const kbContext = kbResults.contextString || "";

    // ── Build the LLM prompt ──
    const systemPrompt = `You are a real-time AI sales copilot listening to a LIVE sales call. Your job is to instantly help the salesperson by detecting critical moments and providing a ready-to-speak Talk Track.

CALL CONTEXT:
- Customer: ${callContext.customerName || "Unknown"}
- Product/Company: ${callContext.productName || "General"}
- Call Type: ${callContext.callType || "sales"}
${kbContext ? `\n--- COMPANY KNOWLEDGE BASE (USE THIS DATA — DO NOT MAKE UP INFORMATION) ---${kbContext}--- END KNOWLEDGE BASE ---\n` : ""}
ANALYZE the latest spoken text and determine if there is ONE actionable hint to give the salesperson RIGHT NOW.

DETECT these situations:
1. OBJECTION — Customer raised a concern, price complaint, hesitation, competitive comparison, or pushback
2. QUESTION — Customer asked a technical, pricing, feature, availability, or product question
3. BUYING_SIGNAL — Customer showed interest, urgency, asked about next steps, mentioned budget, or asked for a proposal
4. COACHING — Salesperson could improve their approach (talking too much, missing cues, not asking questions)
5. NONE — Nothing actionable right now

Return ONLY valid JSON in this exact format:
{
  "type": "OBJECTION" | "QUESTION" | "BUYING_SIGNAL" | "COACHING" | "NONE",
  "confidence": 0.0 to 1.0,
  "trigger": "the exact words or phrase that triggered this hint",
  "hint": "15-25 word actionable label for the salesperson",
  "detail": "1-2 sentence expanded context",
  "talkTrack": "The EXACT sentence(s) the salesperson should say out loud. Must be natural, conversational, 2-3 sentences max. Use the customer's name. Include specific product data from the Knowledge Base if available. End with an open-ended question."
}

CRITICAL RULES:
- Be VERY selective. Only return a hint if confidence >= 0.7
- If nothing actionable, return {"type": "NONE", "confidence": 0}
- The talkTrack is the MOST IMPORTANT field — it must be a natural, ready-to-speak sentence
- For OBJECTION: acknowledge the concern, pivot to value using KB data, ask a question
- For QUESTION: give a direct, data-backed answer from the Knowledge Base, then ask a follow-up
- For BUYING_SIGNAL: confirm interest, suggest a concrete next step (test drive, proposal, trial)
- For COACHING: suggest the exact phrase the rep should say next
- ALWAYS use real product names, prices, and features from the Knowledge Base — NEVER make up information
- If no Knowledge Base data is available, give general sales coaching advice
- Do NOT repeat hints for the same topic
- Return ONLY valid JSON, no markdown, no comments`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `FULL CONTEXT (last ~30 seconds):\n"${contextWindow}"\n\nNEW TEXT TO ANALYZE:\n"${recentText}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 350, // Increased for talk tracks
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return null;

    const hint = JSON.parse(responseText);

    // Filter non-actionable or low-confidence
    if (!hint || hint.type === "NONE" || (hint.confidence && hint.confidence < 0.7)) {
      return null;
    }

    if (!hint.type || !hint.hint) return null;

    return {
      type: hint.type,
      confidence: hint.confidence || 0.8,
      trigger: hint.trigger || "",
      hint: hint.hint,
      detail: hint.detail || "",
      talkTrack: hint.talkTrack || "",
      timestamp: Date.now(),
      // Include matched KB products for the frontend to display
      kbProducts: kbResults.products.slice(0, 3).map((p) => ({
        name: p.name,
        price: p.priceFormatted,
        features: p.keyFeatures.slice(0, 4),
      })),
    };
  } catch (error) {
    if (error.status === 429) {
      console.warn("[Copilot Hints] Rate limited by Groq, skipping.");
      return null;
    }
    console.error("[Copilot Hints] Error:", error.message);
    return null;
  }
};
