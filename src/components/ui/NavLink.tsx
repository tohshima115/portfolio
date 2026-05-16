import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface NavLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  active?: boolean;
  className?: string;
  children?: ReactNode;
}

export function NavLink({
  active = false,
  className,
  children,
  ...rest
}: NavLinkProps) {
  return (
    <a
      className={cn(
        "font-mono text-2xs tracking-[0.25em] uppercase px-3 py-2 border-b-2 border-transparent transition-colors hover:border-accent",
        active && "border-accent text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
