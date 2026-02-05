import { Link } from "react-router-dom";

const brands = [
  { name: "HP", query: "HP" },
  { name: "Dell", query: "Dell" },
  { name: "Lenovo", query: "Lenovo" },
  { name: "Apple", query: "MacBook" },
  { name: "Asus", query: "Asus" },
  { name: "Acer", query: "Acer" },
];

const BrandsSection = () => {
  return (
    <section className="py-6 px-4">
      <h2 className="text-base font-bold text-foreground mb-4">
        Shop by Brand
      </h2>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {brands.map((brand) => (
          <Link
            key={brand.name}
            to={`/search?q=${encodeURIComponent(brand.query)}`}
            className="flex-shrink-0 px-5 py-2.5 bg-muted rounded-full text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BrandsSection;
