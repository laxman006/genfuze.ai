import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

const CTASection = () => {
  const handleStartTrial = () => {
    window.location.href = import.meta.env.VITE_AUTOBROWSER_URL || 'http://localhost:5174/CloudFuzeLLMQA';
  };

  const handleViewPricing = () => {
    // Scroll to pricing section
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]"></div>
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Zap className="w-4 h-4 mr-2" />
            Ready to Generate Q&A Instantly?
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
            Smarter content workflows.<br />
            <span className="block text-primary">All your Q&A, sessions, and stats.</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Unlock instant Q&A generation, session management, detailed statistics, and cost breakdowns—all in one seamless dashboard. Paste a URL or content, generate questions and answers, and export your results with a click.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
<<<<<<< HEAD
              onClick={handleStartTrial}
              size="lg" 
              className="min-w-[200px] bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-200 font-semibold text-lg px-8 py-4"
=======
              variant="hero" 
              size="xl" 
              className="min-w-[200px]"
              onClick={() => window.location.href = 'http://139.59.32.231:5174/CloudFuzeLLMQA'}
>>>>>>> 43a69ee01c185be4bfc5fe35e2759e65bc4b1a20
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              onClick={handleViewPricing}
              variant="outline" 
              size="lg" 
              className="min-w-[200px] border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 font-semibold text-lg px-8 py-4"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              View Pricing
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">Q&A</div>
              <div className="text-sm text-muted-foreground">Generation</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">Sessions</div>
              <div className="text-sm text-muted-foreground">Management</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">Statistics</div>
              <div className="text-sm text-muted-foreground">& Cost Breakdown</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">Export</div>
              <div className="text-sm text-muted-foreground">& Analytics</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;