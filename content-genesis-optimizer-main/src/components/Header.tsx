import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Genfuze.ai</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = 'http://139.59.32.231:5174/CloudFuzeLLMQA'}
          >
            Sign In
          </Button>
          <Button 
            variant="hero" 
            size="sm"
            onClick={() => window.location.href = 'http://139.59.32.231:5174/CloudFuzeLLMQA'}
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;