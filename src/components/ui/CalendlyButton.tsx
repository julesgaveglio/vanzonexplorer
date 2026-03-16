"use client";

import { motion } from "framer-motion";

const CALENDLY_URL = "https://calendly.com/vanzonexplorer/30min";

interface CalendlyButtonProps {
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "text-sm !px-4 !py-2",
  md: "text-base",
  lg: "text-lg !px-8 !py-4",
};

export default function CalendlyButton({
  size = "md",
  children,
  className = "",
}: CalendlyButtonProps) {
  const openCalendly = () => {
    (window as Window & { Calendly?: { initPopupWidget: (opts: { url: string }) => void } })
      .Calendly?.initPopupWidget({ url: CALENDLY_URL });
  };

  return (
    <motion.button
      type="button"
      className={`btn-gold inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white rounded-full cursor-pointer ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={openCalendly}
    >
      {children}
    </motion.button>
  );
}
