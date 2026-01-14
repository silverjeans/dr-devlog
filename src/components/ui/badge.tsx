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
        outline: "text-foreground",
        optics:
          "border-transparent bg-optics text-optics-foreground hover:bg-optics/80",
        mech:
          "border-transparent bg-mech text-mech-foreground hover:bg-mech/80",
        hw: "border-transparent bg-hw text-hw-foreground hover:bg-hw/80",
        sw: "border-transparent bg-sw text-sw-foreground hover:bg-sw/80",
        // Phase badges
        planning: "border-transparent bg-gray-500 text-white",
        ws: "border-transparent bg-yellow-500 text-white",
        pt: "border-transparent bg-orange-500 text-white",
        es: "border-transparent bg-blue-500 text-white",
        pp: "border-transparent bg-purple-500 text-white",
        mp: "border-transparent bg-green-500 text-white",
        // Log type badges
        alignment: "border-transparent bg-red-100 text-red-800",
        calibration: "border-transparent bg-yellow-100 text-yellow-800",
        accuracy: "border-transparent bg-blue-100 text-blue-800",
        bug: "border-transparent bg-red-500 text-white",
        decision: "border-transparent bg-purple-100 text-purple-800",
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
