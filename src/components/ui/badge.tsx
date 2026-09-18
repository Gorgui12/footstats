import { cn } from "@/lib/utils/cn";

type BadgeVariant = "live" | "neutral" | "success" | "outline";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  live: "bg-live/15 text-live border border-live/30",
  neutral: "bg-white/5 text-white/70 border border-white/10",
  success: "bg-brand-500/15 text-brand-300 border border-brand-500/30",
  outline: "border border-white/20 text-white/80",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
