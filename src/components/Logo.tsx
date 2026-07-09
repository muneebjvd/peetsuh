import React from "react";

export default function Logo({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      style={{ width: "2.5em", height: "2.5em", ...style }} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Down-pointing slice (Solid Red) */}
      <path d="M 15 25 Q 50 10 85 25 L 50 85 Z" fill="var(--red)" />
      {/* Pepperoni dots */}
      <circle cx="40" cy="40" r="4.5" fill="var(--white)" />
      <circle cx="60" cy="45" r="4.5" fill="var(--white)" />
      <circle cx="50" cy="65" r="4.5" fill="var(--white)" />
      
      {/* Up-pointing slice (White outline overlapping) */}
      <path d="M 25 80 Q 60 95 95 80 L 60 20 Z" stroke="var(--white)" strokeWidth="6" strokeLinejoin="round" />
    </svg>
  );
}
