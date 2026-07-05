import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "../../utils/cn";

interface CommonProps {
  className?: string;
  children?: ReactNode;
}

type MicroLabelAsSpan = CommonProps &
  Omit<HTMLAttributes<HTMLSpanElement>, "className"> & {
    as?: "span";
  };

type MicroLabelAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
    as: "a";
    href: string;
  };

export type MicroLabelProps = MicroLabelAsSpan | MicroLabelAsAnchor;

const baseClass =
  "font-mono text-2xs tracking-[0.3em] uppercase text-muted-foreground";

export function MicroLabel(props: MicroLabelProps) {
  const { className, children, ...rest } = props;
  const merged = cn(baseClass, className);

  if (props.as === "a") {
    const { as: _as, ...anchorRest } = rest as MicroLabelAsAnchor;
    return (
      <a
        className={cn(merged, "transition-colors hover:text-accent")}
        {...anchorRest}
      >
        {children}
      </a>
    );
  }
  const { as: _as, ...spanRest } = rest as MicroLabelAsSpan;
  return (
    <span className={merged} {...spanRest}>
      {children}
    </span>
  );
}
