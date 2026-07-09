// ============================================================
// peetsuh — Order ID generator
// ============================================================

let counter = 0;

export function generateOrderRef(): string {
  counter = (counter + 1) % 10000;
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  const seq = String(counter).padStart(4, "0");
  return `PTS-${ts}-${rand}${seq}`;
}
