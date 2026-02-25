import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active l'animation hover (translateY + border glow) */
  hover?: boolean;
  /** Padding interne — défaut p-6 */
  padding?: string;
  /** Tag HTML à utiliser — défaut div */
  as?: "div" | "article" | "section" | "aside";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      hover = false,
      padding = "p-6",
      as: Tag = "div",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Tag
        ref={ref}
        className={`glass-card ${hover ? "glass-card-hover" : ""} ${padding} ${className}`}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
