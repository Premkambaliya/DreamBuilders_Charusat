/**
 * Real-Time AI Sales Copilot — Hint Engine (Phase 3)
 *
 * Analyzes the live transcript buffer and generates real-time
 * coaching hints for the sales rep:
 *   🔴 Objection detected   → counter-argument
 *   🔵 Question detected    → answer suggestion
 *   🟢 Buying signal        → "Go for the close!" prompt
 *   🟡 Coaching tip         → tone / technique advice
 *
 * Uses Groq (llama-3.3-70b-versatile) for ultra-fast inference.
 */

import Groq from "groq-sdk";
import "dotenv/config.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 15_000, // 15s — hints must be fast
});

// Only process when we have enough new context
const MIN_NEW_WORDS = 8;

// Track what we've already analyzed to avoid duplicate hints
let lastAnalyzedIndex = -1;

/**
 * Analyze the recent transcript and generate a real-time hint.
 *
 * @param {Array<{text: string, timestamp: number}>} transcriptBuffer - Recent transcripts
 * @param {Object} callContext - { customerName, productName, callType }
 * @param {number} fromIndex - Start analyzing from this transcript index
 * @returns {Promise<Object|null>} - Hint object or null if nothing actionable
 */
export const generateHint = async (transcriptBuffer, callContext = {}, fromIndex = 0) => {
  try {
    // Get only the new/recent transcripts since last analysis
    const recentTranscripts = transcriptBuffer.slice(fromIndex);

    if (recentTranscripts.length === 0) return null;

    // Build the recent conversation text
    const recentText = recentTranscripts.map((t) => t.text).join(" ");

    // Skip if too few new words
    if (recentText.split(/\s+/).length < MIN_NEW_WORDS) return null;

    // Build context window — last 10 entries for full context
    const contextWindow = transcriptBuffer.slice(-10).map((t) => t.text).join(" ");

    const systemPrompt = `You are a real-time AI sales copilot listening to a LIVE sales call. Your job is to instantly help the salesperson by detecting critical moments and providing concise, actionable hints.

CALL CONTEXT:
- Customer: ${callContext.customerName || "Unknown"}
- Product: ${callContext.productName || "General"}
- Call Type: ${callContext.callType || "sales"}

ANALYZE the latest spoken text and determine if there is ONE actionable hint to give the salesperson RIGHT NOW.

DETECT these situations:
1. OBJECTION — Customer raised a concern, price complaint, hesitation, or pushback
2. QUESTION — Customer asked a technical, pricing, or product question
3. BUYING_SIGNAL — Customer showed interest, urgency, asked about next steps, or mentioned budget
4. COACHING — Salesperson could improve their approach (talking too much, missing cues, wrong tone)
5. NONE — Nothing actionable right now

Return ONLY valid JSON in this exact format:
{
  "type": "OBJECTION" | "QUESTION" | "BUYING_SIGNAL" | "COACHING" | "NONE",
  "confidence": 0.0 to 1.0,
  "trigger": "the exact words or phrase that triggered this hint",
  "hint": "15-25 word actionable suggestion for the salesperson",
  "detail": "1-2 sentence expanded explanation or suggested response script"
}

CRITICAL RULES:
- Be VERY selective. Only return a hint if confidence >= 0.7
- If nothing actionable, return {"type": "NONE", "confidence": 0}
- Hints must be SHORT — the rep is on a live call, they can only glance at the screen
- For OBJECTION: provide a specific counter-argument they can say
- For QUESTION: provide the answer or suggest saying "Let me verify and confirm that for you"
- For BUYING_SIGNAL: suggest a closing move or next-step question
- For COACHING: give a brief technique tip (e.g. "Ask an open-ended question now")
- Do NOT repeat hints for the same topic
- Return ONLY JSON, no markdown, no comments`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `FULL CONTEXT (last ~30 seconds):\n"${contextWindow}"\n\nNEW TEXT TO ANALYZE:\n"${recentText}"`,
        },
      ],
      temperature: 0.3,    // Low temperature for consistent, precise hints
      max_tokens: 200,      // Keep it short
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return null;

    // Parse the JSON
    const hint = JSON.parse(responseText);

    // Filter out non-actionable or low-confidence hints
    if (!hint || hint.type === "NONE" || (hint.confidence && hint.confidence < 0.7)) {
      return null;
    }

    // Validate required fields
    if (!hint.type || !hint.hint) return null;

    return {
      type: hint.type,
      confidence: hint.confidence || 0.8,
      trigger: hint.trigger || "",
      hint: hint.hint,
      detail: hint.detail || "",
      timestamp: Date.now(),
    };
  } catch (error) {
    // Rate limit — skip silently
    if (error.status === 429) {
      console.warn("[Copilot Hints] Rate limited by Groq, skipping hint generation.");
      return null;
    }

    console.error("[Copilot Hints] Error generating hint:", error.message);
    return null;
  }
};
