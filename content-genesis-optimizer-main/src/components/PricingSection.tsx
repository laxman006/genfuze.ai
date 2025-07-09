import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "$19",
      period: "/mo",
      description: "Perfect for individuals and small websites",
      badge: "Most Popular",
      features: [
        "Unlimited question generation",
        "Basic AI access",
        "Content insights",
        "Email support",
        "5 website analysis/month"
      ],
      cta: "Start Free Trial",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$49", 
      period: "/mo",
      description: "Ideal for growing businesses and agencies",
      badge: "Best Value",
      features: [
        "Everything in Starter",
        "Advanced AI models",
        "Semantic relevance checks",
        "Priority support",
        "Unlimited website analysis",
        "Vector matching technology",
        "Browser automation"
      ],
      cta: "Upgrade to Pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/mo", 
      description: "For large teams and enterprise solutions",
      badge: "Premium",
      features: [
        "Everything in Pro",
        "Custom AI model training",
        "White-label solutions",
        "Dedicated account manager",
        "API access",
        "Custom integrations",
        "24/7 phone support",
        "SLA guarantees"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Flexible Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Plans for every{" "}
            <span className="text-primary">growth stage</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pick a plan that fits. Upgrade, downgrade, or pause anytime—pay only for what you need.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative ${
                plan.highlighted 
                  ? 'border-primary shadow-glow-card bg-card/90' 
                  : 'border-border/50 hover:border-primary/20 bg-card/50'
              } transition-all duration-300 hover:shadow-glow-card backdrop-blur-sm`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground font-semibold px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs bg-secondary/50">
                    {plan.name}
                  </Badge>
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold">
                  {plan.price}
                  <span className="text-lg text-muted-foreground font-normal">
                    {plan.period}
                  </span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <Button 
                  variant={plan.highlighted ? "hero" : "premium"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-primary mr-2" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-primary mr-2" />
              30-day money back guarantee
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-primary mr-2" />
              Setup assistance included
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;