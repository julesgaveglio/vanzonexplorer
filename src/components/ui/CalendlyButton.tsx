"use client";

import CalendlyModal from "./CalendlyModal";
import LiquidButton from "./LiquidButton";

interface CalendlyButtonProps {
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export default function CalendlyButton({
  size = "md",
  children,
}: CalendlyButtonProps) {
  return (
    <CalendlyModal asChild>
      <LiquidButton variant="gold" size={size}>
        {children}
      </LiquidButton>
    </CalendlyModal>
  );
}
