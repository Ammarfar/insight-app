import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper hover:bg-ink/90",
        sage: "bg-sage-100 text-sage-800 hover:bg-sage-200",
        violet: "bg-violet-100 text-violet-800 hover:bg-violet-200",
        outline: "border border-line bg-field hover:bg-subtle",
        ghost: "hover:bg-subtle",
        danger: "bg-danger-soft text-danger hover:bg-danger-soft/80",
      },
      size: { default: "h-10 px-4", sm: "h-9 px-3 text-xs", lg: "h-12 px-6", icon: "size-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
