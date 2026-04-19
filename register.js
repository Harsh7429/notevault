import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f6f52]/35 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#171511] px-6 py-3 text-[#fffdf8] shadow-[0_16px_34px_rgba(40,34,27,0.14)] hover:-translate-y-0.5 hover:bg-[#2c2821]",
        ghost: "border border-[#171511]/10 bg-white/70 px-6 py-3 text-[#171511] hover:border-[#171511]/18 hover:bg-white",
        soft: "bg-[#f0e8da] px-6 py-3 text-[#171511] hover:bg-[#e8ddca]"
      },
      size: {
        default: "h-11",
        lg: "h-12 px-7 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Button.displayName = "Button";

export { Button, buttonVariants };
