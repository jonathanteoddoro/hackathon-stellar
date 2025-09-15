import { useEffect, useState } from "react";

interface TextScrambleProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

const chars = "!<>-_\\/[]{}—=+*^?#________";

export const TextScramble = ({ 
  text, 
  className = "", 
  speed = 50,
  delay = 0 
}: TextScrambleProps) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const scramble = (target: string, current: string, index: number) => {
      if (index >= target.length) {
        setIsComplete(true);
        return;
      }

      const newText = target
        .split("")
        .map((char, i) => {
          if (i < index) return target[i];
          if (i === index) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");

      setDisplayText(newText);

      timeout = setTimeout(() => {
        scramble(target, newText, index + 1);
      }, speed);
    };

    const startTimeout = setTimeout(() => {
      scramble(text, "", 0);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearTimeout(startTimeout);
    };
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
};
