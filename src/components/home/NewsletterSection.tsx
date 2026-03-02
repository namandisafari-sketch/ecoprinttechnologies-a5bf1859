import { useState } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already subscribed!", description: "This email is already on our list." });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Subscribed!", description: "You'll receive our latest deals and offers." });
      }

      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch {
      toast({ title: "Error", description: "Failed to subscribe. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-6 md:py-10 px-4 max-w-7xl mx-auto">
      <div className="bg-secondary rounded-xl md:rounded-2xl p-6 md:p-10 lg:p-12 text-center md:text-left">
        <div className="max-w-3xl mx-auto md:flex md:items-center md:justify-between md:gap-8">
          <div className="mb-4 md:mb-0 md:flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-secondary-foreground">
                Get Exclusive Deals
              </h3>
            </div>
            <p className="text-xs md:text-sm text-secondary-foreground/70">
              Subscribe and be the first to know about flash sales, new arrivals & special offers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 md:flex-1 max-w-md mx-auto md:mx-0">
            <div className="relative flex-1">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 md:h-11 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40"
                required
              />
            </div>
            <Button
              type="submit"
              className="h-10 md:h-11 px-4 md:px-6"
              disabled={isSubscribed || isLoading}
            >
              {isSubscribed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <>
                  <span className="hidden sm:inline mr-1.5">Subscribe</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
