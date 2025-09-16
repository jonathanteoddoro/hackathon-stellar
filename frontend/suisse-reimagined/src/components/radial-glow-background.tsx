import { ReactNode } from "react";

export function RadialGlowBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#020617] relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle 500px at 50% 200px, #3e3e3e, transparent)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
