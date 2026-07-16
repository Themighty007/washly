// Premium brand logo component - 4K SVG Version
import { cn } from "@/lib/utils";

export function IdrottLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: string;
}) {
  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20",
    xl: "h-32",
  };

  return (
    <div className={cn("flex items-center justify-center", sizes[size], className)}>
      <svg
        viewBox="0 0 300 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Background is transparent, shapes use currentColor or exact colors */}
        <g transform="translate(0, -10)">
          {/* D Outer Curve */}
          <path
            d="M 120 30 C 250 30, 250 170, 120 170 L 120 150 C 220 150, 220 50, 120 50 Z"
            fill="#FFE700"
          />
          {/* D Left Solid Bar */}
          <rect x="100" y="30" width="30" height="140" fill="#FFE700" rx="2" />
          
          {/* Negative Space Cutouts for the 'i' and stairs */}
          {/* Use standard black for light mode fallback, but ideal is background color */}
          <g className="fill-background" style={{ fill: "var(--background, #000)" }}>
            {/* Dot of the 'i' */}
            <circle cx="115" cy="65" r="7" />
            {/* Stairs going down */}
            <path d="M 105 90 L 115 90 L 115 110 L 125 110 L 125 130 L 131 130 L 131 170 L 105 170 Z" />
          </g>

          {/* THE Box */}
          <rect x="50" y="190" width="65" height="30" fill="#FFE700" />
          <text
            x="54"
            y="213"
            className="fill-background"
            style={{ fill: "var(--background, #000)" }}
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            fontSize="20"
            letterSpacing="0.5"
          >
            THE
          </text>

          {/* iDROTT Text */}
          <text
            x="122"
            y="215"
            fill="#FFE700"
            fontFamily="system-ui, sans-serif"
            fontSize="28"
            letterSpacing="1"
          >
            i<tspan fontWeight="900">DROTT</tspan>
          </text>

          {/* Tagline */}
          <text
            x="150"
            y="245"
            fill="#A1A1AA"
            fontFamily="cursive, sans-serif"
            fontSize="13"
            textAnchor="middle"
            fontStyle="italic"
          >
            Not From Since, It's The Future
          </text>
        </g>
      </svg>
    </div>
  );
}
