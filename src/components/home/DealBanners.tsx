import { Gift, ArrowRight, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const DealBanners = () => {
  return (
    <section className="py-4 md:py-6 px-4">
      <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {/* Deal 1 */}
        <Link to="/search?q=Sale" className="flex-shrink-0 w-[200px] md:w-auto">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 md:p-5 h-full">
            <div className="p-1.5 bg-primary-foreground/20 rounded-lg inline-block mb-2">
              <Gift className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-primary-foreground mb-0.5">
              Awoof Deals
            </h4>
            <p className="text-[10px] md:text-xs text-primary-foreground/80 mb-2">
              Up to 40% Off select items
            </p>
            <span className="text-[10px] md:text-xs font-medium text-primary-foreground/90 flex items-center gap-1">
              Shop Now <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Deal 2 */}
        <Link to="/search?q=new" className="flex-shrink-0 w-[200px] md:w-auto">
          <div className="bg-gradient-to-br from-accent to-accent/80 rounded-xl p-4 md:p-5 h-full">
            <div className="p-1.5 bg-accent-foreground/20 rounded-lg inline-block mb-2">
              <Star className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-accent-foreground mb-0.5">
              New Arrivals
            </h4>
            <p className="text-[10px] md:text-xs text-accent-foreground/80 mb-2">
              Latest laptops just landed
            </p>
            <span className="text-[10px] md:text-xs font-medium text-accent-foreground/90 flex items-center gap-1">
              Explore <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Deal 3 */}
        <Link to="/search" className="flex-shrink-0 w-[200px] md:w-auto">
          <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-xl p-4 md:p-5 h-full border border-border">
            <div className="p-1.5 bg-secondary-foreground/10 rounded-lg inline-block mb-2">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-secondary-foreground mb-0.5">
              Top Picks
            </h4>
            <p className="text-[10px] md:text-xs text-secondary-foreground/70 mb-2">
              Popular choices this week
            </p>
            <span className="text-[10px] md:text-xs font-medium text-primary flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default DealBanners;
