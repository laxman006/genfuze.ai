import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const HeroSection = () => {
  const handleStartTrial = () => {
    window.location.href = import.meta.env.VITE_AUTOBROWSER_URL || 'http://localhost:5174/CloudFuzeLLMQA';
  };

  const handleWatchDemo = () => {
    // For now, also navigate to the app
    window.location.href = import.meta.env.VITE_AUTOBROWSER_URL || 'http://localhost:5174/CloudFuzeLLMQA';
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Unified Q&A Generation Platform
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
            Generate questions & answers from any content.<br />
            <span className="block text-primary">All-in-one. Instantly.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Paste a URL or your content, let Genfuze.ai crawl and analyze it, and instantly generate high-quality questions and answers using advanced AI models. Manage sessions, track statistics, export results, and see your cost breakdown—all in a seamless, modern dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
onClick={handleStartTrial}
size="lg" 
className="group bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-200 font-semibold text-lg px-8 py-4"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ml-2" />
            </Button>
            <Button 
              onClick={handleWatchDemo}
              variant="outline" 
              size="lg" 
              className="group border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 font-semibold text-lg px-8 py-4"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Q&A Generation
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Session Management
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Statistics & Cost Breakdown
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Export & Analytics
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;