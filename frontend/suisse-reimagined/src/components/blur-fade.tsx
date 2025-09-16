import { cn } from "@/lib/utils";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const BlurFade = ({ 
  children, 
  className = "", 
  delay = 0,
  duration = 1000 
}: BlurFadeProps) => {
  return (
    <div
      className={cn(
        "animate-blur-fade",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};
