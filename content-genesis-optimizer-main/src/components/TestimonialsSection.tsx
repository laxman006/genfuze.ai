import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Marketing Director",
      company: "TechFlow Inc",
      avatar: "SC",
      content: "ContentAI transformed our content strategy completely. The semantic matching feature helped us identify gaps we never knew existed. Our organic traffic increased by 150% in just 3 months.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez", 
      role: "SEO Specialist",
      company: "Digital Growth Labs",
      avatar: "MR",
      content: "The automated browser technology is a game-changer. It's like having an SEO expert working 24/7 to optimize our content for AI search engines. The GEO features are incredibly advanced.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Brand Manager", 
      company: "Innovate Solutions",
      avatar: "EW",
      content: "We saw immediate improvements in our content's discoverability. The multi-AI approach gives us insights we couldn't get anywhere else. It's like having a crystal ball for content performance.",
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Customer Success
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            Trusted by{" "}
            <span className="text-primary">content creators</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            See how leading brands are using ContentAI to revolutionize their content strategy 
            and dominate AI-powered search results.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-glow-card transition-all duration-300 relative"
            >
              <CardContent className="p-6">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-primary fill-current" />
                  ))}
                </div>

                <p className="text-gray-800 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-700">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="flex justify-center items-center space-x-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-primary fill-current" />
            <span className="font-semibold">4.9/5</span>
            <span>•</span>
            <span>Based on 200+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;