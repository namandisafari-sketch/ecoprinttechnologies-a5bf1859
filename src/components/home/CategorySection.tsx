import { Laptop, Gamepad2, Briefcase, GraduationCap, Recycle, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    id: 1,
    name: "All Laptops",
    icon: Laptop,
    query: "All Laptops",
  },
  {
    id: 2,
    name: "Gaming",
    icon: Gamepad2,
    query: "Gaming Laptops",
  },
  {
    id: 3,
    name: "Business",
    icon: Briefcase,
    query: "Business Laptops",
  },
  {
    id: 4,
    name: "Student",
    icon: GraduationCap,
    query: "Student Laptops",
  },
  {
    id: 5,
    name: "Refurbished",
    icon: Recycle,
    query: "Refurbished",
  },
  {
    id: 6,
    name: "Repairs",
    icon: Wrench,
    path: "/technicians",
  },
];

const CategorySection = () => {
  return (
    <section className="py-6 px-4">
      <h2 className="text-base font-bold text-foreground mb-4">
        Categories
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={category.path || `/search?q=${encodeURIComponent(category.query || '')}`}
            className="flex flex-col items-center min-w-[70px] group"
          >
            <div className="w-14 h-14 mb-2 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors duration-200">
              <category.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-200" />
            </div>
            <span className="text-xs font-medium text-foreground text-center">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
