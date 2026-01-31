import { Smartphone, Battery, Cable, ShieldCheck, Wrench, Headphones } from "lucide-react";

const categories = [
  {
    id: 1,
    name: "Phone Screens",
    icon: Smartphone,
    count: 150,
    description: "LCD & OLED displays",
  },
  {
    id: 2,
    name: "Batteries",
    icon: Battery,
    count: 80,
    description: "Original & compatible",
  },
  {
    id: 3,
    name: "Chargers & Cables",
    icon: Cable,
    count: 120,
    description: "Fast charging solutions",
  },
  {
    id: 4,
    name: "Phone Cases",
    icon: ShieldCheck,
    count: 200,
    description: "Protection & style",
  },
  {
    id: 5,
    name: "Spare Parts",
    icon: Wrench,
    count: 300,
    description: "Repair components",
  },
  {
    id: 6,
    name: "Accessories",
    icon: Headphones,
    count: 90,
    description: "Enhance your device",
  },
];

const CategorySection = () => {
  return (
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Shop by Category
          </h2>
          <p className="text-muted-foreground">
            Find exactly what you need for your device
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <a
              key={category.id}
              href={`#${category.name.toLowerCase().replace(' ', '-')}`}
              className="group card-product bg-card p-6 text-center cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                <category.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 text-sm">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {category.description}
              </p>
              <span className="text-xs text-primary font-medium">
                {category.count}+ items
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
