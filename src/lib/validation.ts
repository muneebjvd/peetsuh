// ============================================================
// peetsuh — Shared Validation Module
// Used by both chatbot and shop checkout — single source of truth
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ContactDetails {
  name: string;
  phone: string;
  address: string;
}

export interface CartItem {
  itemId: string;
  name: string;
  category: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderPayload {
  contact: ContactDetails;
  items: CartItem[];
  total: number;
  channel: "chat" | "shop";
  sessionId?: string;
}

// ── Phone validation (Pakistani mobile numbers) ──────────────
const PHONE_REGEX = /^(\+92|0)3\d{9}$/;

export function validatePhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  return PHONE_REGEX.test(cleaned);
}

export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+92")) return cleaned;
  if (cleaned.startsWith("0")) return "+92" + cleaned.slice(1);
  return cleaned;
}

// ── Name validation ──────────────────────────────────────────
export function validateName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

// ── Address validation ───────────────────────────────────────
export function validateAddress(address: string): boolean {
  return address.trim().length >= 5 && address.trim().length <= 300;
}

// ── Contact block validation ─────────────────────────────────
export function validateContact(contact: Partial<ContactDetails>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!contact.name || !validateName(contact.name)) {
    errors.push({ field: "name", message: "Name must be between 2 and 100 characters." });
  }

  if (!contact.phone || !validatePhone(contact.phone)) {
    errors.push({
      field: "phone",
      message: "Please provide a valid Pakistani mobile number (e.g. 03001234567).",
    });
  }

  if (!contact.address || !validateAddress(contact.address)) {
    errors.push({ field: "address", message: "Address must be at least 5 characters." });
  }

  return errors;
}

// ── Cart / items validation ──────────────────────────────────
export function validateItems(items: CartItem[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: "items", message: "Order must contain at least one item." });
    return errors;
  }

  items.forEach((item, idx) => {
    if (!item.itemId || typeof item.itemId !== "string") {
      errors.push({ field: `items[${idx}].itemId`, message: "Invalid item ID." });
    }
    if (!item.name || typeof item.name !== "string") {
      errors.push({ field: `items[${idx}].name`, message: "Invalid item name." });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
      errors.push({
        field: `items[${idx}].quantity`,
        message: "Quantity must be between 1 and 50.",
      });
    }
    if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
      errors.push({ field: `items[${idx}].unitPrice`, message: "Invalid unit price." });
    }
  });

  return errors;
}

// ── Full order validation ────────────────────────────────────
export function validateOrder(payload: Partial<OrderPayload>): ValidationError[] {
  const errors: ValidationError[] = [];

  errors.push(...validateContact(payload.contact ?? {}));
  errors.push(...validateItems(payload.items ?? []));

  if (!payload.channel || !["chat", "shop"].includes(payload.channel)) {
    errors.push({ field: "channel", message: "Invalid order channel." });
  }

  if (typeof payload.total !== "number" || payload.total < 0) {
    errors.push({ field: "total", message: "Invalid order total." });
  }

  return errors;
}

// ── Sanitize string for DB write ─────────────────────────────
export function sanitizeString(value: unknown, maxLen: number = 255): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}
