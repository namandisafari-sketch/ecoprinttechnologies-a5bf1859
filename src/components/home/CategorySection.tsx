import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";
import { Laptop, Gamepad2, Briefcase, GraduationCap, Recycle, Wrench, Monitor, Cpu, HardDrive, Battery, Zap, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Recycle,
  Wrench,
  Monitor,
  Cpu,
  HardDrive,
  Battery,
  Zap,
  Settings,
};

const CategorySection = () => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-6 px-4">
        <h2 className="text-base font-bold text-foreground mb-4">Shop by Category</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center min-w-[70px]">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="h-3 w-12 mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 px-4">
      <h2 className="text-base font-bold text-foreground mb-4">
        Shop by Category
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon || "Laptop"] || Laptop;
          
          return (
            <Link
              key={category.id}
              to={`/search?category=${category.id}`}
              className="flex flex-col items-center min-w-[70px] group"
            >
              <div className="w-14 h-14 mb-2 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors duration-200">
                <IconComponent className="h-6 w-6 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-200" />
              </div>
              <span className="text-xs font-medium text-foreground text-center line-clamp-2">
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
