import { Shield, Zap, Globe2, Layers, Rocket, Cog, ArrowRight } from "lucide-react";

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
};

const FEATURES: Feature[] = [
  { 
    icon: Shield, 
    title: "Security First", 
    description: "End-to-end encryption and multi-layer security protocols ensure your DeFi operations are always protected.",
    highlight: true
  },
  { 
    icon: Zap, 
    title: "Lightning Fast", 
    description: "Optimized for Stellar's network speed with sub-second transaction processing and real-time updates." 
  },
  { 
    icon: Globe2, 
    title: "Global Ready", 
    description: "Built for worldwide adoption with multi-currency support and regulatory compliance frameworks." 
  },
  { 
    icon: Layers, 
    title: "Composable", 
    description: "Modular architecture allows you to build complex DeFi workflows by combining simple building blocks." 
  },
  { 
    icon: Rocket, 
    title: "Scalable", 
    description: "Horizontal scaling capabilities to handle everything from individual projects to enterprise-level applications." 
  },
  { 
    icon: Cog, 
    title: "Configurable", 
    description: "Flexible configuration options with environment-aware presets for different deployment scenarios." 
  },
];

const Features8 = () => {
  return (
    <section className="w-full pt-0 pb-16 md:pt-0 md:pb-24 bg-gradient-to-b from-transparent to-black/20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Why choose <span className="text-primary">Deflow</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built specifically for Stellar's ecosystem with enterprise-grade features and developer-friendly tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:scale-105 ${
                feature.highlight
                  ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card/50 hover:border-primary/30 hover:bg-card/80"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`grid place-items-center size-12 rounded-xl shrink-0 ${
                  feature.highlight 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                } transition-colors`}>
                  <feature.icon className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
              {feature.highlight && (
                <div className="absolute top-4 right-4">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-primary font-medium group cursor-pointer">
            <span>Explore all features</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features8;
