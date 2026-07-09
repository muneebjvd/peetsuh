"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INGREDIENTS = ["🧀", "🍅", "🍄", "🫑", "🧅", "🥓", "🌿", "🔴", "🍗", "🧀"];

export default function PizzaTrailer() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsIdle(false);

      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => {
        setIsIdle(true);
      }, 300); // Wait 0.3s of no movement to form pizza
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
    };
  }, []);

  // Don't render anything if the mouse hasn't entered yet
  if (mousePos.x === -100) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      <style>{`
        * { cursor: none !important; }
      `}</style>

      {/* Pizza Base (Dough with Sauce & Cheese) acting as the main cursor */}
      <motion.div
        animate={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: "tween", duration: 0 }} // Instant follow for cursor feel
        style={{
          position: "absolute",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #ffb703 40%, #d00000 65%, #d4a373 80%)",
          border: "2px solid #b07d46",
          marginLeft: "-16px",
          marginTop: "-16px",
          boxShadow: "0 3px 8px rgba(0,0,0,0.3)"
        }}
      />

      {/* Ingredients that trail the mouse and settle naturally on the pizza */}
      {INGREDIENTS.map((item, index) => {
        // Evenly distribute toppings into a center, inner ring, and outer ring
        let radius = 0;
        let angle = 0;
        
        if (index === 0) {
          radius = 0;
        } else if (index <= 4) {
          radius = 4.5; // inner ring
          angle = (index * Math.PI * 2) / 4;
        } else {
          radius = 8.5; // outer ring
          angle = (index * Math.PI * 2) / 5 + (Math.PI / 5);
        }

        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={index}
            animate={{
              x: mousePos.x + (isIdle ? offsetX : 0),
              y: mousePos.y + (isIdle ? offsetY : 0),
              rotate: isIdle ? (index * 45) : 0,
            }}
            transition={{
              type: "spring",
              damping: 10 + index * 1.5,
              stiffness: 150,
              mass: 0.5
            }}
            style={{
              position: "absolute",
              fontSize: "8px", 
              marginLeft: "-4px",
              marginTop: "-4px",
              opacity: 0.95,
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))"
            }}
          >
            {item}
          </motion.div>
        );
      })}
    </div>
  );
}
