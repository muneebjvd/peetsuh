// ============================================================
// peetsuh — Dialog State Machine
// Deterministic, zero-AI, rule-based chatbot engine
// ============================================================

import {
  matchIntent,
  matchConstrained,
  validatePhone,
  normalizePhone,
  normalize,
} from "./fuzzy-engine";
import { PIZZAS, FRIES, DRINKS, SAUCES, DEALS, ALL_ITEMS, findItemById } from "./menu-data";
import type { CartItem } from "./validation";
import { getDb, DbOrder } from "./db";

// ── State enum ────────────────────────────────────────────────
export type DialogState =
  | "IDLE"
  | "CATEGORY_SELECTION"
  | "ITEM_SELECTION"
  | "ITEM_CUSTOMIZATION"
  | "CONTACT_NAME"
  | "CONTACT_PHONE"
  | "CONTACT_ADDRESS"
  | "CONFIRMATION"
  | "COMPLETED"
  | "TABLE_BOOKING"
  | "TRACK_ORDER_INPUT";

// ── Session data ─────────────────────────────────────────────
export interface Session {
  id: string;
  state: DialogState;
  cart: CartItem[];
  contact: {
    name?: string;
    phone?: string;
    address?: string;
  };
  currentCategory?: string;
  currentItem?: string;
  currentSize?: string;
  pendingQuantity?: number;
  pendingItems?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Bot response ──────────────────────────────────────────────
export interface BotResponse {
  text: string;
  suggestions?: string[];
  orderRef?: string;
  finalOrder?: {
    contact: Session["contact"];
    cart: CartItem[];
    total: number;
    channel: "chat";
  };
}

// ── In-memory session store ───────────────────────────────────
const sessions = new Map<string, Session>();

export function getSession(sessionId: string): Session {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      state: "IDLE",
      cart: [],
      contact: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return sessions.get(sessionId)!;
}

export function resetSession(sessionId: string): void {
  sessions.delete(sessionId);
}

// ── Helpers ───────────────────────────────────────────────────
function formatCurrency(paise: number): string {
  return `Rs. ${paise.toLocaleString("en-PK")}`;
}

function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

function formatCart(cart: CartItem[]): string {
  if (cart.length === 0) return "Your cart is empty.";
  const lines = cart.map(
    (item, i) =>
      `${i + 1}. ${item.name}${item.size ? ` (${item.size})` : ""} x${item.quantity} — ${formatCurrency(item.subtotal)}`
  );
  lines.push(`\nTotal: ${formatCurrency(cartTotal(cart))}`);
  return lines.join("\n");
}

function pizzaSizeOptions(): string {
  return "Which size?\n- Small (Personal)\n- Medium\n- Large";
}

function drinkSizeOptions(): string {
  return "Which size?\n- 250ml (small bottle)\n- 1.5L (large bottle)";
}

function listPizzas(): string {
  return (
    "Our pizza flavors:\n" +
    PIZZAS.map((p, i) => `${i + 1}. ${p.name}`).join("\n") +
    "\n\nWhich flavor would you like?"
  );
}

function listFries(): string {
  return "Our fries:\n- Plain Fries — Rs. 249\n- Masala Fries — Rs. 299\n- Peri Peri Fries — Rs. 299\n\nWhich one?";
}

function listDrinks(): string {
  return "We have:\n- Coke (250ml — Rs. 99 / 1.5L — Rs. 249)\n- Sprite (250ml — Rs. 99 / 1.5L — Rs. 249)\n\nWhich drink?";
}

function listSauces(): string {
  return "Our dipping sauces:\n- Ketchup — Rs. 49\n- Chilli Garlic — Rs. 59\n- Garlic Mayo — Rs. 59\n\nWhich sauce?";
}

function listDeals(): string {
  return (
    "Our current deals:\n" +
    DEALS.map(
      (d) => `- ${d.name} — ${formatCurrency(d.price)}\n  ${d.includes.join(", ")}`
    ).join("\n\n") +
    "\n\nWhich deal interests you?"
  );
}

function findPizzaByIntent(intentId: string) {
  const map: Record<string, string> = {
    PIZZA_MARGHERITA: "pizza-margherita",
    PIZZA_BBQ_CHICKEN: "pizza-bbq-chicken",
    PIZZA_PERI_PERI: "pizza-peri-peri",
    PIZZA_PEPPERONI: "pizza-pepperoni",
    PIZZA_VEGGIE: "pizza-veggie-supreme",
    PIZZA_TIKKA: "pizza-tikka",
    PIZZA_MEXICANA: "pizza-mexicana",
    PIZZA_MEAT_FEAST: "pizza-meat-feast",
    PIZZA_MUSHROOM: "pizza-mushroom-truffle",
    PIZZA_FOUR_CHEESE: "pizza-four-cheese",
    PIZZA_RANCH_CHICKEN: "pizza-ranch-chicken",
    PIZZA_LAHORI: "pizza-lahori",
    PIZZA_GARLIC_PRAWN: "pizza-garlic-prawn",
    PIZZA_BUFFALO: "pizza-buffalo",
    PIZZA_HAWAIIAN: "pizza-hawaiian",
  };
  const id = map[intentId];
  return PIZZAS.find((p) => p.id === id);
}

// ── Queue Processor ───────────────────────────────────────────
function processNextItem(session: Session): BotResponse | null {
  if (!session.pendingItems || session.pendingItems.length === 0) return null;
  
  const nextId = session.pendingItems.shift()!;
  const item = findItemById(nextId);
               
  if (!item) return processNextItem(session); // skip invalid
  
  if (item.category === "pizza" || item.category === "drinks") {
    session.currentItem = item.id;
    session.state = "ITEM_CUSTOMIZATION";
    const sizeOpts = item.category === "pizza" ? pizzaSizeOptions() : drinkSizeOptions();
    return {
      text: `Now for the ${item.name}, ${sizeOpts}`,
      suggestions: item.category === "pizza" ? ["Small", "Medium", "Large"] : ["250ml", "1.5L"]
    };
  } else {
    // No customization needed, just add it to cart!
    const price = (item as any).price;
    session.cart.push({
      itemId: item.id,
      name: item.name,
      category: item.category,
      quantity: 1,
      unitPrice: price,
      subtotal: price
    });
    // recursively process next or return null if empty
    return processNextItem(session) || promptAfterAdd(session, item.name);
  }
}

// ── Main process message function ─────────────────────────────
export function processMessage(
  sessionId: string,
  rawInput: string
): BotResponse {
  const session = getSession(sessionId);
  session.updatedAt = new Date();
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  // Global cancel/reset interceptor
  const resetKeywords = [
    "change", "cancel", "new order", "dump that", "please cancel it", 
    "renew", "reset", "start over", "cancel order", "cancel it", 
    "dump", "change order", "change my order", "clear cart", "empty cart"
  ];
  const isReset = resetKeywords.includes(lower) || 
                  lower.startsWith("cancel ") || 
                  lower.startsWith("new order ") || 
                  lower.startsWith("dump that ") || 
                  lower.startsWith("renew ");
                  
  if (isReset) {
    session.state = "IDLE";
    session.cart = [];
    session.contact = {};
    session.pendingItems = [];
    session.currentItem = undefined;
    session.currentCategory = undefined;
    return {
      text: "Alright, I've cleared your cart and reset everything. What would you like to do now?",
      suggestions: ["Place an order", "See deals", "Show menu"]
    };
  }

  // Global intent interceptors (Tracking & Appreciation)
  const globalMatch = matchIntent(input);
  if (globalMatch.intentId === "TRACK_ORDER") {
    session.state = "TRACK_ORDER_INPUT";
    return {
      text: "I can help you track your order! Please enter your 7-character Order Number (e.g., A1B2C3D):",
    };
  }
  if (globalMatch.intentId === "APPRECIATION") {
    return {
      text: "You're very welcome! We're always happy to help. Let us know if you need anything else! 😊",
      suggestions: ["Order now", "Track order", "See deals"],
    };
  }

  // Global language / banter interceptor
  if (lower.includes("urdu")) {
    return { text: "Sorry, I only understand English at the moment! 😅 How can I help you today?", suggestions: ["Show menu", "Place an order"] };
  }
  const isBanter = ["pagl", "pagal", "stupid", "idiot", "dumb", "crazy"].some(w => lower.includes(w));
  if (isBanter) {
    return { text: "I'm just a simple pizza bot! 🍕 I only know how to take orders. What would you like to eat?", suggestions: ["Show menu"] };
  }

  // Global "go back" interceptor
  const goBackKeywords = ["go back", "back", "previous", "go back one step"];
  if (goBackKeywords.includes(lower)) {
    switch (session.state) {
      case "CATEGORY_SELECTION":
      case "TABLE_BOOKING":
      case "COMPLETED":
        session.state = "IDLE";
        return { text: "Going back. How can I help you today?", suggestions: ["Place an order", "See deals", "Show menu"] };
        
      case "ITEM_SELECTION":
        session.state = "CATEGORY_SELECTION";
        session.currentCategory = undefined;
        return { text: "Going back. What would you like to order?", suggestions: ["Pizza", "Deals", "Fries", "Drinks", "Sauce"] };
        
      case "ITEM_CUSTOMIZATION":
        session.state = "ITEM_SELECTION";
        session.currentItem = undefined;
        if (session.currentCategory === "pizza") return { text: "Going back. " + listPizzas(), suggestions: ["Margherita", "BBQ Chicken", "Peri Peri"] };
        if (session.currentCategory === "drinks") return { text: "Going back. Coke or Sprite?", suggestions: ["Coke", "Sprite"] };
        session.state = "CATEGORY_SELECTION";
        return { text: "Going back. What would you like to order?", suggestions: ["Pizza", "Deals", "Fries", "Drinks", "Sauce"] };
        
      case "CONTACT_NAME":
        session.state = "CATEGORY_SELECTION";
        return { text: "Going back. Would you like to add anything else before checking out?", suggestions: ["Pizza", "Fries", "Checkout"] };
        
      case "CONTACT_PHONE":
        session.state = "CONTACT_NAME";
        return { text: "Going back. Let's restart your details. What's your name?" };
        
      case "CONTACT_ADDRESS":
        session.state = "CONTACT_PHONE";
        return { text: `Going back. What's your phone number, ${session.contact.name || "friend"}?` };
        
      case "CONFIRMATION":
        session.state = "CONTACT_ADDRESS";
        return { text: "Going back. What's your delivery address?" };
        
      default:
        return { text: "You're already at the beginning! How can I help?", suggestions: ["Place an order", "See deals"] };
    }
  }

  // Intercept global checkout keyword from any ordering state
  if (
    (lower === "checkout" || lower === "proceed to checkout" || lower === "proceed") &&
    (session.state === "CATEGORY_SELECTION" || session.state === "ITEM_SELECTION" || session.state === "ITEM_CUSTOMIZATION")
  ) {
    return triggerCheckout(session);
  }


  switch (session.state) {
    case "IDLE":
      return handleIdle(session, input);
    case "CATEGORY_SELECTION":
      return handleCategorySelection(session, input);
    case "ITEM_SELECTION":
      return handleItemSelection(session, input);
    case "ITEM_CUSTOMIZATION":
      return handleItemCustomization(session, input);
    case "CONTACT_NAME":
      return handleContactName(session, input);
    case "CONTACT_PHONE":
      return handleContactPhone(session, input);
    case "CONTACT_ADDRESS":
      return handleContactAddress(session, input);
    case "CONFIRMATION":
      return handleConfirmation(session, input);
    case "COMPLETED":
      return handleCompleted(session, input);
    case "TABLE_BOOKING":
      return handleTableBooking(session, input);
    case "TRACK_ORDER_INPUT":
      return handleTrackOrderInput(session, input);
    default:
      session.state = "IDLE";
      return { text: "Something went wrong. Let me restart. How can I help you?", suggestions: ["Order pizza", "See deals", "Book a table"] };
  }
}

// ── State handlers ────────────────────────────────────────────

const GREETINGS = [
  "Welcome to peetsuh! What can I get you?",
  "Hello there! Ready for some pizza?",
  "Hi! Hungry? Let's get an order started.",
  "Salam! Welcome to peetsuh. How can I help?",
  "Greetings! You've reached Lahore's best pizza. What'll it be?",
  "Hey! Craving a slice? Let's go.",
  "Welcome back! What's on the menu for you today?",
  "Hello! Let's get you fed.",
  "Hi there! What are you in the mood for?",
  "Salam! I'm here to help you order the perfect pizza.",
  "Hey there! Ready to order?",
  "Welcome to peetsuh. What's your craving?",
  "Hi! I'm your peetsuh bot. What can I do for you?",
  "Hello! Let's find something delicious for you.",
  "Salam! Welcome. Need to see the menu or ready to order?",
  "Greetings from peetsuh! What would you like to eat?",
  "Hey! Looking for pizza, fries, or a deal?",
  "Hi! Let's make today a pizza day.",
  "Hello! Ready to dive into our menu?",
  "Salam! How can I satisfy your hunger today?",
  "Welcome! Can I interest you in a deal today?",
  "Hi there! What sounds good right now?",
  "Hello! We've got fresh pizza waiting for you.",
  "Salam! Let's place your order.",
  "Hey! What's your favorite pizza? Let's order it.",
  "Greetings! Welcome to peetsuh's fast ordering.",
  "Hi! Got an appetite? You're in the right place.",
  "Hello! Let me help you pick out something great.",
  "Salam! Ready for the best pizza in town?",
  "Welcome to peetsuh! I'm at your service.",
  "Hey! What can I get cooking for you?",
  "Hi there! I can help you order, see deals, or view the menu.",
  "Hello! Craving some melted cheese?",
  "Salam! Let's get started on your order.",
  "Greetings! What flavor are we going with today?",
  "Hi! I'm ready to take your order whenever you are.",
  "Hello! Would you like a pizza or maybe a meal deal?",
  "Salam! Welcome to peetsuh. What are you ordering?",
  "Hey! Let's get some food delivered to you.",
  "Welcome! Your next great meal starts here.",
  "Hi! I'm peetsuh bot. Tell me what you'd like.",
  "Hello! Need recommendations or know what you want?",
  "Salam! It's always a good time for pizza.",
  "Greetings! Let's build your perfect cart.",
  "Hey there! Ready to explore our delicious menu?",
  "Hi! What are we eating today?",
  "Hello! Welcome to peetsuh. How can I serve you?",
  "Salam! Let's get you something tasty.",
  "Welcome to peetsuh! I'm here to take your order.",
  "Hi! Ready to grab a bite?"
];

function handleIdle(session: Session, input: string): BotResponse {
  const match = matchIntent(input);

  if (!match.intentId) {
    const lower = input.toLowerCase();
    const stopwords = ["pizza", "pizzas", "any", "some", "want", "like", "tell", "me", "about", "have", "you", "do", "the", "a", "an", "is", "there", "with", "for", "please", "flavor", "flavour", "taste", "good", "best"];
    const rawTerms = lower.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    const searchTerms = rawTerms.filter(w => !stopwords.includes(w));
    
    const wantsNonSpicy = lower.includes("non spicy") || lower.includes("not spicy") || lower.includes("mild") || lower.includes("without spice") || lower.includes("less spicy");
    const hasSearchTerm = searchTerms.some(t => t !== "spicy" && t !== "non" && t !== "not" && t !== "mild");

    if (wantsNonSpicy || hasSearchTerm) {
      const matches = PIZZAS.filter(p => {
        const searchSpace = `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase();
        const isSpicy = searchSpace.includes("spicy") || searchSpace.includes("hot") || searchSpace.includes("fiery") || searchSpace.includes("peri") || searchSpace.includes("jalapeno") || searchSpace.includes("chili");
        
        if (wantsNonSpicy && isSpicy) return false;
        
        if (hasSearchTerm) {
          const matchedTerm = searchTerms.some(term => {
            if (["spicy", "non", "not", "mild"].includes(term)) return false;
            if (term === "mayo") return searchSpace.includes("creamy") || searchSpace.includes("ranch");
            if (term === "saucy") return searchSpace.includes("sauce") || searchSpace.includes("base");
            if (term === "olive") return searchSpace.includes("olive");
            if (term === "capsicum") return searchSpace.includes("pepper");
            return searchSpace.includes(term);
          });
          if (!matchedTerm) return false;
        }
        return true;
      });

      if (matches.length > 0) {
        const topMatches = matches.slice(0, 3);
        const names = topMatches.map(p => p.name);
        return {
          text: `Based on your taste, check these out:\n\n${topMatches.map(p => `🍕 **${p.name}**\n${p.description}`).join("\n\n")}\n\nWhich one would you like?`,
          suggestions: names
        };
      }
    }
    
    return fallback();
  }

  switch (match.intentId) {
    case "GREETING":
      const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      return {
        text: randomGreeting + "\n\nI can help you place an order, tell you about our deals, or book a table.",
        suggestions: ["Place an order", "See deals", "Book a table", "Show menu"],
      };

    case "FAQ_WHO_ARE_YOU":
      return {
        text: "I am the peetsuh rule-based ordering bot! I'm hand-built without any fancy AI, designed just to help you quickly order the best pizza in Lahore.",
        suggestions: ["Place an order", "See deals"],
      };

    case "FAQ_BEST_SELLER":
      return {
        text: "Our absolute best sellers are the BBQ Chicken Pizza and the Peri Peri Fries. You really can't go wrong with either!",
        suggestions: ["Order pizza", "Order fries", "Show menu"],
      };

    case "FAQ_RECOMMEND":
      return {
        text: "I highly recommend our Lunch Deal if you're eating solo, or the Margherita if you love a classic! The Mushroom Truffle is also amazing if you want something premium.",
        suggestions: ["Lunch Deal", "Show menu", "See deals"],
      };

    case "FAQ_CHEAPEST":
      return {
        text: "The cheapest items on our menu are the dipping sauces (Rs. 49) and our Coke/Sprite 250ml (Rs. 99). For food, our Plain Fries are only Rs. 249, and Small pizzas start at Rs. 549!",
        suggestions: ["Order fries", "Show menu", "See deals"],
      };

    case "FAQ_DELIVERY":
      return {
        text: "We offer **Free Home Delivery** within a 10km radius! 🛵\n\nMost orders arrive within 30-40 minutes piping hot. We'll ask for your delivery details at checkout.\n\nReady to place an order?",
        suggestions: ["Place an order", "See menu"],
      };

    case "FAQ_LOCATION":
      return {
        text: "We have multiple branches across the city, but our flagship branch is located at **Main Boulevard, Gulberg**.\n\nYou can book a table for dine-in or just order delivery right here in the chat!",
        suggestions: ["Book a table", "Order delivery"],
      };

    case "FAQ_TIMINGS":
      return {
        text: "We are open 7 days a week from **11:00 AM to 3:00 AM**. Late-night cravings? We've got you covered! 🌙🍕",
        suggestions: ["Order now", "See deals"],
      };

    case "MENU":
    case "PRICE":
      return {
        text: "Here's what we have:\n\nDeals: Lunch Deal (Rs. 799), Buffet (Rs. 1,499), Hi-Tea (Rs. 1,199)\nPizza: 15 flavors — Small from Rs. 549\nFries: Plain / Masala / Peri Peri — Rs. 249–299\nDrinks: Coke, Sprite — Rs. 99 / Rs. 249\nSauces: Ketchup, Chilli Garlic, Garlic Mayo — Rs. 49–59\n\nWant to place an order?",
        suggestions: ["Order now", "See deals", "Book a table"],
      };

    case "LUNCH_DEAL":
      session.currentCategory = "deals";
      return handleItemSelection(session, input);

    case "BUFFET":
      session.state = "TABLE_BOOKING";
      return {
        text: `Buffet (Rs. 1,499/person) requires a table booking.\n\nPlease provide your name, contact number, and party size in one message to book. (e.g. "Ali Khan, 0300-1234567, 4 persons")`,
        suggestions: ["Cancel booking"],
      };

    case "HI_TEA":
      session.state = "TABLE_BOOKING";
      return {
        text: `Hi-Tea Deal (Rs. 1,199) requires a table booking.\n\nPlease provide your name, contact number, and party size in one message to book. (e.g. "Ali Khan, 0300-1234567, 2 persons")`,
        suggestions: ["Cancel booking"],
      };

    case "ORDER":
      session.state = "CATEGORY_SELECTION";
      return {
        text: "What would you like to order? We have:\n- Pizza\n- Deals\n- Fries\n- Drinks\n- Sauce",
        suggestions: ["Pizza", "Deals", "Fries", "Drinks", "Sauce"],
      };

    case "BOOK_TABLE":
      session.state = "TABLE_BOOKING";
      return {
        text: "I'd love to help you book a table. Please provide your name, preferred date and time, and party size.\n\nType it all in one message (e.g. \"Ali Khan, tomorrow 7pm, 4 people\") or call us at 0300-1234567.",
        suggestions: ["Call instead", "Cancel"],
      };

    case "TRACK_ORDER":
      session.state = "TRACK_ORDER_INPUT";
      return {
        text: "I can help you track your order! Please enter your 7-character Order Number (e.g., A1B2C3D):",
      };

    case "APPRECIATION":
      return {
        text: "You're very welcome! We're always happy to help. Let us know if you need anything else! 😊",
        suggestions: ["Order now", "Track order", "See deals"],
      };

    default:
      if (match.intentId.startsWith("CAT_")) {
        return handleCategorySelection(session, input);
      }
      if (match.intentId.startsWith("PIZZA_")) {
        session.currentCategory = "pizza";
        return handleItemSelection(session, input);
      }
      if (match.intentId.startsWith("FRIES_")) {
        session.currentCategory = "fries";
        return handleItemSelection(session, input);
      }
      if (match.intentId.startsWith("DRINK_")) {
        session.currentCategory = "drinks";
        return handleItemSelection(session, input);
      }
      if (match.intentId.startsWith("SAUCE_")) {
        session.currentCategory = "sauces";
        return handleItemSelection(session, input);
      }
      
      return fallback();
  }
}

function handleCategorySelection(session: Session, input: string): BotResponse {
  const allowedIntents = [
    "CAT_PIZZA", "CAT_FRIES", "CAT_DRINKS", "CAT_DEALS", "CAT_SAUCE",
    "LUNCH_DEAL", "BUFFET", "HI_TEA",
    "CONFIRM_NO",
  ];
  const match = matchConstrained(input, allowedIntents);

  if (!match.intentId) {
    return {
      text: "I didn't catch that. What would you like to order?\n- Pizza\n- Deals\n- Fries\n- Drinks\n- Sauce",
      suggestions: ["Pizza", "Deals", "Fries", "Drinks", "Sauce"],
    };
  }

  switch (match.intentId) {
    case "CAT_PIZZA":
      session.state = "ITEM_SELECTION";
      session.currentCategory = "pizza";
      return { text: listPizzas(), suggestions: PIZZAS.slice(0, 6).map((p) => p.name) };

    case "CAT_FRIES":
      session.state = "ITEM_SELECTION";
      session.currentCategory = "fries";
      return { text: listFries(), suggestions: ["Plain Fries", "Masala Fries", "Peri Peri Fries"] };

    case "CAT_DRINKS":
      session.state = "ITEM_SELECTION";
      session.currentCategory = "drinks";
      return { text: listDrinks(), suggestions: ["Coke", "Sprite"] };

    case "CAT_DEALS":
    case "LUNCH_DEAL":
      session.state = "ITEM_SELECTION";
      session.currentCategory = "deals";
      return { text: listDeals(), suggestions: ["Lunch Deal", "Buffet", "Hi-Tea Deal"] };

    case "BUFFET":
    case "HI_TEA":
      session.state = "TABLE_BOOKING";
      return {
        text: `That deal requires a table booking.\n\nPlease provide your name, contact number, and party size to book. (e.g. "Ali Khan, 0300-1234567, 4 persons")`,
        suggestions: ["Cancel booking"],
      };

    case "CAT_SAUCE":
      session.state = "ITEM_SELECTION";
      session.currentCategory = "sauces";
      return { text: listSauces(), suggestions: ["Ketchup", "Chilli Garlic", "Garlic Mayo"] };

    case "CONFIRM_NO":
      session.state = "IDLE";
      return {
        text: "No problem. What else can I help you with?",
        suggestions: ["Place an order", "See deals", "Book a table"],
      };

    default:
      return fallback();
  }
}

function handleItemSelection(session: Session, input: string): BotResponse {
  const cat = session.currentCategory;

  if (cat === "pizza") {
    const numbers = input.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
    const validNumbers = numbers.filter(n => n >= 1 && n <= PIZZAS.length);
    
    let pizza = undefined;
    if (validNumbers.length > 0) {
      pizza = PIZZAS[validNumbers[0] - 1];
      if (validNumbers.length > 1) {
        session.pendingItems = validNumbers.slice(1).map(n => PIZZAS[n - 1].id);
      }
    } else {
      const pizzaIntents = [
        "PIZZA_MARGHERITA", "PIZZA_BBQ_CHICKEN", "PIZZA_PERI_PERI",
        "PIZZA_PEPPERONI", "PIZZA_VEGGIE", "PIZZA_TIKKA", "PIZZA_MEXICANA",
        "PIZZA_MEAT_FEAST", "PIZZA_MUSHROOM", "PIZZA_FOUR_CHEESE",
        "PIZZA_RANCH_CHICKEN", "PIZZA_LAHORI", "PIZZA_GARLIC_PRAWN",
        "PIZZA_BUFFALO", "PIZZA_HAWAIIAN",
      ];
      const match = matchConstrained(input, pizzaIntents);
      if (match.intentId) pizza = findPizzaByIntent(match.intentId);
    }

    if (!pizza) {
      return { text: "I didn't recognize that flavor. " + listPizzas(), suggestions: PIZZAS.slice(0, 6).map((p) => p.name) };
    }
    
    session.currentItem = pizza.id;
    session.state = "ITEM_CUSTOMIZATION";

    const introText = validNumbers.length > 1 
      ? `Got it! You selected ${validNumbers.map(n => PIZZAS[n-1].name).join(", ")}.\nLet's start with ${pizza.name}.\n${pizzaSizeOptions()}`
      : `${pizza.name} — great choice!\n${pizzaSizeOptions()}`;

    return {
      text: `${introText}\n\nPrices: Small ${formatCurrency(pizza.sizes.Small)} | Medium ${formatCurrency(pizza.sizes.Medium)} | Large ${formatCurrency(pizza.sizes.Large)}`,
      suggestions: ["Small", "Medium", "Large"],
    };
  }

  if (cat === "fries") {
    const numbers = input.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
    const validNumbers = numbers.filter(n => n >= 1 && n <= FRIES.length);
    let selectedFries = [];

    if (validNumbers.length > 0) {
      selectedFries = validNumbers.map(n => FRIES[n - 1]);
    } else {
      const match = matchConstrained(input, ["FRIES_PLAIN", "FRIES_MASALA", "FRIES_PERIPERI"]);
      const friesMap: Record<string, string> = {
        FRIES_PLAIN: "fries-plain",
        FRIES_MASALA: "fries-masala",
        FRIES_PERIPERI: "fries-periperi",
      };
      if (match.intentId) {
        const fries = FRIES.find((f) => f.id === friesMap[match.intentId!]);
        if (fries) selectedFries.push(fries);
      }
    }

    if (selectedFries.length === 0) {
      return { text: "Which fries would you like?\n- Plain Fries\n- Masala Fries\n- Peri Peri Fries", suggestions: ["Plain Fries", "Masala Fries", "Peri Peri Fries"] };
    }
    
    selectedFries.forEach((fries) => {
      session.cart.push({
        itemId: fries.id,
        name: fries.name,
        category: "fries",
        quantity: 1,
        unitPrice: fries.price,
        subtotal: fries.price,
      });
    });

    return processNextItem(session) || promptAfterAdd(session, selectedFries.map(f => f.name).join(", "));
  }

  if (cat === "drinks") {
    const numbers = input.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
    const validNumbers = numbers.filter(n => n >= 1 && n <= DRINKS.length);

    let drink = undefined;
    if (validNumbers.length > 0) {
      drink = DRINKS[validNumbers[0] - 1];
      if (validNumbers.length > 1) {
        session.pendingItems = (session.pendingItems || []).concat(validNumbers.slice(1).map(n => DRINKS[n - 1].id));
      }
    } else {
      const match = matchConstrained(input, ["DRINK_COKE", "DRINK_SPRITE"]);
      const drinkMap: Record<string, string> = { DRINK_COKE: "drink-coke", DRINK_SPRITE: "drink-sprite" };
      if (match.intentId) {
        drink = DRINKS.find((d) => d.id === drinkMap[match.intentId!]);
      }
    }
    
    if (!drink) {
      return { text: "Coke or Sprite?", suggestions: ["Coke", "Sprite"] };
    }

    session.currentItem = drink.id;
    session.state = "ITEM_CUSTOMIZATION";

    const introText = validNumbers.length > 1 
      ? `You selected ${validNumbers.map(n => DRINKS[n-1].name).join(", ")}.\nLet's start with ${drink.name}.\n${drinkSizeOptions()}`
      : `${drink.name} — got it!\n${drinkSizeOptions()}`;

    return {
      text: `${introText}\n\n250ml — ${formatCurrency(drink.sizes["250ml"])} | 1.5L — ${formatCurrency(drink.sizes["1.5L"])}`,
      suggestions: ["250ml", "1.5L"],
    };
  }

  if (cat === "deals") {
    const match = matchConstrained(input, ["LUNCH_DEAL", "BUFFET", "HI_TEA", "CAT_DEALS"]);
    
    if (match.intentId === "BUFFET" || match.intentId === "HI_TEA") {
      session.state = "TABLE_BOOKING";
      return {
        text: `That deal is for dine-in only.\n\nPlease provide your name, contact number, and party size to book a table.`,
        suggestions: ["Cancel booking"],
      };
    }

    const dealMap: Record<string, string> = {
      LUNCH_DEAL: "deal-lunch",
    };
    if (!match.intentId || !dealMap[match.intentId]) {
      return { text: listDeals(), suggestions: ["Lunch Deal", "Buffet", "Hi-Tea Deal"] };
    }
    const deal = DEALS.find((d) => d.id === dealMap[match.intentId!]);
    if (!deal) return fallback();
    session.cart.push({
      itemId: deal.id,
      name: deal.name,
      category: "deals",
      quantity: 1,
      unitPrice: deal.price,
      subtotal: deal.price,
    });
    return promptAfterAdd(session, deal.name);
  }

  if (cat === "sauces") {
    const numbers = input.match(/\d+/g)?.map(n => parseInt(n, 10)) || [];
    const validNumbers = numbers.filter(n => n >= 1 && n <= SAUCES.length);
    let selectedSauces = [];

    if (validNumbers.length > 0) {
      selectedSauces = validNumbers.map(n => SAUCES[n - 1]);
    } else {
      const match = matchConstrained(input, ["SAUCE_KETCHUP", "SAUCE_CHILLI_GARLIC", "SAUCE_GARLIC_MAYO"]);
      const sauceMap: Record<string, string> = {
        SAUCE_KETCHUP: "sauce-ketchup",
        SAUCE_CHILLI_GARLIC: "sauce-chilli-garlic",
        SAUCE_GARLIC_MAYO: "sauce-garlic-mayo",
      };
      if (match.intentId) {
        const sauce = SAUCES.find((s) => s.id === sauceMap[match.intentId!]);
        if (sauce) selectedSauces.push(sauce);
      }
    }

    if (selectedSauces.length === 0) {
      return { text: listSauces(), suggestions: ["Ketchup", "Chilli Garlic", "Garlic Mayo"] };
    }

    selectedSauces.forEach((sauce) => {
      session.cart.push({
        itemId: sauce.id,
        name: sauce.name,
        category: "sauces",
        quantity: 1,
        unitPrice: sauce.price,
        subtotal: sauce.price,
      });
    });
    
    return processNextItem(session) || promptAfterAdd(session, selectedSauces.map(s => s.name).join(", "));
  }

  return fallback();
}

function handleItemCustomization(session: Session, input: string): BotResponse {
  const cat = session.currentCategory;
  const itemId = session.currentItem;

  if (cat === "pizza") {
    const match = matchConstrained(input, ["SIZE_SMALL", "SIZE_MEDIUM", "SIZE_LARGE"]);
    const sizeMap: Record<string, "Small" | "Medium" | "Large"> = {
      SIZE_SMALL: "Small",
      SIZE_MEDIUM: "Medium",
      SIZE_LARGE: "Large",
    };
    if (!match.intentId) {
      return { text: "Please choose a size: Small, Medium, or Large.", suggestions: ["Small", "Medium", "Large"] };
    }
    const size = sizeMap[match.intentId];
    const pizza = PIZZAS.find((p) => p.id === itemId);
    if (!pizza) return fallback();
    const price = pizza.sizes[size];
    session.cart.push({
      itemId: pizza.id,
      name: pizza.name,
      category: "pizza",
      size,
      quantity: 1,
      unitPrice: price,
      subtotal: price,
    });
    session.currentItem = undefined;
    session.currentSize = undefined;
    
    const nextResponse = processNextItem(session);
    if (nextResponse) return nextResponse;
    
    return promptAfterAdd(session, `${pizza.name} (${size})`);
  }

  if (cat === "drinks") {
    const match = matchConstrained(input, ["SIZE_250ML", "SIZE_1_5L"]);
    const sizeMap: Record<string, "250ml" | "1.5L"> = {
      SIZE_250ML: "250ml",
      SIZE_1_5L: "1.5L",
    };
    if (!match.intentId) {
      return { text: "250ml or 1.5L?", suggestions: ["250ml", "1.5L"] };
    }
    const size = sizeMap[match.intentId];
    const drink = DRINKS.find((d) => d.id === itemId);
    if (!drink) return fallback();
    const price = drink.sizes[size];
    session.cart.push({
      itemId: drink.id,
      name: drink.name,
      category: "drinks",
      size,
      quantity: 1,
      unitPrice: price,
      subtotal: price,
    });
    session.currentItem = undefined;
    
    const nextResponse = processNextItem(session);
    if (nextResponse) return nextResponse;
    
    return promptAfterAdd(session, `${drink.name} (${size})`);
  }

  return fallback();
}

function promptAfterAdd(session: Session, itemName: string): BotResponse {
  session.state = "CATEGORY_SELECTION";
  return {
    text: `${itemName} added to your order!\n\nCurrent cart:\n${formatCart(session.cart)}\n\nWould you like to add anything else, or proceed to checkout?`,
    suggestions: ["Add more", "Pizza", "Fries", "Drinks", "Checkout"],
  };
}

function handleContactName(session: Session, input: string): BotResponse {
  const name = input.trim();
  if (name.length < 2) {
    return { text: "Please enter your full name (at least 2 characters)." };
  }
  session.contact.name = name;
  session.state = "CONTACT_PHONE";
  return {
    text: `Got it, ${name}! What's your phone number?\n(Pakistani number, e.g. 03001234567)`,
  };
}

function handleContactPhone(session: Session, input: string): BotResponse {
  const raw = input.trim();
  if (!validatePhone(raw)) {
    return {
      text: "That doesn't look like a valid Pakistani mobile number. Please try again — e.g. 03001234567 or +923001234567.",
    };
  }
  session.contact.phone = normalizePhone(raw);
  session.state = "CONTACT_ADDRESS";
  return { text: "And your delivery address?" };
}

function handleContactAddress(session: Session, input: string): BotResponse {
  const address = input.trim();
  if (address.length < 5) {
    return { text: "Please enter a valid delivery address (at least 5 characters)." };
  }
  session.contact.address = address;
  session.state = "CONFIRMATION";

  const summary = [
    "Here's your order summary:",
    "",
    formatCart(session.cart),
    "",
    `Name: ${session.contact.name}`,
    `Phone: ${session.contact.phone}`,
    `Address: ${session.contact.address}`,
    "",
    "Shall I confirm this order? (yes / no)",
  ].join("\n");

  return { text: summary, suggestions: ["Yes, confirm", "No, cancel"] };
}

function handleConfirmation(session: Session, input: string): BotResponse {
  const match = matchConstrained(input, ["CONFIRM_YES", "CONFIRM_NO"]);

  if (!match.intentId) {
    return { text: "Please reply with yes to confirm, or no to cancel.", suggestions: ["Yes, confirm", "No, cancel"] };
  }

  if (match.intentId === "CONFIRM_YES") {
    const finalOrder = {
      contact: session.contact,
      cart: session.cart,
      total: cartTotal(session.cart),
      channel: "chat" as const,
    };
    session.state = "COMPLETED";
    return {
      text: "Your order has been placed! We'll start preparing it right away. You'll receive a confirmation shortly.",
      finalOrder,
    };
  }

  // CONFIRM_NO
  session.state = "IDLE";
  session.cart = [];
  session.contact = {};
  return {
    text: "Order cancelled. No worries — feel free to start a new order whenever you're ready.",
    suggestions: ["Start over", "Place an order"],
  };
}

function handleCompleted(session: Session, input: string): BotResponse {
  const match = matchIntent(input);
  if (match.intentId === "ORDER" || match.intentId === "GREETING") {
    session.state = "IDLE";
    session.cart = [];
    session.contact = {};
    return handleIdle(session, input);
  }
  return {
    text: "Your order has been placed. Is there anything else I can help with?",
    suggestions: ["New order", "See deals"],
  };
}

function handleTableBooking(session: Session, input: string): BotResponse {
  const lower = input.toLowerCase();
  if (lower.includes("cancel") || lower.includes("back")) {
    session.state = "IDLE";
    return { text: "No problem. How else can I help?", suggestions: ["Place an order", "See deals"] };
  }
  
  const hasName = /[a-zA-Z].*[a-zA-Z].*[a-zA-Z]/.test(input);
  
  const cleanedDigits = input.replace(/[^\d+]/g, "");
  const phoneMatch = cleanedDigits.match(/(?:03|\+923)\d{9}/);
  const hasPhone = !!phoneMatch;
  
  const hasDigit = phoneMatch 
    ? cleanedDigits.replace(phoneMatch[0], "").length > 0
    : /\d/.test(input);
  
  const missing = [];
  if (!hasName) missing.push("a name");
  if (!hasPhone) missing.push("a valid Pakistani mobile number");
  if (!hasDigit) missing.push("the number of persons");
  
  if (missing.length > 0) {
    return {
      text: `It looks like you're missing ${missing.join(" and ")}.\n\nPlease provide all details in one message (Name, Phone, Party Size).`,
      suggestions: ["Cancel booking"]
    };
  }

  const nameMatch = input.match(/[a-zA-Z\s]+/);
  const nameStr = nameMatch ? nameMatch[0].trim() : "Guest";
  const phoneStr = phoneMatch![0];
  const partySizeStr = cleanedDigits.replace(phoneStr, "");

  const finalOrder = {
    contact: {
      name: nameStr || "Guest",
      phone: phoneStr,
      address: `TABLE BOOKING - ${partySizeStr} person(s)`,
    },
    cart: [{
      itemId: "table-booking",
      name: "Table Booking",
      category: "deals" as const,
      size: undefined,
      quantity: 1,
      unitPrice: 0,
      subtotal: 0
    }],
    total: 0,
    channel: "chat" as const,
  };

  session.state = "IDLE";
  return {
    text: `Thank you, ${nameStr || "Guest"}! We've noted your booking request for ${partySizeStr} person(s). You will receive a confirmation shortly, or you can call us at 0300-1234567 for immediate assistance.`,
    suggestions: ["Place an order", "See deals"],
    finalOrder,
  };
}

function handleTrackOrderInput(session: Session, input: string): BotResponse {
  const query = input.trim().toUpperCase();
  if (query.length < 7) {
    return {
      text: "That doesn't look like a valid order number. Please enter the full order number or the last 7 digits.",
      suggestions: ["Cancel"]
    };
  }

  let order: DbOrder | undefined;
  try {
    const db = getDb();
    if (query.length === 7) {
      order = db.prepare(`SELECT * FROM orders WHERE order_ref LIKE ?`).get(`%${query}`) as DbOrder | undefined;
    } else {
      order = db.prepare(`SELECT * FROM orders WHERE order_ref = ?`).get(query) as DbOrder | undefined;
    }
  } catch (err) {
    console.error("Order tracking error in bot:", err);
  }

  session.state = "IDLE";
  if (!order) {
    return {
      text: "I couldn't find any order with that tracking number. Let me know if you need help with anything else!",
      suggestions: ["Track again", "Place an order"]
    };
  }

  let statusMsg = "";
  switch (order.status) {
    case "new": statusMsg = "Received 📝"; break;
    case "preparing": statusMsg = "Preparing 🧑‍🍳"; break;
    case "out_for_delivery": statusMsg = "Out for Delivery 🛵"; break;
    case "done": statusMsg = "Completed / Delivered ✅"; break;
    case "cancelled": statusMsg = "Cancelled ❌"; break;
    default: statusMsg = order.status;
  }

  return {
    text: `Here is the status for your order **${order.order_ref}**:\n\n**${statusMsg}**\n\nIs there anything else I can help you with?`,
    suggestions: ["Place an order", "Show menu"]
  };
}

function fallback(): BotResponse {
  return {
    text: "I didn't quite catch that. You can ask me about our menu, deals, place an order, or book a table.",
    suggestions: ["Place an order", "See deals", "Show menu", "Book a table"],
  };
}

// ── Checkout trigger from chatbot state ───────────────────────
export function triggerCheckout(session: Session): BotResponse {
  if (session.cart.length === 0) {
    return {
      text: "Your cart is empty. Add some items first!",
      suggestions: ["Pizza", "Deals", "Fries"],
    };
  }
  session.state = "CONTACT_NAME";
  return { text: "Let's get your details for delivery. What's your name?" };
}

// ── Handle "checkout" keyword anywhere ────────────────────────
export function handleCheckoutIntent(sessionId: string): BotResponse {
  const session = getSession(sessionId);
  return triggerCheckout(session);
}
