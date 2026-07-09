"use client";
import { useEffect, useRef } from "react";

export default function PizzaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let angle = 0;
    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.38;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Pizza base
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#C8973A";
      ctx.fill();

      // Crust ring
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#8B6220";
      ctx.lineWidth = r * 0.08;
      ctx.stroke();

      // Sauce
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
      ctx.fillStyle = "#B03025";
      ctx.fill();

      // Cheese
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.fillStyle = "#E8C87A";
      ctx.fill();

      // Slice lines
      ctx.strokeStyle = "#C8973A";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }

      // Toppings (pepperoni-like circles)
      const toppings = [
        [0.4, 0], [0, 0.4], [-0.4, 0], [0, -0.4],
        [0.28, 0.28], [-0.28, 0.28], [0.28, -0.28], [-0.28, -0.28],
      ];
      for (const [tx, ty] of toppings) {
        ctx.beginPath();
        ctx.arc(tx * r, ty * r, r * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = "#8B1A1A";
        ctx.fill();
      }

      ctx.restore();

      // Outer glow ring (static)
      ctx.beginPath();
      ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(192, 57, 43, 0.15)";
      ctx.lineWidth = 24;
      ctx.stroke();

      angle += 0.004;
      animId = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero__canvas"
      style={{ opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}
