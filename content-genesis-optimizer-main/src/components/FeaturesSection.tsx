import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Search, Globe, Zap, Brain, Target } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: "Instant Question Generator",
      description: "Drop in your content and get custom questions for any audience—fast, smart, and ready to spark engagement.",
      badge: "AI-Powered"
    },
    {
      icon: Search,
      title: "Semantic Match Checker",
      description: "See how your content stacks up with AI answers. Get clear insights and fine-tune for maximum impact.",
      badge: "Vector Matching"
    },
    {
      icon: Globe,
      title: "Automated Browser Magic",
      description: "Let AI handle the heavy lifting—fetch, test, and update answers automatically. Always fresh, always relevant.",
      badge: "Automation"
    },
    {
      icon: Zap,
      title: "Generative Engine Optimization",
      description: "Optimize your content for AI search engines and language models. Stay ahead of the SEO evolution.",
      badge: "GEO Ready"
    },
    {
      icon: Brain,
      title: "Multi-AI Intelligence",
      description: "Harness the power of multiple AI models simultaneously for diverse perspectives and enhanced accuracy.",
      badge: "Advanced AI"
    },
    {
      icon: Target,
      title: "Brand Visibility Boost",
      description: "Improve your content's discoverability and relevance across all AI-powered platforms and search engines.",
      badge: "Growth"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            Smarter content.{' '}
            <span className="text-primary">Sharper results.</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Boost your site's reach with AI-driven question generation, deep content analysis, 
            and seamless optimization—no tech headaches, just more eyes on you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-glow-card transition-all duration-300 border-border/50 hover:border-primary/20 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors text-black">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;