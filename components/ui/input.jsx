"use client";

export function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 
      text-white placeholder:text-gray-500 focus:outline-none 
      focus:ring-2 focus:ring-white/20 ${className}`}
    />
  );
}
