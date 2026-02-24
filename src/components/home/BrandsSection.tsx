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
    <section className="py-6 md:py-10 px-4">
      <h2 className="text-base md:text-xl lg:text-2xl font-bold text-foreground mb-4 md:mb-6">
        Shop by Brand
      </h2>
      
      <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {brands.map((brand) => (
          <Link
            key={brand.name}
            to={`/search?q=${encodeURIComponent(brand.query)}`}
            className="flex-shrink-0 px-5 py-2.5 md:px-0 md:py-4 bg-muted rounded-full md:rounded-xl text-sm md:text-base font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors md:text-center md:flex md:items-center md:justify-center"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BrandsSection;
