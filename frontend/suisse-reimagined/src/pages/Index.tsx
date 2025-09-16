import { Button } from "@/components/ui/button";
import { RadialGlowBackground } from "@/components/radial-glow-background";
import { BlurFade } from "@/components/blur-fade";
import { useNavigate } from "react-router-dom";
import FeatureHoverSection from "@/components/FeatureHoverSection";

const Index = () => {
  const navigate = useNavigate();
  return (
    <RadialGlowBackground>
      <img
        src="/deflow.png"
        alt="Deflow"
        className="absolute top-6 left-1/2 -translate-x-1/2 h-10 md:h-12"
      />
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-3xl mx-auto">
        <BlurFade delay={500}>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 font-suisse leading-tight">
            Making DeFi on{" "}
            <span className="font-bold">Stellar</span>
            <br />
            <span className="font-light">Accessible</span>, <span className="font-light">easy</span> and{" "}
            <span className="font-bold">Simple!</span>
          </h1>
        </BlurFade>
        
        <p className="text-base md:text-lg text-muted-foreground mb-8 font-suisse font-light max-w-xl mx-auto leading-relaxed">
          A low-code platform empowering any developer to integrate DeFi into their apps.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            size="lg" 
            className="px-12 py-6 text-lg min-w-[200px] rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/login")}
          >
            Use Deflow
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-12 py-6 text-lg min-w-[200px] rounded-2xl border-border bg-transparent text-foreground hover:bg-white hover:text-black"
            onClick={() => console.log("Learn More clicked")}
          >
            Learn More
          </Button>
        </div>
      </div>
      </div>
      <FeatureHoverSection />
    </RadialGlowBackground>
  );
};

export default Index;