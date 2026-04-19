import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "market-card rounded-[2rem] border border-[#171511]/8 bg-[rgba(255,253,248,0.88)] shadow-[0_18px_48px_rgba(80,68,48,0.07)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn(className)} {...props} />;
}
