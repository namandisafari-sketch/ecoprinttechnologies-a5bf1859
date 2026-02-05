import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const PromoSection = () => {
  return (
    <section className="py-6 px-4">
      <div className="space-y-3">
        {/* Main promo */}
        <Link to="/search?q=Sale" className="block">
          <div className="relative overflow-hidden rounded-xl bg-secondary p-5">
            <div className="relative z-10">
              <span className="inline-block px-2 py-0.5 bg-primary rounded-full text-primary-foreground text-[10px] font-medium mb-2">
                LIMITED TIME
              </span>
              <h3 className="text-lg font-bold text-secondary-foreground mb-1">
                Up to 30% Off
              </h3>
              <p className="text-xs text-secondary-foreground/70 mb-3">
                On refurbished laptops
              </p>
              <div className="inline-flex items-center text-xs font-medium text-primary">
                Shop Now
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </div>
        </Link>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary p-4">
            <div className="p-1.5 bg-primary-foreground/20 rounded-lg inline-block mb-2">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <h4 className="text-sm font-semibold text-primary-foreground mb-0.5">
              Free Delivery
            </h4>
            <p className="text-[10px] text-primary-foreground/80">
              On orders above UGX 500k
            </p>
          </div>

          <Link to="/technicians" className="block">
            <div className="rounded-xl bg-muted p-4 border border-border h-full">
              <div className="p-1.5 bg-primary/10 rounded-lg inline-block mb-2">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-0.5">
                Same Day Repair
              </h4>
              <p className="text-[10px] text-muted-foreground">
                Quick turnaround
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
