"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Variant = "primary" | "ghost" | "gold";

interface LiquidButtonProps {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  href?: string;
  external?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  gold: "btn-gold inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white rounded-full",
};

const sizeClasses: Record<string, string> = {
  sm: "text-sm !px-4 !py-2",
  md: "text-base",
  lg: "text-lg !px-8 !py-4",
};

export default function LiquidButton({
  variant = "primary",
  size = "md",
  children,
  className = "",
  href,
  external,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
}: LiquidButtonProps) {
  const classes = `${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href && external) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        aria-label={ariaLabel}
      >
        {children}
      </motion.a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}
