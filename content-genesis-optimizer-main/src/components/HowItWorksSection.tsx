import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Cog, Sparkles, Rocket } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Upload Your Content",
      description: "Paste your website content, articles, or any text you want to optimize. Our AI instantly analyzes your content structure and context."
    },
    {
      icon: Cog,
      step: "02", 
      title: "AI Processing",
      description: "Multiple AI models work together to generate relevant questions, perform semantic analysis, and create optimized answers with vector matching."
    },
    {
      icon: Sparkles,
      step: "03",
      title: "Smart Optimization",
      description: "Our automated browser technology validates answers, checks semantic relevance, and ensures maximum accuracy and brand alignment."
    },
    {
      icon: Rocket,
      step: "04",
      title: "Boost Visibility",
      description: "Deploy your optimized content with enhanced discoverability for AI search engines and improved Generative Engine Optimization."
    }
  ];

  const stepIconBg = "bg-primary/10";

  return (
    <section id="how-it-works" className="py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            Turn content into questions—
            <span className="text-primary">fast</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Paste your site's content, pick your AI, and watch questions and answers roll in. 
            Analyze relevance, boost SEO, and see what your audience really wants—no tech skills needed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="h-full border-border/50 bg-white/80 backdrop-blur-sm hover:shadow-glow-card transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 ${stepIconBg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow`}>
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground font-bold text-xs">
                      {step.step}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-black">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="xl" className="group">
            Start Your Free Trial
            <Sparkles className="w-5 h-5 ml-2 group-hover:animate-pulse text-primary" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;