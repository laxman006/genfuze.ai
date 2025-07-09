import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

const CTASection = () => {
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
            Ready to Transform Your Content?
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
            Smarter content.
            <span className="block text-primary">Bigger impact. Now.</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Unlock AI-driven questions, deep content insights, and seamless browser automation. 
            Choose your plan, boost engagement, and let your site shine in every AI model. 
            Ready to amplify your reach?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              variant="hero" 
              size="xl" 
              className="min-w-[200px]"
              onClick={() => window.location.href = 'http://139.59.32.231:5174/CloudFuzeLLMQA'}
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="premium" size="xl" className="min-w-[200px]">
              <Sparkles className="w-5 h-5 mr-2" />
              View Pricing
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Questions Generated</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;