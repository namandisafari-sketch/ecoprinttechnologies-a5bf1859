const brands = [
  { name: "Apple", logo: "🍎" },
  { name: "Samsung", logo: "📱" },
  { name: "Xiaomi", logo: "📲" },
  { name: "Huawei", logo: "📱" },
  { name: "Tecno", logo: "📱" },
  { name: "Infinix", logo: "📱" },
  { name: "Oppo", logo: "📱" },
  { name: "Realme", logo: "📱" },
];

const BrandsSection = () => {
  return (
    <section className="py-12 border-y border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
          Trusted by all major brands
        </h3>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {brand.logo}
              </span>
              <span className="font-semibold text-lg">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
