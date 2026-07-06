// Premium brand logo component
import { cn } from "@/lib/utils";

export function IdrottLogo({
  className,
  size = "md",
  variant = "default",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "light";
}) {
  const sizes = {
    sm: "h-7 w-7",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };
  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl brand-gradient shadow-premium",
          sizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-1/2 w-1/2 text-white"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l1.5-5h11L19 13M5 13h14M5 13v4a1 1 0 001 1h12a1 1 0 001-1v-4" />
          <circle cx="8" cy="17" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="17" r="1.5" fill="currentColor" stroke="none" />
          <path d="M7 8l1-2M11 8l1-2M15 8l1-2" opacity="0.6" />
        </svg>
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight",
          textSizes[size],
          variant === "light" ? "text-white" : "text-foreground"
        )}
      >
        THE IDROTT
      </span>
    </div>
  );
}
