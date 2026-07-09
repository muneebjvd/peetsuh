import type { Metadata } from "next";
import "./globals.css";
import PizzaTrailer from "@/components/PizzaTrailer";

export const metadata: Metadata = {
  title: "peetsuh — Pizza Worth Talking About",
  description:
    "Order handcrafted pizza from peetsuh using our AI-free chatbot or browse our full menu. Fast, fresh, delivered.",
  keywords: ["pizza", "peetsuh", "order pizza", "fast food", "lahore"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PizzaTrailer />
        {children}
      </body>
    </html>
  );
}
