import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Wrench, Store, Phone } from "lucide-react";

const SellerSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopNumber, setShopNumber] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!businessName.trim() || !phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Business name and phone number are required.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Sign up the user with seller role
    const { error } = await signUp(email, password, fullName, 'seller');

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Get the newly created user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Create seller profile
      const { error: profileError } = await supabase
        .from("seller_profiles")
        .insert({
          user_id: user.id,
          business_name: businessName.trim(),
          phone: phone.trim(),
          shop_number: shopNumber.trim() || null,
          description: description.trim() || null,
          is_active: true,
        });

      if (profileError) {
        console.error("Error creating seller profile:", profileError);
        // Don't block signup, they can complete profile later
      }
    }

    toast({
      title: "Account Created!",
      description: "Please check your email to verify your account.",
    });
    navigate("/login");

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center h-14 px-4 border-b border-border">
        <Link to="/" className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="ml-3 font-medium">Become a Seller</span>
      </header>

      <main className="flex-1 px-6 py-6 overflow-y-auto pb-20">
        {/* Logo & Intro */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Wrench className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Join as a Technician</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Offer repair services & sell products
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          {/* Account Info Section */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Account Information
            </p>
            
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">
                At least 6 characters
              </p>
            </div>
          </div>

          {/* Business Info Section */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Business Details
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-sm flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                Business Name
              </Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Tech Repairs Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shopNumber" className="text-sm">
                Shop Number <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="shopNumber"
                type="text"
                placeholder="e.g. 12, G-05"
                value={shopNumber}
                onChange={(e) => setShopNumber(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">
                About Your Services <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Tell customers what you specialize in..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 mt-4" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Seller Account
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-sm text-muted-foreground text-center mt-2">
          Just want to buy?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up as customer
          </Link>
        </p>
      </main>
    </div>
  );
};

export default SellerSignup;
