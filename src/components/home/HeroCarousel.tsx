import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  bgClass: string;
  image?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Eco Print Technologies",
    subtitle: "Top brands, expert repairs, unbeatable prices",
    cta: "Shop Now",
    ctaLink: "/search",
    bgClass: "from-secondary/95 via-secondary/80 to-secondary/95",
    image: heroBanner,
  },
  {
    id: 2,
    title: "Up to 30% Off",
    subtitle: "Refurbished laptops — tested & certified quality",
    cta: "View Deals",
    ctaLink: "/search?q=Sale",
    bgClass: "from-primary/90 via-primary/70 to-primary/90",
  },
  {
    id: 3,
    title: "Same-Day Repairs",
    subtitle: "Expert technicians, genuine parts, fast turnaround",
    cta: "Find Technicians",
    ctaLink: "/technicians",
    bgClass: "from-accent/90 via-accent/70 to-accent/90",
  },
  {
    id: 4,
    title: "Free Delivery",
    subtitle: "On orders above UGX 500,000 within Kampala",
    cta: "Start Shopping",
    ctaLink: "/search",
    bgClass: "from-secondary/95 via-secondary/80 to-secondary/95",
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {slide.image ? (
          <img src={slide.image} alt="" className="w-full h-full object-cover transition-opacity duration-500" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-b ${slide.bgClass}`} />
      </div>

      {/* Content */}
      <div className="relative px-4 py-10 md:py-16 lg:py-24">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto text-center md:text-left">
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-background/20 backdrop-blur-sm text-background rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4">
            Suncity Mall, Kampala
          </span>

          <h1
            key={slide.id}
            className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-4 lg:mb-6 leading-tight animate-fade-in"
          >
            {slide.title}
          </h1>

          <p
            key={`sub-${slide.id}`}
            className="text-sm md:text-base lg:text-lg text-white/80 mb-6 md:mb-8 max-w-lg animate-fade-in"
          >
            {slide.subtitle}
          </p>

          <Link
            to={slide.ctaLink}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 md:px-8 md:py-3 rounded-lg transition-colors text-sm md:text-base"
          >
            {slide.cta}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Navigation arrows - desktop only */}
      <button
        onClick={prev}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-background/30 backdrop-blur-sm hover:bg-background/50 text-white p-2 rounded-full transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-background/30 backdrop-blur-sm hover:bg-background/50 text-white p-2 rounded-full transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
