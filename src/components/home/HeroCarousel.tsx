import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string;
  cta_link: string;
  bg_class: string;
  image_url: string | null;
}

const fetchSlides = async (): Promise<Slide[]> => {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data || [];
};

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  const { data: slides = [] } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: fetchSlides,
  });

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, slides.length]);

  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-secondary">
        <div className="px-4 py-10 md:py-16 lg:py-24 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-secondary-foreground">Eco Print Technologies</h1>
        </div>
      </section>
    );
  }

  const slide = slides[current % slides.length];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {slide.image_url ? (
          <img src={slide.image_url} alt="" className="w-full h-full object-cover transition-opacity duration-500" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-b ${slide.bg_class}`} />
      </div>

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
            to={slide.cta_link}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 md:px-8 md:py-3 rounded-lg transition-colors text-sm md:text-base"
          >
            {slide.cta_text}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

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
