import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const accessCodeSchema = z.string()
  .min(1, "Access code is required")
  .max(20, "Access code is too long")
  .regex(/^[a-zA-Z0-9]+$/, "Access code can only contain letters and numbers");

const AccessCodeDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate input
    const validation = accessCodeSchema.safeParse(accessCode);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_admin_access_code', {
        input_code: accessCode
      });

      if (rpcError) {
        throw rpcError;
      }

      if (data === true) {
        // Set session flag for access
        sessionStorage.setItem('admin_access_verified', 'true');
        setIsOpen(false);
        setAccessCode("");
        navigate("/login");
      } else {
        setError("Invalid access code");
        toast({
          title: "Access Denied",
          description: "The access code you entered is incorrect.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error verifying access code:", err);
      setError("Failed to verify access code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setAccessCode("");
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Admin Access</DialogTitle>
          <DialogDescription className="text-center">
            Enter the access code to continue to the admin portal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              type="password"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setError("");
              }}
              className={error ? "border-destructive" : ""}
              autoComplete="off"
              maxLength={20}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Access
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccessCodeDialog;
