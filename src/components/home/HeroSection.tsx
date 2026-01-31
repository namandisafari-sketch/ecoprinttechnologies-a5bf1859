import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, Clock } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Hero Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Phone repair services"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-2xl animate-fade-in">
          <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-medium mb-4">
            #1 Phone Parts Store in Uganda
          </span>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-foreground mb-4 leading-tight">
            Quality Phone Screens & 
            <span className="text-primary"> Spare Parts</span>
          </h1>
          
          <p className="text-lg text-secondary-foreground/80 mb-8 max-w-lg">
            Professional-grade phone screens, batteries, and spare parts for all major brands. 
            Fast delivery across Kampala and nationwide shipping.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button variant="hero" size="xl">
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="heroDark" size="xl">
              View Categories
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div className="flex items-center gap-2 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Quality Guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
