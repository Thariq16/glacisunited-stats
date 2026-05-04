import { Card } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";

interface AnimatedCardProps extends ComponentPropsWithoutRef<typeof Card> {
  delay?: number;
  hover?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, delay = 0, hover = true, children, ...props }, ref) => {
    const { ref: scrollRef, isVisible } = useScrollAnimation(0.1);

    return (
      <div ref={scrollRef}>
        <Card
          ref={ref}
          className={cn(
            "transition-all duration-500 ease-out",
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6",
            hover && "card-hover hover-glow",
            className
          )}
          style={{ transitionDelay: `${delay}ms` }}
          {...props}
        >
          {children}
        </Card>
      </div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";
