import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: 
          "text-foreground",
        // Status Badges
        stable:
          "border-transparent status-stable",
        warning:
          "border-transparent status-warning",
        critical:
          "border-transparent status-critical animate-pulse",
        // Blood Type Badges
        "blood-o":
          "border-transparent blood-o font-bold",
        "blood-a":
          "border-transparent blood-a font-bold",
        "blood-b":
          "border-transparent blood-b font-bold",
        "blood-ab":
          "border-transparent blood-ab font-bold",
        // Urgency Badges
        urgent:
          "border-transparent bg-primary/15 text-primary font-bold",
        pending:
          "border-transparent bg-muted text-muted-foreground",
        verified:
          "border-transparent bg-status-stable/15 text-status-stable",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
