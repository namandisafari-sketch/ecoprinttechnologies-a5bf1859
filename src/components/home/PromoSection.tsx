import { Button } from "@/components/ui/button";
import { ArrowRight, Percent, Truck, Clock } from "lucide-react";

const PromoSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Big promo card */}
          <div className="relative overflow-hidden rounded-2xl bg-secondary p-8 md:p-10 group">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary rounded-full text-primary-foreground text-sm font-medium mb-4">
                <Percent className="h-4 w-4" />
                Limited Time Offer
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-secondary-foreground mb-3">
                Up to 30% Off on
                <br />
                Phone Screens
              </h3>
              <p className="text-secondary-foreground/70 mb-6 max-w-sm">
                Get premium quality OLED and LCD screens at unbeatable prices. 
                Valid while stocks last!
              </p>
              <Button variant="hero" size="lg">
                Shop Screens
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {/* Decorative element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </div>

          {/* Smaller promo cards */}
          <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-2xl bg-primary p-6 md:p-8 group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="p-2 bg-primary-foreground/20 rounded-lg inline-block mb-3">
                    <Truck className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h4 className="text-xl font-bold text-primary-foreground mb-2">
                    Free Delivery
                  </h4>
                  <p className="text-primary-foreground/80 text-sm">
                    On orders above UGX 100,000 within Kampala
                  </p>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-foreground/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-muted p-6 md:p-8 group border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="p-2 bg-primary/10 rounded-lg inline-block mb-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-2">
                    Same Day Repair
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Drop off your device and pick it up the same day
                  </p>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
