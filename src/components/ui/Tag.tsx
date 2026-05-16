import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type Variant = "tech" | "role" | "meta";

interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className"> {
  variant?: Variant;
  className?: string;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  tech: "inline-flex items-center px-2 py-0.5 text-3xs font-mono tracking-wider uppercase border border-border text-muted-foreground",
  role: "inline-flex items-center px-2 py-0.5 text-3xs font-mono tracking-wider uppercase border border-border text-muted-foreground bg-muted",
  meta: "inline-flex items-center text-2xs text-muted-foreground font-mono",
};

export function Tag({
  variant = "tech",
  className,
  children,
  ...rest
}: TagProps) {
  return (
    <span className={cn(variants[variant], className)} {...rest}>
      {children}
    </span>
  );
}
