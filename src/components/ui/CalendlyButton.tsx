"use client";

import CalendlyModal from "./CalendlyModal";

interface CalendlyButtonProps {
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "text-sm !px-4 !py-2",
  md: "text-base",
  lg: "text-lg !px-8 !py-5",
};

export default function CalendlyButton({
  size = "md",
  children,
  className = "",
}: CalendlyButtonProps) {
  return (
    <CalendlyModal
      className={`btn-gold btn-shine inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white rounded-full cursor-pointer active:scale-95 transition-transform ${sizeClasses[size]} ${className}`}
    >
      {children}
    </CalendlyModal>
  );
}
