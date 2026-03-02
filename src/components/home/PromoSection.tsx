import { ArrowRight, Truck, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const PromoSection = () => {
  return (
    <section className="py-6 md:py-10 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-3 md:gap-5">
        {/* Main promo */}
        <Link to="/search?q=Sale" className="block md:flex-1">
          <div className="relative overflow-hidden rounded-xl bg-secondary p-5 md:p-8 lg:p-10 h-full">
            <div className="relative z-10">
              <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-primary rounded-full text-primary-foreground text-[10px] md:text-xs font-medium mb-2 md:mb-3">
                LIMITED TIME
              </span>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-secondary-foreground mb-1 md:mb-2">
                Up to 30% Off
              </h3>
              <p className="text-xs md:text-sm text-secondary-foreground/70 mb-3 md:mb-5">
                On refurbished laptops
              </p>
              <div className="inline-flex items-center text-xs md:text-sm font-medium text-primary">
                Shop Now
                <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 md:w-40 md:h-40 bg-primary/20 rounded-full blur-2xl" />
          </div>
        </Link>

        {/* Feature cards */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-5 md:w-72 lg:w-80">
          <div className="rounded-xl bg-primary p-4 md:p-5">
            <div className="p-1.5 md:p-2 bg-primary-foreground/20 rounded-lg inline-block mb-2">
              <Truck className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
            <h4 className="text-sm md:text-base font-semibold text-primary-foreground mb-0.5">
              Free Delivery
            </h4>
            <p className="text-[10px] md:text-xs text-primary-foreground/80">
              On orders above UGX 500k
            </p>
          </div>

          <Link to="/technicians" className="block">
            <div className="rounded-xl bg-muted p-4 md:p-5 border border-border h-full">
              <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg inline-block mb-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <h4 className="text-sm md:text-base font-semibold text-foreground mb-0.5">
                Same Day Repair
              </h4>
              <p className="text-[10px] md:text-xs text-muted-foreground">
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
