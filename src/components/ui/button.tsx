import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "default" | "outline";
};

const variants = {
  default: "bg-primary text-primary-foreground enabled:hover:bg-primary-hover",
  outline:
    "border border-input bg-transparent text-foreground enabled:hover:bg-surface",
};

export function Button({
  className,
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      type={type}
      className={cn(
        "inline-flex min-h-control max-w-full items-center justify-center rounded-control px-4 py-1 text-center text-sm font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
