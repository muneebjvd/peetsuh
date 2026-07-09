"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const IMAGES = [
  "/bg/1.jpeg",
  "/bg/2.jpeg",
  "/bg/3.jpeg",
  "/bg/4.jpeg",
  "/bg/3.jpeg",
  "/bg/2.jpeg",
];

const DURATIONS = [4000, 2000, 2000, 2000, 2000, 2000];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, DURATIONS[index]);

    return () => clearTimeout(timeoutId);
  }, [index]);

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0,
      opacity: 0.35, 
      pointerEvents: "none"
    }}>
      {IMAGES.map((src, i) => (
        <div
          key={`${src}-${i}`}
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            zIndex: i === index ? 1 : -1,
            visibility: i === index ? "visible" : "hidden"
          }}
        >
          <Image src={src} alt="Hero background" fill priority style={{ objectFit: "cover" }} quality={60} sizes="100vw" />
        </div>
      ))}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)"
      }} />
    </div>
  );
}
