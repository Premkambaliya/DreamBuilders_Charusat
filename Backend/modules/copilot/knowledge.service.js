/**
 * Real-Time AI Sales Copilot — Knowledge Base Search (RAG Retrieval)
 *
 * Searches the product knowledge base using keywords from the transcript.
 * Returns the most relevant products, FAQs, and objection handlers
 * to inject into the LLM prompt as context.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the knowledge base once at startup
const KB_PATH = path.join(__dirname, "../../data/knowledge-base.json");
let knowledgeBase = null;

const loadKB = () => {
  if (knowledgeBase) return knowledgeBase;
  try {
    const raw = fs.readFileSync(KB_PATH, "utf-8");
    knowledgeBase = JSON.parse(raw);
    console.log(
      `[Knowledge Base] ✅ Loaded: ${knowledgeBase.products.length} products, ${knowledgeBase.faqs.length} FAQs, ${knowledgeBase.objectionHandlers.length} objection handlers`
    );
    return knowledgeBase;
  } catch (err) {
    console.error("[Knowledge Base] ❌ Failed to load:", err.message);
    return null;
  }
};

/**
 * Extract keywords from transcript text.
 * Removes common stop words and returns meaningful terms.
 */
const extractKeywords = (text) => {
  const stopWords = new Set([
    "i", "me", "my", "we", "our", "you", "your", "the", "a", "an", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "could", "should", "may", "might", "can", "shall",
    "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into",
    "about", "that", "this", "it", "not", "but", "and", "or", "if", "so",
    "what", "which", "who", "how", "when", "where", "there", "here", "all",
    "very", "just", "also", "than", "then", "more", "much", "some", "any",
    "tell", "know", "want", "need", "like", "think", "come", "make", "take",
    "get", "give", "go", "say", "said", "look", "see", "let", "please",
  ]);

  return text
    .toLowerCase()
    .replace(/[₹,.\-!?'"()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
};

/**
 * Try to detect a price range from the transcript.
 * Handles patterns like: "15 lakhs", "15-16 lakhs", "under 10 lakh", "below 12"
 */
const detectPriceRange = (text) => {
  const lower = text.toLowerCase();

  // Pattern: "X-Y lakhs" or "X to Y lakhs"
  const rangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/);
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]) * 100000,
      max: parseFloat(rangeMatch[2]) * 100000,
    };
  }

  // Pattern: "under/below X lakhs"
  const underMatch = lower.match(/(?:under|below|less than|within|upto|up to)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/);
  if (underMatch) {
    return { min: 0, max: parseFloat(underMatch[1]) * 100000 };
  }

  // Pattern: "above/over X lakhs"
  const overMatch = lower.match(/(?:above|over|more than|starting)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/);
  if (overMatch) {
    return { min: parseFloat(overMatch[1]) * 100000, max: Infinity };
  }

  // Pattern: "X lakhs" (exact-ish, ±2L range)
  const exactMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/);
  if (exactMatch) {
    const val = parseFloat(exactMatch[1]) * 100000;
    return { min: val - 200000, max: val + 200000 };
  }

  return null;
};

/**
 * Score how well a KB entry matches the transcript keywords.
 */
const scoreMatch = (tags, keywords) => {
  let score = 0;
  for (const keyword of keywords) {
    for (const tag of tags) {
      if (tag.includes(keyword) || keyword.includes(tag)) {
        score += 1;
      }
    }
  }
  return score;
};

/**
 * Search the knowledge base for relevant context.
 *
 * @param {string} transcriptText - The latest transcript line(s)
 * @param {Object} callContext - { customerName, productName, callType }
 * @returns {Object} - { products: [], faqs: [], objections: [], contextString: "" }
 */
export const searchKnowledgeBase = (transcriptText, callContext = {}) => {
  const kb = loadKB();
  if (!kb) return { products: [], faqs: [], objections: [], contextString: "" };

  const keywords = extractKeywords(transcriptText);

  // Also add product name from call context as a keyword
  if (callContext.productName) {
    keywords.push(...extractKeywords(callContext.productName));
  }

  if (keywords.length === 0) {
    return { products: [], faqs: [], objections: [], contextString: "" };
  }

  console.log(`[Knowledge Base] 🔍 Searching for: [${keywords.slice(0, 10).join(", ")}]`);

  // --- Search Products ---
  const priceRange = detectPriceRange(transcriptText);
  let matchedProducts = kb.products
    .map((p) => ({
      ...p,
      score: scoreMatch(p.tags, keywords) + scoreMatch([p.name.toLowerCase(), p.category.toLowerCase()], keywords),
    }))
    .filter((p) => p.score > 0);

  // Apply price filter if detected
  if (priceRange) {
    const priceFiltered = matchedProducts.filter(
      (p) => p.price >= priceRange.min && p.price <= priceRange.max
    );
    // If price filter returns results, use them; otherwise fall back to all matches
    if (priceFiltered.length > 0) {
      matchedProducts = priceFiltered;
    }
    // Also include products in price range even without keyword match
    const priceOnly = kb.products
      .filter((p) => p.price >= priceRange.min && p.price <= priceRange.max && !matchedProducts.find((m) => m.id === p.id))
      .map((p) => ({ ...p, score: 0.5 }));
    matchedProducts.push(...priceOnly);
  }

  matchedProducts.sort((a, b) => b.score - a.score);
  const topProducts = matchedProducts.slice(0, 3);

  // --- Search FAQs ---
  const matchedFaqs = kb.faqs
    .map((f) => ({
      ...f,
      score: scoreMatch(f.tags, keywords),
    }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // --- Search Objection Handlers ---
  const matchedObjections = kb.objectionHandlers
    .map((o) => ({
      ...o,
      score: scoreMatch(o.tags, keywords),
    }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // --- Build the context string for LLM injection ---
  let contextString = "";

  if (topProducts.length > 0) {
    contextString += "\n=== MATCHING PRODUCTS FROM DATABASE ===\n";
    topProducts.forEach((p, i) => {
      contextString += `${i + 1}. ${p.name} (${p.variant}) — ${p.priceFormatted}\n`;
      contextString += `   Engine: ${p.engine} | Power: ${p.power} | Mileage: ${p.mileage}\n`;
      contextString += `   Safety: ${p.safety} | Fuel: ${p.fuelType}\n`;
      contextString += `   Key Features: ${p.keyFeatures.join(", ")}\n`;
      contextString += `   Best For: ${p.bestFor}\n\n`;
    });
  }

  if (matchedFaqs.length > 0) {
    contextString += "=== MATCHING FAQs ===\n";
    matchedFaqs.forEach((f) => {
      contextString += `Q: ${f.question}\nA: ${f.answer}\n\n`;
    });
  }

  if (matchedObjections.length > 0) {
    contextString += "=== OBJECTION HANDLING SCRIPTS ===\n";
    matchedObjections.forEach((o) => {
      contextString += `Objection: "${o.objection}"\nRecommended Response: ${o.response}\n\n`;
    });
  }

  if (contextString) {
    console.log(
      `[Knowledge Base] ✅ Found: ${topProducts.length} products, ${matchedFaqs.length} FAQs, ${matchedObjections.length} objection handlers`
    );
  }

  return {
    products: topProducts,
    faqs: matchedFaqs,
    objections: matchedObjections,
    contextString,
  };
};
