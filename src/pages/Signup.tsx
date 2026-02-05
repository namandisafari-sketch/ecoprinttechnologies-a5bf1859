import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Wrench, ChevronLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'customer' | 'seller'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresAccessCode, setRequiresAccessCode] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const isAdminSignup = sessionStorage.getItem('admin_access_verified');
    setRequiresAccessCode(!!isAdminSignup);
  }, [navigate, toast]);

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

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      navigate("/login");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center h-14 px-4 border-b border-border">
        <Link to="/" className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="ml-3 font-medium">Create Account</span>
      </header>

      <main className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/logo.jpeg" alt="Eco Hub" className="w-14 h-14 rounded-xl object-cover mx-auto mb-3" />
          <h1 className="text-xl font-bold">Join Eco Hub</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm">I want to</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as 'customer' | 'seller')} className="grid grid-cols-2 gap-3">
              <div>
                <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                <Label
                  htmlFor="customer"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-3 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                >
                  <User className="mb-1.5 h-5 w-5" />
                  <span className="text-xs font-medium">Buy Laptops</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="seller" id="seller" className="peer sr-only" />
                <Label
                  htmlFor="seller"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-3 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                >
                  <Wrench className="mb-1.5 h-5 w-5" />
                  <span className="text-xs font-medium">Sell / Repair</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

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

          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Signup;
