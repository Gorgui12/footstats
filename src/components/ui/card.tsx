import { cn } from "@/lib/utils/cn";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-white/10 bg-pitch-900/60 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
