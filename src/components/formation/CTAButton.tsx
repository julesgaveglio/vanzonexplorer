"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/meta-pixel";

interface CTAButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function CTAButton({ className = "", style, children, fullWidth }: CTAButtonProps) {
  const handleClick = () => {
    trackEvent("Lead", { content_name: "vba-formation" });
  };

  return (
    <Link
      href="/van-business-academy/presentation"
      onClick={handleClick}
      className={`${fullWidth ? "block w-full text-center" : "inline-block"} font-bold text-white py-4 px-10 rounded-xl text-base sm:text-lg transition-all hover:scale-[1.02] hover:shadow-lg ${className}`}
      style={style || {
        background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
        boxShadow: "0 4px 18px rgba(185, 148, 95, 0.45)",
      }}
    >
      {children}
    </Link>
  );
}
