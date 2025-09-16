type HoverFeature = {
  title: string;
  description: string;
  tag?: string;
};

const FEATURES: HoverFeature[] = [
  {
    title: "Plug-and-play DeFi blocks",
    description:
      "Drag-and-drop triggers, operations, and actions to compose flows without boilerplate.",
    tag: "Low-code",
  },
  {
    title: "Stellar-native",
    description:
      "First-class Stellar integrations for swaps, price feeds, and webhooks.",
    tag: "Blockchain",
  },
  {
    title: "Visual automation canvas",
    description:
      "Build, connect, and preview the entire flow with zoom and smooth curved links.",
    tag: "UX",
  },
  {
    title: "Security & governance",
    description:
      "Permissions, logs, and versioning to operate safely in production.",
    tag: "Security",
  },
  {
    title: "Observability & logs",
    description:
      "Inspect executions, inputs, and outputs for each node to debug faster.",
    tag: "DevEx",
  },
  {
    title: "One‑click deploy",
    description:
      "Publish and share flows with guardrails and change control.",
    tag: "Ship fast",
  },
];

const FeatureHoverSection = () => {
  return (
    <section className="w-full pt-0 pb-10 md:pt-0 md:pb-14 -mt-6 md:-mt-8">
      <div className="mx-auto max-w-6xl px-6">
        <div data-hover-grid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/10 bg-[#0d0d0d]/70 p-5 md:p-6 overflow-hidden hover:border-white/20 transition-all"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background:
                "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(255,255,255,0.06), transparent 40%)" }} />

              {f.tag && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-white/5 border border-white/10 text-white/80">
                  {f.tag}
                </span>
              )}

              <h3 className="mt-3 text-base md:text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{f.description}</p>

              <div className="absolute inset-px rounded-[calc(theme(borderRadius.2xl)-1px)] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-white/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.querySelectorAll('[data-hover-grid] .group').forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--x',`${e.clientX-r.left}px`);card.style.setProperty('--y',`${e.clientY-r.top}px`);});});",
        }}
      />
    </section>
  );
};

export default FeatureHoverSection;


