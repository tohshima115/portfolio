import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "ghost" | "menu";
type Size = "sm" | "md";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    as?: "button";
  };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variants: Record<Variant, string> = {
  primary:
    "group inline-flex items-center justify-center gap-2 bg-foreground text-background font-mono tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors",
  ghost:
    "inline-flex items-center justify-center gap-2 font-mono tracking-[0.3em] uppercase border border-border text-foreground hover:border-accent hover:text-accent transition-colors",
  menu:
    "block w-full text-left text-neutral-300 hover:bg-yellow-400 hover:text-black transition-colors uppercase tracking-widest font-mono",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-2xs",
  md: "h-10 px-5 text-2xs",
};

const menuSize: Record<Size, string> = {
  sm: "px-4 py-3 text-xs",
  md: "px-4 py-3 text-xs",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  const sizeClass = variant === "menu" ? menuSize[size] : sizes[size];
  const merged = cn(variants[variant], sizeClass, className);

  if (props.as === "a") {
    const { as: _as, ...anchorRest } = rest as ButtonAsAnchor;
    return (
      <a className={merged} {...anchorRest}>
        {children}
      </a>
    );
  }
  const { as: _as, ...buttonRest } = rest as ButtonAsButton;
  return (
    <button className={merged} {...buttonRest}>
      {children}
    </button>
  );
}
