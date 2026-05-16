import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type Tone = "accent" | "neutral" | "success" | "warn";

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className"> {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
  children?: ReactNode;
}

const tones: Record<Tone, string> = {
  accent: "bg-accent/15 text-accent border border-accent/30",
  neutral: "bg-background/50 text-foreground border border-foreground/10",
  success: "bg-logo/15 text-logo border border-logo/30",
  warn: "bg-accent/20 text-accent border border-accent/40",
};

export function Badge({
  tone = "neutral",
  pulse = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-3xs font-mono uppercase tracking-[0.2em] backdrop-blur-md",
        tones[tone],
        pulse && "animate-pulse",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
