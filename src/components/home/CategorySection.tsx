import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";
import { Laptop, Gamepad2, Briefcase, GraduationCap, Recycle, Wrench, Monitor, Cpu, HardDrive, Battery, Zap, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop, Gamepad2, Briefcase, GraduationCap, Recycle, Wrench, Monitor, Cpu, HardDrive, Battery, Zap, Settings,
};

const CategorySection = () => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-6 md:py-10 px-4 max-w-7xl mx-auto">
        <h2 className="text-base md:text-xl lg:text-2xl font-bold text-foreground mb-4 md:mb-6">Shop by Category</h2>
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center min-w-[70px] md:min-w-0">
              <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-2xl" />
              <Skeleton className="h-3 w-12 mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-6 md:py-10 px-4 max-w-7xl mx-auto">
      <h2 className="text-base md:text-xl lg:text-2xl font-bold text-foreground mb-4 md:mb-6">
        Shop by Category
      </h2>

      <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon || "Laptop"] || Laptop;
          
          return (
            <Link
              key={category.id}
              to={`/search?category=${category.id}`}
              className="flex flex-col items-center min-w-[70px] md:min-w-0 md:p-4 md:bg-muted/50 md:rounded-xl md:hover:bg-primary/10 md:transition-colors group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 mb-2 bg-muted md:bg-background rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors duration-200">
                <IconComponent className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-200" />
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground text-center line-clamp-2">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySection;
