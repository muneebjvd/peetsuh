// ============================================================
// peetsuh — Single Source of Truth for Menu Data
// ============================================================

export type Size = "Small" | "Medium" | "Large";
export type DrinkSize = "250ml" | "1.5L";

export interface PizzaItem {
  id: string;
  name: string;
  description: string;
  category: "pizza";
  sizes: {
    Small: number;
    Medium: number;
    Large: number;
  };
  image: string;
  tags: string[];
}

export interface FriesItem {
  id: string;
  name: string;
  description: string;
  category: "fries";
  price: number;
  image: string;
  tags: string[];
}

export interface DrinkItem {
  id: string;
  name: string;
  description: string;
  category: "drinks";
  sizes: {
    "250ml": number;
    "1.5L": number;
  };
  image: string;
  tags: string[];
}

export interface SauceItem {
  id: string;
  name: string;
  description: string;
  category: "sauces";
  price: number;
  image: string;
  tags: string[];
}

export interface DealItem {
  id: string;
  name: string;
  description: string;
  category: "deals";
  price: number;
  includes: string[];
  image: string;
  tags: string[];
}

export type MenuItem = PizzaItem | FriesItem | DrinkItem | SauceItem | DealItem;

// ── DEALS ────────────────────────────────────────────────────
export const DEALS: DealItem[] = [
  {
    id: "deal-lunch",
    name: "Lunch Deal",
    description:
      "The perfect midday meal — one personal pizza, regular fries, and a chilled 250ml drink.",
    category: "deals",
    price: 799,
    includes: ["1x Personal Pizza (any flavor)", "1x Regular Fries", "1x 250ml Drink"],
    image: "/images/Studio_food_photography_combo_meal_202607072313.jpeg",
    tags: ["lunch", "deal", "meal", "combo", "midday"],
  },
  {
    id: "deal-buffet",
    name: "Buffet",
    description:
      "Unlimited pizzas, fries, and drinks. Perfect for groups and big appetites.",
    category: "deals",
    price: 1499,
    includes: ["Unlimited Pizza (all flavors)", "Unlimited Fries", "Unlimited Drinks"],
    image: "/images/Pizza_buffet_spread_on_boards_202607072313.jpeg",
    tags: ["buffet", "unlimited", "group", "family", "all you can eat"],
  },
  {
    id: "deal-hi-tea",
    name: "Hi-Tea Deal",
    description:
      "Afternoon indulgence — two mini pizzas, garlic bread, a sauce trio, and drinks for two.",
    category: "deals",
    price: 1199,
    includes: [
      "2x Mini Pizzas",
      "Garlic Bread",
      "Ketchup, Chilli Garlic, Garlic Mayo",
      "2x 250ml Drinks",
    ],
    image: "/images/Tea-time_meal_spread_2K_202607072342.jpeg",
    tags: ["hi-tea", "hi tea", "high tea", "afternoon", "tea time", "evening"],
  },
];

// ── PIZZA ─────────────────────────────────────────────────────
export const PIZZAS: PizzaItem[] = [
  {
    id: "pizza-margherita",
    name: "Margherita",
    description: "Classic tomato base, fresh mozzarella, basil. The OG.",
    category: "pizza",
    sizes: { Small: 549, Medium: 749, Large: 949 },
    image: "/images/Margherita_pizza_on_black_slate_202607072233.jpeg",
    tags: ["margherita", "classic", "cheese", "basil"],
  },
  {
    id: "pizza-bbq-chicken",
    name: "BBQ Chicken",
    description: "Smoky BBQ sauce, grilled chicken strips, caramelized onions.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/BBQ_Chicken_pizza_close-up_2K_202607072243.jpeg",
    tags: ["bbq", "chicken", "barbecue", "smoky"],
  },
  {
    id: "pizza-peri-peri",
    name: "Peri Peri Chicken",
    description: "Fiery peri peri sauce, grilled chicken, roasted peppers.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Peri_Peri_Chicken_pizza_on_202607072253.jpeg",
    tags: ["peri peri", "spicy", "chicken", "hot", "peppers"],
  },
  {
    id: "pizza-pepperoni",
    name: "Pepperoni",
    description: "Generous pepperoni, rich tomato sauce, stretchy mozzarella.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Pepperoni_pizza_on_slate_2K_202607072249.jpeg",
    tags: ["pepperoni", "meat", "classic"],
  },
  {
    id: "pizza-veggie-supreme",
    name: "Veggie Supreme",
    description: "Bell peppers, mushrooms, olives, onions, corn — loaded.",
    category: "pizza",
    sizes: { Small: 599, Medium: 799, Large: 999 },
    image: "/images/Loaded_Veggie_Supreme_pizza_board_202607072244.jpeg",
    tags: ["veggie", "vegetarian", "vegetables", "mushroom", "peppers"],
  },
  {
    id: "pizza-tikka",
    name: "Chicken Tikka",
    description: "Marinated tikka chicken, mint chutney drizzle, onion rings.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Chicken_Tikka_pizza_presentation_2K_202607072258.jpeg",
    tags: ["tikka", "chicken", "desi", "spicy", "masala"],
  },
  {
    id: "pizza-mexicana",
    name: "Mexicana",
    description: "Jalapeños, kidney beans, salsa, ground beef, sour cream.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Mexicana_pizza_with_toppings_2K_202607072300.jpeg",
    tags: ["mexican", "mexicana", "jalapeno", "spicy", "beef"],
  },
  {
    id: "pizza-meat-feast",
    name: "Meat Feast",
    description: "Chicken, beef mince, pepperoni, sausage — carnivore heaven.",
    category: "pizza",
    sizes: { Small: 699, Medium: 899, Large: 1099 },
    image: "/images/Meat_Feast_pizza_close-up_2K_202607072303.jpeg",
    tags: ["meat", "feast", "chicken", "beef", "pepperoni", "sausage"],
  },
  {
    id: "pizza-mushroom-truffle",
    name: "Mushroom & Truffle",
    description: "Wild mushrooms, truffle oil, goat cheese, fresh thyme.",
    category: "pizza",
    sizes: { Small: 699, Medium: 899, Large: 1099 },
    image: "/images/Mushroom_truffle_pizza_on_slate_202607072309.jpeg",
    tags: ["mushroom", "truffle", "gourmet", "cheese", "herb"],
  },
  {
    id: "pizza-four-cheese",
    name: "Four Cheese",
    description: "Mozzarella, cheddar, parmesan, gorgonzola — maximum melt.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Four_Cheese_pizza_cheese-pull_2K_202607072309.jpeg",
    tags: ["cheese", "four cheese", "mozzarella", "cheddar", "parmesan"],
  },
  {
    id: "pizza-ranch-chicken",
    name: "Ranch Chicken",
    description: "Creamy ranch base, grilled chicken, bacon bits, spring onion.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Ranch_Chicken_pizza_overhead_2K_202607072309.jpeg",
    tags: ["ranch", "chicken", "creamy", "bacon"],
  },
  {
    id: "pizza-lahori",
    name: "Lahori Special",
    description: "Bold lahori spices, seekh kebab chunks, green chutney, onion.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Lahori_Special_pizza_with_kebab_202607072309.jpeg",
    tags: ["lahori", "special", "desi", "kebab", "seekh", "spicy", "pakistan"],
  },
  {
    id: "pizza-garlic-prawn",
    name: "Garlic Prawn",
    description: "Garlic butter base, tiger prawns, parsley, lemon zest.",
    category: "pizza",
    sizes: { Small: 749, Medium: 949, Large: 1149 },
    image: "/images/Garlic_Prawn_pizza_flat_lay_202607072310.jpeg",
    tags: ["garlic", "prawn", "seafood", "shrimp", "butter"],
  },
  {
    id: "pizza-buffalo",
    name: "Buffalo Blast",
    description: "Buffalo hot sauce, crispy chicken tenders, celery, blue cheese.",
    category: "pizza",
    sizes: { Small: 649, Medium: 849, Large: 1049 },
    image: "/images/Buffalo_Blast_pizza_food_styling_202607072310.jpeg",
    tags: ["buffalo", "hot", "spicy", "chicken", "crispy"],
  },
  {
    id: "pizza-hawaiian",
    name: "Hawaiian",
    description: "Ham, pineapple, mozzarella — the one that starts arguments.",
    category: "pizza",
    sizes: { Small: 599, Medium: 799, Large: 999 },
    image: "/images/Hawaiian_pizza_overhead_shot_2K_202607072310.jpeg",
    tags: ["hawaiian", "pineapple", "ham", "sweet", "tropical"],
  },
];

// ── FRIES ─────────────────────────────────────────────────────
export const FRIES: FriesItem[] = [
  {
    id: "fries-plain",
    name: "Plain Fries",
    description: "Crispy golden fries, lightly salted. Simple. Perfect.",
    category: "fries",
    price: 249,
    image: "/images/Crispy_french_fries_in_scoop_202607072312.jpeg",
    tags: ["plain", "regular", "salted", "classic", "simple"],
  },
  {
    id: "fries-masala",
    name: "Masala Fries",
    description: "Golden fries tossed in a bold house masala spice blend.",
    category: "fries",
    price: 299,
    image: "/images/Spicy_Masala_Fries_in_bowl_202607072312.jpeg",
    tags: ["masala", "spiced", "desi", "chatpata", "spicy"],
  },
  {
    id: "fries-periperi",
    name: "Peri Peri Fries",
    description: "Fiery peri peri dusted fries — addictive heat in every bite.",
    category: "fries",
    price: 299,
    image: "/images/Spicy_Masala_Fries_in_bowl_202607072312(1).jpeg",
    tags: ["peri peri", "spicy", "hot", "fiery", "chili"],
  },
];

// ── DRINKS ────────────────────────────────────────────────────
export const DRINKS: DrinkItem[] = [
  {
    id: "drink-coke",
    name: "Coke",
    description: "Ice cold Coca-Cola. The classic pairing for any pizza.",
    category: "drinks",
    sizes: { "250ml": 99, "1.5L": 249 },
    image: "/images/coke.jpeg",
    tags: ["coke", "cola", "coca cola", "cocacola", "cold drink", "soda"],
  },
  {
    id: "drink-sprite",
    name: "Sprite",
    description: "Crisp, clean lemon-lime refreshment. Zero caffeine.",
    category: "drinks",
    sizes: { "250ml": 99, "1.5L": 249 },
    image: "/images/Fizzy_Sprite_glass_with_lemon_202607072313.jpeg",
    tags: ["sprite", "lemon", "lime", "fizzy", "clear", "soda"],
  },
];

// ── SAUCES ────────────────────────────────────────────────────
export const SAUCES: SauceItem[] = [
  {
    id: "sauce-ketchup",
    name: "Ketchup",
    description: "Classic tomato ketchup. Goes with everything.",
    category: "sauces",
    price: 49,
    image: "/images/Tomato_ketchup_in_dipping_bowl_202607072313.jpeg",
    tags: ["ketchup", "tomato", "sauce", "red"],
  },
  {
    id: "sauce-chilli-garlic",
    name: "Chilli Garlic",
    description: "Punchy chilli-garlic heat. Our most popular dip.",
    category: "sauces",
    price: 59,
    image: "/images/Chilli_Garlic_sauce_in_saucer_202607072342.jpeg",
    tags: ["chilli", "chili", "garlic", "hot", "spicy", "sauce", "dip"],
  },
  {
    id: "sauce-garlic-mayo",
    name: "Garlic Mayo",
    description: "Creamy roasted garlic mayonnaise. Rich, smooth, indulgent.",
    category: "sauces",
    price: 59,
    image: "/images/Garlic_Mayo_sauce_in_bowl_202607072342.jpeg",
    tags: ["garlic", "mayo", "mayonnaise", "creamy", "white", "sauce"],
  },
];

// ── FULL MENU EXPORT ──────────────────────────────────────────
export const FULL_MENU = {
  deals: DEALS,
  pizza: PIZZAS,
  fries: FRIES,
  drinks: DRINKS,
  sauces: SAUCES,
};

export const ALL_ITEMS: MenuItem[] = [
  ...DEALS,
  ...PIZZAS,
  ...FRIES,
  ...DRINKS,
  ...SAUCES,
];

// Helper: find item by ID across all categories
export function findItemById(id: string): MenuItem | undefined {
  return ALL_ITEMS.find((item) => item.id === id);
}

// Helper: get price for an item + optional size
export function getItemPrice(
  item: MenuItem,
  size?: Size | DrinkSize
): number | null {
  if (item.category === "pizza") {
    if (!size) return null;
    return (item as PizzaItem).sizes[size as Size] ?? null;
  }
  if (item.category === "drinks") {
    if (!size) return null;
    return (item as DrinkItem).sizes[size as DrinkSize] ?? null;
  }
  if (
    item.category === "fries" ||
    item.category === "sauces" ||
    item.category === "deals"
  ) {
    return (item as FriesItem | SauceItem | DealItem).price;
  }
  return null;
}
