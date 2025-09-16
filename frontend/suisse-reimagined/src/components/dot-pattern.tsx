import React from "react";

type DotPatternProps = {
  className?: string;
  dotColor?: string; // tailwind color or hex
  background?: string; // tailwind bg class
  size?: number; // gap between dots in px
  radius?: number; // dot radius in px
};

// Lightweight dark-mode dot pattern background using SVG
const DotPattern: React.FC<DotPatternProps> = ({
  className,
  dotColor = "#2a2a2a",
  background,
  size = 22,
  radius = 1.4,
}) => {
  const patternId = React.useMemo(() => `dots-${size}-${radius}-${dotColor.replace(/[^a-zA-Z0-9]/g, "")}`,[size, radius, dotColor]);
  return (
    <div className={className} aria-hidden>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {background ? <rect width="100%" height="100%" className={background} /> : null}
        <defs>
          <pattern id={patternId} x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r={radius} fill={dotColor} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};

export default DotPattern;


