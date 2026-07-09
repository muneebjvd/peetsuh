// ============================================================
// peetsuh — Fuzzy Matching Engine
// Hand-built: Levenshtein distance + normalization + intent matcher
// NO external fuzzy/NLP libraries — this is the point of the project
// ============================================================

// ── 1. LEVENSHTEIN DISTANCE (from scratch) ───────────────────
/**
 * Computes the Levenshtein (edit) distance between two strings.
 * Uses the Wagner-Fischer dynamic programming algorithm.
 * O(m*n) time, O(min(m,n)) space via two-row optimization.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Edge cases
  if (m === 0) return n;
  if (n === 0) return m;

  // Ensure we always allocate the smaller array as the column
  if (m < n) return levenshtein(b, a);

  // prev[j] = distance between a[0..i-1] and b[0..j-1]
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    // Swap rows
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Converts edit distance to a [0,1] similarity score.
 * similarity = 1 - (distance / max(len(a), len(b)))
 */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1; // both empty → identical
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

// ── 2. TEXT NORMALIZATION ─────────────────────────────────────
// Small explicit stopword list — drop only the most common noise words
const STOPWORDS = new Set([
  "what", "is", "the", "do", "you", "have", "i", "want", "a", "an",
  "can", "please", "me", "get", "show", "tell", "to", "of", "for",
  "at", "in", "on", "and", "or", "like", "would", "need",
  "your", "my", "we", "how", "much", "does", "it", "cost", "give",
]);

/**
 * Normalizes raw user input:
 * 1. Lowercase
 * 2. Strip punctuation (keep letters, digits, spaces)
 * 3. Tokenize on whitespace
 * 4. Drop stopwords
 */
export function normalize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

// ── 3. INTENT DEFINITIONS ─────────────────────────────────────
export interface Intent {
  id: string;
  triggers: string[]; // keyword/phrase trigger list
  priority?: number;  // higher = preferred when scores are equal
}

export const INTENTS: Intent[] = [
  // ── Deals
  {
    id: "LUNCH_DEAL",
    priority: 10,
    triggers: ["lunch", "lunch deal", "lunch combo", "midday", "noon", "lanch"],
  },
  {
    id: "BUFFET",
    priority: 10,
    triggers: ["buffet", "buffett", "unlimited", "all you can eat", "group meal"],
  },
  {
    id: "HI_TEA",
    priority: 10,
    triggers: ["hi tea", "hi-tea", "high tea", "hitea", "afternoon", "tea time", "evening deal"],
  },
  // ── Category selection
  {
    id: "ORDER",
    priority: 5,
    triggers: ["order", "ordering", "buy", "purchase", "want to order", "place order", "make an order", "i want to buy", "can i order", "take my order", "start an order", "let me order", "hungry", "gimme food", "give me food", "get me something"],
  },
  {
    id: "BOOK_TABLE",
    priority: 5,
    triggers: ["book", "table", "reservation", "reserve", "seat", "dine in", "dine-in", "eat here", "eat in", "sitting space", "book a table", "need a table", "party booking", "reserve a spot", "coming over", "visiting", "table for"],
  },
  {
    id: "TRACK_ORDER",
    priority: 20,
    triggers: ["track", "status", "track order", "order status", "where order"],
  },
  {
    id: "APPRECIATION",
    priority: 5,
    triggers: ["thank you", "thanks", "great", "welcome", "you are best", "best", "awesome", "good job", "appreciate", "thank"],
  },
  // ── Categories (used in CATEGORY_SELECTION state)
  {
    id: "CAT_PIZZA",
    priority: 5,
    triggers: ["pizza", "pizzas", "pie", "peetsuh", "peeza"],
  },
  {
    id: "CAT_FRIES",
    priority: 5,
    triggers: ["fries", "chips", "frize", "freis", "frez", "french fries"],
  },
  {
    id: "CAT_DRINKS",
    priority: 4,
    triggers: ["drinks", "drink", "beverage", "cola", "soda"],
  },
  {
    id: "CAT_DEALS",
    priority: 5,
    triggers: ["deal", "deals", "dael", "combo", "special"],
  },
  {
    id: "CAT_SAUCE",
    priority: 4,
    triggers: ["sauce", "sauces", "dip", "dips", "chilli", "chili"],
  },
  // ── Pizza flavors
  {
    id: "PIZZA_MARGHERITA",
    priority: 7,
    triggers: ["margherita", "margarita", "classic", "simple"],
  },
  {
    id: "PIZZA_BBQ_CHICKEN",
    priority: 7,
    triggers: ["bbq", "barbecue", "barbeque", "bbq chicken", "smoky chicken"],
  },
  {
    id: "PIZZA_PERI_PERI",
    priority: 7,
    triggers: ["peri peri", "peri-peri", "periperi", "spicy chicken", "hot chicken"],
  },
  {
    id: "PIZZA_PEPPERONI",
    priority: 7,
    triggers: ["pepperoni", "peperoni", "pepproni"],
  },
  {
    id: "PIZZA_VEGGIE",
    priority: 7,
    triggers: ["veggie", "vegetarian", "veg", "vegetables"],
  },
  {
    id: "PIZZA_TIKKA",
    priority: 7,
    triggers: ["tikka", "chicken tikka", "desi", "masala chicken"],
  },
  {
    id: "PIZZA_MEXICANA",
    priority: 7,
    triggers: ["mexicana", "mexican", "mexico", "jalapeno"],
  },
  {
    id: "PIZZA_MEAT_FEAST",
    priority: 7,
    triggers: ["meat feast", "meat", "mixed meat", "all meat"],
  },
  {
    id: "PIZZA_MUSHROOM",
    priority: 7,
    triggers: ["mushroom", "truffle", "mushroom truffle"],
  },
  {
    id: "PIZZA_FOUR_CHEESE",
    priority: 7,
    triggers: ["four cheese", "4 cheese", "cheese pizza", "extra cheese"],
  },
  {
    id: "PIZZA_RANCH_CHICKEN",
    priority: 7,
    triggers: ["ranch", "ranch chicken", "creamy chicken"],
  },
  {
    id: "PIZZA_LAHORI",
    priority: 7,
    triggers: ["lahori", "lahore", "desi special", "seekh", "kebab pizza"],
  },
  {
    id: "PIZZA_GARLIC_PRAWN",
    priority: 7,
    triggers: ["garlic prawn", "prawn", "shrimp", "seafood"],
  },
  {
    id: "PIZZA_BUFFALO",
    priority: 7,
    triggers: ["buffalo", "buffalo blast", "buffalo chicken", "hot sauce pizza"],
  },
  {
    id: "PIZZA_HAWAIIAN",
    priority: 7,
    triggers: ["hawaiian", "hawaii", "pineapple", "ham"],
  },
  // ── Fries flavors
  {
    id: "FRIES_PLAIN",
    priority: 7,
    triggers: ["plain fries", "plain", "salted", "regular fries"],
  },
  {
    id: "FRIES_MASALA",
    priority: 7,
    triggers: ["masala fries", "masala", "chatpata", "spiced fries"],
  },
  {
    id: "FRIES_PERIPERI",
    priority: 7,
    triggers: ["peri peri fries", "peri fries", "fiery fries", "spicy fries"],
  },
  // ── Drinks
  {
    id: "DRINK_COKE",
    priority: 6,
    triggers: ["coke", "coca cola", "cocacola", "cola"],
  },
  {
    id: "DRINK_SPRITE",
    priority: 6,
    triggers: ["sprite", "lemon lime", "7up"],
  },
  // ── Sizes
  {
    id: "SIZE_SMALL",
    priority: 2,
    triggers: ["small", "sm", "tiny", "petite", "mini", "personal"],
  },
  {
    id: "SIZE_MEDIUM",
    priority: 2,
    triggers: ["medium", "med", "regular", "standard", "normal"],
  },
  {
    id: "SIZE_LARGE",
    priority: 2,
    triggers: ["large", "lg", "big", "family", "xl", "extra large"],
  },
  {
    id: "SIZE_250ML",
    priority: 2,
    triggers: ["250ml", "250", "small bottle", "can", "small drink"],
  },
  {
    id: "SIZE_1_5L",
    priority: 2,
    triggers: ["1.5l", "1.5", "1.5 liter", "large bottle", "big bottle", "family size"],
  },
  // ── Sauces
  {
    id: "SAUCE_KETCHUP",
    priority: 6,
    triggers: ["ketchup", "tomato sauce", "red sauce"],
  },
  {
    id: "SAUCE_CHILLI_GARLIC",
    priority: 6,
    triggers: ["chilli garlic", "chili garlic", "garlic chilli", "spicy garlic"],
  },
  {
    id: "SAUCE_GARLIC_MAYO",
    priority: 6,
    triggers: ["garlic mayo", "mayo", "mayonnaise", "creamy sauce"],
  },
  // ── Confirmation
  {
    id: "CONFIRM_YES",
    priority: 12,
    triggers: ["yes", "yeah", "yep", "confirm", "correct", "sure", "go ahead", "ok", "okay", "yup"],
  },
  {
    id: "CONFIRM_NO",
    priority: 12,
    triggers: ["no", "nope", "cancel", "nah", "stop", "wrong", "change", "different"],
  },
  // ── Menu / Info
  {
    id: "MENU",
    priority: 4,
    triggers: ["menu", "items", "options", "choices", "list", "what do you have", "what have", "what is on the menu", "show me the menu", "food options", "what can i get", "what are you selling", "catalogue", "catalog", "give me menu", "send menu"],
  },
  {
    id: "PRICE",
    priority: 4,
    triggers: ["price", "prices", "cost", "how much", "rate", "rates", "charges", "expensive", "is it costly", "how much does it cost", "bill", "money", "what is the price", "tell me the price", "pricing"],
  },
  {
    id: "GREETING",
    priority: 9,
    triggers: ["hi", "hello", "hey", "sup", "greetings", "good morning", "good evening", "salam", "how are you", "assalamualaikum", "what's up", "whats up", "hiya", "how do you do", "morning", "afternoon", "evening", "namaste", "hola", "yo", "anyone there", "talk to me"],
  },
  {
    id: "FAQ_WHO_ARE_YOU",
    priority: 8,
    triggers: ["who are you", "are you bot", "your name", "who am i talking to", "are you human", "are you a robot", "what is your name", "who is this", "tell me about yourself", "are you real", "are you an ai", "what are you"],
  },
  {
    id: "FAQ_BEST_SELLER",
    priority: 8,
    triggers: ["most seller", "best thing", "best seller", "top seller", "popular", "famous", "most ordered", "most best pizza", "what is the best", "your best", "best pizza", "top pizza", "most selling", "highest selling", "best item", "signature", "signature pizza", "specialty", "what is famous", "most liked", "crowd favorite", "everyone likes", "best food"],
  },
  {
    id: "FAQ_RECOMMEND",
    priority: 8,
    triggers: ["should eat", "recommend", "suggest", "recommendation", "confused", "decide", "what should i order", "what to get", "can you recommend", "what do you suggest", "help me decide", "i don't know what to eat", "surprise me", "give me an idea", "what's good", "whats good", "good pizza", "tasty pizza", "yummy"],
  },
  {
    id: "FAQ_CHEAPEST",
    priority: 8,
    triggers: ["cheapest", "lowest price", "budget", "cheap", "most affordable", "least expensive", "economic", "cheap pizza", "pocket friendly", "budget friendly", "low cost", "not too expensive", "cheap food"],
  },
  {
    id: "FAQ_DELIVERY",
    priority: 8,
    triggers: ["delivery", "deliver", "home delivery", "how long", "delivery time", "when will it arrive", "where do you deliver", "delivery charges", "free delivery", "do you deliver", "bring it to my house", "send to my home"],
  },
  {
    id: "FAQ_LOCATION",
    priority: 8,
    triggers: ["location", "where are you", "address", "branch", "branches", "restaurant location", "where is your shop", "where is peetsuh", "map", "directions", "how to reach", "where to come", "your city"],
  },
  {
    id: "FAQ_TIMINGS",
    priority: 8,
    triggers: ["timings", "opening hours", "closing hours", "when do you open", "are you open", "when do you close", "what time", "business hours", "working hours", "late night", "open now"],
  },
];

// ── 4. FUZZY INTENT MATCHER ───────────────────────────────────
export const MATCH_THRESHOLD = 0.60; // 60% similarity

export interface MatchResult {
  intentId: string | null;
  score: number;
  matched: string; // which trigger phrase matched best
}

/**
 * Scores a single candidate intent against the normalized tokens.
 *
 * Strategy:
 * - For each trigger phrase in the intent, tokenize the trigger.
 * - For each trigger token, find its best fuzzy match across input tokens.
 * - A trigger phrase "scores" as the average similarity of its tokens.
 * - Take the max scoring trigger phrase as this intent's score.
 * - Additionally, do a sliding-window match of multi-word triggers against
 *   the raw normalized-tokens string for phrase-level matching.
 */
function scoreIntent(
  intent: Intent,
  inputTokens: string[],
  rawNormalized: string
): { score: number; matched: string } {
  let bestScore = 0;
  let bestTrigger = "";

  for (const trigger of intent.triggers) {
    const triggerTokens = trigger
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (triggerTokens.length === 0) continue;

    let triggerScore = 0;

    if (triggerTokens.length === 1) {
      // Single-word trigger: match against every input token
      const tw = triggerTokens[0];
      let maxSim = 0;
      for (const it of inputTokens) {
        const s = similarity(tw, it);
        if (s > maxSim) maxSim = s;
      }
      triggerScore = maxSim;
    } else {
      // Multi-word trigger: two strategies, take the better
      // Strategy A: average best-match per trigger token
      let sumSim = 0;
      for (const tw of triggerTokens) {
        let maxSim = 0;
        for (const it of inputTokens) {
          const s = similarity(tw, it);
          if (s > maxSim) maxSim = s;
        }
        sumSim += maxSim;
      }
      const avgSim = sumSim / triggerTokens.length;

      // Strategy B: sliding-window phrase match on raw normalized string
      // e.g. "bbq chicken" vs "i want bbq chieken"
      const triggerPhrase = triggerTokens.join(" ");
      let windowSim = 0;
      const inputWords = rawNormalized.split(/\s+/);
      const winSize = triggerTokens.length;
      for (let i = 0; i <= inputWords.length - winSize; i++) {
        const window = inputWords.slice(i, i + winSize).join(" ");
        const s = similarity(triggerPhrase, window);
        if (s > windowSim) windowSim = s;
      }
      // Also try full input vs trigger phrase
      const fullSim = similarity(triggerPhrase, rawNormalized);
      if (fullSim > windowSim) windowSim = fullSim;

      triggerScore = Math.max(avgSim, windowSim);
    }

    if (triggerScore > bestScore) {
      bestScore = triggerScore;
      bestTrigger = trigger;
    }
  }

  return { score: bestScore, matched: bestTrigger };
}

/**
 * Main intent matching function.
 * Returns the best matching intent above the threshold, or null.
 *
 * @param input - Raw user input string
 * @param allowedIntentIds - Optional whitelist (for state-constrained listening)
 */
export function matchIntent(
  input: string,
  allowedIntentIds?: string[]
): MatchResult {
  const inputTokens = normalize(input);
  const rawNormalized = inputTokens.join(" ");

  if (inputTokens.length === 0) {
    return { intentId: null, score: 0, matched: "" };
  }

  const candidates = allowedIntentIds
    ? INTENTS.filter((i) => allowedIntentIds.includes(i.id))
    : INTENTS;

  let bestIntent: Intent | null = null;
  let bestScore = 0;
  let bestMatched = "";

  for (const intent of candidates) {
    const { score, matched } = scoreIntent(intent, inputTokens, rawNormalized);

    // Priority acts as a tiebreaker when scores are within 2% of each other
    const isBetter =
      score > bestScore + 0.001 ||
      (Math.abs(score - bestScore) <= 0.02 &&
        (intent.priority ?? 0) > (bestIntent?.priority ?? 0) &&
        score >= MATCH_THRESHOLD);

    if (isBetter) {
      bestScore = score;
      bestIntent = intent;
      bestMatched = matched;
    }
  }

  if (bestScore >= MATCH_THRESHOLD) {
    return {
      intentId: bestIntent!.id,
      score: bestScore,
      matched: bestMatched,
    };
  }

  return { intentId: null, score: bestScore, matched: "" };
}

/**
 * Convenience: match only within a constrained set of intent IDs.
 * Used by the state machine to limit what the bot "listens for"
 * in a given state.
 */
export function matchConstrained(
  input: string,
  allowedIntentIds: string[]
): MatchResult {
  return matchIntent(input, allowedIntentIds);
}

// ── 5. PHONE VALIDATION ───────────────────────────────────────
// Pakistani mobile number: starts with +92 or 0, followed by 3 and 9 digits
const PHONE_REGEX = /^(\+92|0)3\d{9}$/;

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return PHONE_REGEX.test(cleaned);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+92")) return cleaned;
  if (cleaned.startsWith("0")) return "+92" + cleaned.slice(1);
  return cleaned;
}
