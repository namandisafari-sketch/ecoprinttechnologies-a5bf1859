import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, userRole, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      setTimeout(() => {
        setIsLoading(false);
        const isAdminAccess = sessionStorage.getItem('admin_access_verified');
        if (isAdminAccess) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 500);
      return;
    }
  };

  useEffect(() => {
    if (!isLoading && userRole) {
      const isAdminAccess = sessionStorage.getItem('admin_access_verified');
      if (isAdmin && isAdminAccess) {
        navigate("/admin");
      } else if (isSeller) {
        navigate("/seller");
      }
    }
  }, [userRole, isAdmin, isSeller, navigate, isLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center h-14 px-4 border-b border-border">
        <Link to="/" className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="ml-3 font-medium">Sign In</span>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="Eco Hub" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
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
              className="h-12"
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Login;
