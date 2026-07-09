// ============================================================
// peetsuh — Comprehensive Test Suite
// Tests: fuzzy engine, state machine, validation, order flow
// ============================================================

import {
  levenshtein,
  similarity,
  normalize,
  matchIntent,
  matchConstrained,
  validatePhone,
  normalizePhone,
  MATCH_THRESHOLD,
} from "../lib/fuzzy-engine";

import {
  validateContact,
  validateItems,
  validateOrder,
} from "../lib/validation";

import {
  processMessage,
  getSession,
  resetSession,
} from "../lib/state-machine";

// ── Helper ────────────────────────────────────────────────────
let sessionCounter = 0;
function newSession(): string {
  return `test_session_${++sessionCounter}_${Date.now()}`;
}

// ════════════════════════════════════════════════════════════
// 1. LEVENSHTEIN DISTANCE
// ════════════════════════════════════════════════════════════
describe("Levenshtein Distance", () => {
  test("identical strings → 0", () => {
    expect(levenshtein("pizza", "pizza")).toBe(0);
    expect(levenshtein("", "")).toBe(0);
  });
  test("empty string edge cases", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });
  test("single substitution", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });
  test("single insertion", () => {
    expect(levenshtein("car", "cart")).toBe(1);
  });
  test("single deletion", () => {
    expect(levenshtein("cart", "car")).toBe(1);
  });
  test("lunch → lanch (common typo)", () => {
    expect(levenshtein("lunch", "lanch")).toBe(1);
  });
  test("deal → dael (transposition-like)", () => {
    expect(levenshtein("deal", "dael")).toBe(2);
  });
  test("peetsuh → peetsah", () => {
    expect(levenshtein("peetsuh", "peetsah")).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════
// 2. SIMILARITY SCORE
// ════════════════════════════════════════════════════════════
describe("Similarity Score", () => {
  test("identical → 1.0", () => {
    expect(similarity("pizza", "pizza")).toBe(1);
  });
  test("both empty → 1.0", () => {
    expect(similarity("", "")).toBe(1);
  });
  test("lunch/lanch → >= 0.8", () => {
    expect(similarity("lunch", "lanch")).toBeGreaterThanOrEqual(0.8);
  });
  test("fries/frize → >= 0.6", () => {
    expect(similarity("fries", "frize")).toBeGreaterThanOrEqual(0.6);
  });
  test("completely different → low", () => {
    expect(similarity("pizza", "zzzzz")).toBeLessThan(0.5);
  });
});

// ════════════════════════════════════════════════════════════
// 3. NORMALIZER
// ════════════════════════════════════════════════════════════
describe("Text Normalization", () => {
  test("lowercases and strips punctuation", () => {
    const tokens = normalize("Hello! I WANT a Pizza.");
    expect(tokens).not.toContain("Hello!");
    expect(tokens.some((t) => t === "pizza")).toBe(true);
  });
  test("drops stopwords", () => {
    const tokens = normalize("what is the menu");
    expect(tokens).not.toContain("what");
    expect(tokens).not.toContain("is");
    expect(tokens).not.toContain("the");
    expect(tokens).toContain("menu");
  });
  test("handles empty string", () => {
    expect(normalize("")).toEqual([]);
  });
  test("handles punctuation-only input", () => {
    expect(normalize("...!!!???")).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════
// 4. INTENT MATCHING — Exact keywords
// ════════════════════════════════════════════════════════════
describe("Intent Matching — Exact Keywords", () => {
  test("lunch → LUNCH_DEAL", () => {
    expect(matchIntent("lunch").intentId).toBe("LUNCH_DEAL");
  });
  test("buffet → BUFFET", () => {
    expect(matchIntent("buffet").intentId).toBe("BUFFET");
  });
  test("hi tea → HI_TEA", () => {
    expect(matchIntent("hi tea").intentId).toBe("HI_TEA");
  });
  test("order → ORDER", () => {
    expect(matchIntent("order").intentId).toBe("ORDER");
  });
  test("book a table → BOOK_TABLE", () => {
    expect(matchIntent("book a table").intentId).toBe("BOOK_TABLE");
  });
  test("pizza → CAT_PIZZA", () => {
    expect(matchIntent("pizza").intentId).toBe("CAT_PIZZA");
  });
  test("fries → CAT_FRIES", () => {
    expect(matchIntent("fries").intentId).toBe("CAT_FRIES");
  });
  test("coke → DRINK_COKE", () => {
    expect(matchIntent("coke").intentId).toBe("DRINK_COKE");
  });
  test("yes → CONFIRM_YES", () => {
    expect(matchIntent("yes").intentId).toBe("CONFIRM_YES");
  });
  test("no → CONFIRM_NO", () => {
    expect(matchIntent("no").intentId).toBe("CONFIRM_NO");
  });
  test("small → SIZE_SMALL", () => {
    expect(matchIntent("small").intentId).toBe("SIZE_SMALL");
  });
  test("medium → SIZE_MEDIUM", () => {
    expect(matchIntent("medium").intentId).toBe("SIZE_MEDIUM");
  });
  test("large → SIZE_LARGE", () => {
    expect(matchIntent("large").intentId).toBe("SIZE_LARGE");
  });
  test("margherita → PIZZA_MARGHERITA", () => {
    expect(matchIntent("margherita").intentId).toBe("PIZZA_MARGHERITA");
  });
  test("pepperoni → PIZZA_PEPPERONI", () => {
    expect(matchIntent("pepperoni").intentId).toBe("PIZZA_PEPPERONI");
  });
  test("ketchup → SAUCE_KETCHUP", () => {
    expect(matchIntent("ketchup").intentId).toBe("SAUCE_KETCHUP");
  });
  test("menu → MENU", () => {
    expect(matchIntent("menu").intentId).toBe("MENU");
  });
});

// ════════════════════════════════════════════════════════════
// 5. INTENT MATCHING — Common typos
// ════════════════════════════════════════════════════════════
describe("Intent Matching — Typos", () => {
  test("lanch → LUNCH_DEAL", () => {
    const r = matchIntent("lanch");
    expect(r.intentId).toBe("LUNCH_DEAL");
    expect(r.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });
  test("dael → related to deal", () => {
    const r = matchIntent("dael");
    // "dael" is close to "deal" — should match CAT_DEALS or similar
    expect(r.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });
  test("peetsuh → CAT_PIZZA (pizza alias)", () => {
    const r = matchIntent("peetsuh");
    expect(r.intentId).toBe("CAT_PIZZA");
  });
  test("frize → CAT_FRIES", () => {
    const r = matchIntent("frize");
    expect(r.intentId).toBe("CAT_FRIES");
    expect(r.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });
  test("peperoni → PIZZA_PEPPERONI", () => {
    const r = matchIntent("peperoni");
    expect(r.intentId).toBe("PIZZA_PEPPERONI");
  });
  test("margarita → PIZZA_MARGHERITA", () => {
    const r = matchIntent("margarita");
    expect(r.intentId).toBe("PIZZA_MARGHERITA");
  });
  test("tikka → PIZZA_TIKKA", () => {
    const r = matchIntent("tikka pizza");
    expect(r.intentId).toBe("PIZZA_TIKKA");
  });
  test("buffett (extra t) → BUFFET", () => {
    const r = matchIntent("buffett");
    expect(r.intentId).toBe("BUFFET");
  });
});

// ════════════════════════════════════════════════════════════
// 6. INTENT MATCHING — Mixed case and noisy input
// ════════════════════════════════════════════════════════════
describe("Intent Matching — Mixed Case and Punctuation", () => {
  test("PIZZA!!! → CAT_PIZZA", () => {
    expect(matchIntent("PIZZA!!!").intentId).toBe("CAT_PIZZA");
  });
  test("  Lunch   Deal  → LUNCH_DEAL", () => {
    expect(matchIntent("  Lunch   Deal  ").intentId).toBe("LUNCH_DEAL");
  });
  test("I want to ORDER something → ORDER", () => {
    expect(matchIntent("I want to ORDER something").intentId).toBe("ORDER");
  });
  test("BBQ..CHICKEN pizza → PIZZA_BBQ_CHICKEN", () => {
    expect(matchIntent("BBQ..CHICKEN pizza").intentId).toBe("PIZZA_BBQ_CHICKEN");
  });
});

// ════════════════════════════════════════════════════════════
// 7. OUT OF SCOPE — fallback, state unchanged
// ════════════════════════════════════════════════════════════
describe("Out-of-Scope Input", () => {
  test("gibberish returns null intent", () => {
    const r = matchIntent("xyzqwerty blorp fzzz");
    expect(r.intentId).toBeNull();
  });
  test("score below threshold returns null intent", () => {
    const r = matchIntent("aaaaaaaaaaa bbbbbbb");
    expect(r.intentId).toBeNull();
  });
  test("chatbot state does not change on fallback", () => {
    const sid = newSession();
    const initial = getSession(sid).state;
    processMessage(sid, "xyzqwerty blorp fzzz"); // should not advance state
    expect(getSession(sid).state).toBe(initial);
  });
});

// ════════════════════════════════════════════════════════════
// 8. PHONE VALIDATION
// ════════════════════════════════════════════════════════════
describe("Phone Validation", () => {
  test("valid: 03001234567", () => expect(validatePhone("03001234567")).toBe(true));
  test("valid: +923001234567", () => expect(validatePhone("+923001234567")).toBe(true));
  test("valid with spaces: 0300 123 4567", () => expect(validatePhone("0300 123 4567")).toBe(true));
  test("invalid: landline 0421234567", () => expect(validatePhone("0421234567")).toBe(false));
  test("invalid: too short 0300123", () => expect(validatePhone("0300123")).toBe(false));
  test("invalid: letters 0300ABCDEFG", () => expect(validatePhone("0300ABCDEFG")).toBe(false));
  test("invalid: empty string", () => expect(validatePhone("")).toBe(false));
  test("normalize phone: 03001234567 → +923001234567", () => {
    expect(normalizePhone("03001234567")).toBe("+923001234567");
  });
});

// ════════════════════════════════════════════════════════════
// 9. CONTACT & ORDER VALIDATION
// ════════════════════════════════════════════════════════════
describe("Contact and Order Validation", () => {
  test("valid contact passes", () => {
    const errors = validateContact({ name: "Ali Khan", phone: "03001234567", address: "House 5, Lahore" });
    expect(errors).toHaveLength(0);
  });
  test("invalid phone error", () => {
    const errors = validateContact({ name: "Ali", phone: "12345", address: "House 5" });
    expect(errors.some((e) => e.field === "phone")).toBe(true);
  });
  test("empty name error", () => {
    const errors = validateContact({ name: "", phone: "03001234567", address: "House 5" });
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });
  test("empty cart fails validateItems", () => {
    const errors = validateItems([]);
    expect(errors.some((e) => e.field === "items")).toBe(true);
  });
  test("valid order passes", () => {
    const errors = validateOrder({
      contact: { name: "Ali", phone: "03001234567", address: "House 5, DHA" },
      items: [{ itemId: "pizza-margherita", name: "Margherita", category: "pizza", size: "Medium", quantity: 1, unitPrice: 749, subtotal: 749 }],
      total: 749,
      channel: "shop",
    });
    expect(errors).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════
// 10. FULL END-TO-END CHATBOT FLOW
// IDLE → CATEGORY → ITEM → CUSTOMIZATION → CONTACT → CONFIRMATION
// ════════════════════════════════════════════════════════════
describe("End-to-End Chatbot Order Flow", () => {
  let sid: string;

  beforeEach(() => {
    sid = newSession();
  });

  afterEach(() => {
    resetSession(sid);
  });

  test("IDLE state greeting", () => {
    const r = processMessage(sid, "hello");
    expect(r.text).toMatch(/I can help you place an order/i);
    expect(getSession(sid).state).toBe("IDLE");
  });

  test("order → CATEGORY_SELECTION", () => {
    processMessage(sid, "I want to order");
    expect(getSession(sid).state).toBe("CATEGORY_SELECTION");
  });

  test("pizza → ITEM_SELECTION", () => {
    processMessage(sid, "order");
    processMessage(sid, "pizza");
    expect(getSession(sid).state).toBe("ITEM_SELECTION");
    expect(getSession(sid).currentCategory).toBe("pizza");
  });

  test("flavor → ITEM_CUSTOMIZATION (size prompt)", () => {
    processMessage(sid, "order");
    processMessage(sid, "pizza");
    processMessage(sid, "margherita");
    expect(getSession(sid).state).toBe("ITEM_CUSTOMIZATION");
  });

  test("size → back to CATEGORY_SELECTION with item in cart", () => {
    processMessage(sid, "order");
    processMessage(sid, "pizza");
    processMessage(sid, "margherita");
    processMessage(sid, "large");
    const session = getSession(sid);
    expect(session.state).toBe("CATEGORY_SELECTION");
    expect(session.cart.length).toBe(1);
    expect(session.cart[0].name).toBe("Margherita");
    expect(session.cart[0].size).toBe("Large");
  });

  test("full flow: order → pizza → margherita → medium → checkout → name → phone → address → confirm yes", () => {
    processMessage(sid, "order");
    processMessage(sid, "pizza");
    processMessage(sid, "margherita");
    processMessage(sid, "medium");
    // checkout
    processMessage(sid, "checkout");
    expect(getSession(sid).state).toBe("CONTACT_NAME");
    // name
    processMessage(sid, "Muhammad Ali");
    expect(getSession(sid).state).toBe("CONTACT_PHONE");
    expect(getSession(sid).contact.name).toBe("Muhammad Ali");
    // phone
    processMessage(sid, "03001234567");
    expect(getSession(sid).state).toBe("CONTACT_ADDRESS");
    expect(getSession(sid).contact.phone).toBe("+923001234567");
    // address
    processMessage(sid, "House 12, DHA Phase 2, Lahore");
    expect(getSession(sid).state).toBe("CONFIRMATION");
    // confirm
    const r = processMessage(sid, "yes");
    expect(getSession(sid).state).toBe("COMPLETED");
    expect(r.finalOrder).toBeDefined();
    expect(r.finalOrder?.cart[0].name).toBe("Margherita");
    expect(r.finalOrder?.channel).toBe("chat");
  });

  test("invalid phone — re-prompts, does NOT advance state", () => {
    processMessage(sid, "order");
    processMessage(sid, "pizza");
    processMessage(sid, "margherita");
    processMessage(sid, "medium");
    processMessage(sid, "checkout");
    processMessage(sid, "Test User");
    const r = processMessage(sid, "12345"); // invalid phone
    expect(getSession(sid).state).toBe("CONTACT_PHONE");
    expect(r.text).toMatch(/valid|number|phone/i);
  });

  test("confirm no → cancels order, resets to IDLE", () => {
    processMessage(sid, "order");
    processMessage(sid, "pizza");
    processMessage(sid, "pepperoni");
    processMessage(sid, "small");
    processMessage(sid, "checkout");
    processMessage(sid, "Ali");
    processMessage(sid, "03001234567");
    processMessage(sid, "Lahore DHA");
    processMessage(sid, "no");
    const session = getSession(sid);
    expect(session.state).toBe("IDLE");
    expect(session.cart).toHaveLength(0);
  });

  test("deals flow: order → deals → lunch deal → cart", () => {
    processMessage(sid, "order");
    processMessage(sid, "deals");
    processMessage(sid, "lunch");
    const session = getSession(sid);
    expect(session.cart.length).toBeGreaterThan(0);
    expect(session.cart[0].name.toLowerCase()).toContain("lunch");
  });

  test("typo flow: lanch → LUNCH_DEAL in IDLE", () => {
    const r = processMessage(sid, "lanch deel");
    expect(r.text.toLowerCase()).toMatch(/lunch/i);
  });
});

// ════════════════════════════════════════════════════════════
// 11. CONSTRAINED INTENT MATCHING (state-aware)
// ════════════════════════════════════════════════════════════
describe("Constrained Intent Matching", () => {
  test("pizza not matched when only fries/drinks allowed", () => {
    const r = matchConstrained("pizza", ["CAT_FRIES", "CAT_DRINKS"]);
    expect(r.intentId).toBeNull();
  });
  test("fries matched when allowed", () => {
    const r = matchConstrained("fries", ["CAT_FRIES", "CAT_DRINKS"]);
    expect(r.intentId).toBe("CAT_FRIES");
  });
  test("size small matched in size context", () => {
    const r = matchConstrained("small", ["SIZE_SMALL", "SIZE_MEDIUM", "SIZE_LARGE"]);
    expect(r.intentId).toBe("SIZE_SMALL");
  });
});
