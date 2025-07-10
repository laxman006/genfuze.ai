import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Header = () => {
  const handleSignIn = () => {
    window.location.href = import.meta.env.VITE_AUTOBROWSER_URL || 'http://localhost:5174/CloudFuzeLLMQA';
  };

  const handleGetStarted = () => {
    window.location.href = import.meta.env.VITE_AUTOBROWSER_URL || 'http://localhost:5174/CloudFuzeLLMQA';
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-extrabold text-primary tracking-wide">Genfuze.ai</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
            How it works
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
            Pricing
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleSignIn}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-200"
          >
            Sign In
          </Button>
          <Button 
            onClick={handleGetStarted}
            size="sm"
            className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-200 font-semibold"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;