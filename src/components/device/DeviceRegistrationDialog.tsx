import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Smartphone, Key, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onRegister: (name: string) => Promise<{ recovery_code: string }>;
  onRecover: (code: string) => Promise<any>;
}

const DeviceRegistrationDialog = ({ open, onRegister, onRecover }: Props) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"register" | "recover">("register");
  const [name, setName] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showRecoveryResult, setShowRecoveryResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      toast({ title: "Enter your name", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await onRegister(name.trim());
      setShowRecoveryResult(result.recovery_code);
    } catch (err) {
      toast({ title: "Registration failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async () => {
    if (!recoveryCode.trim()) {
      toast({ title: "Enter your recovery code", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await onRecover(recoveryCode.trim());
      toast({ title: "Device recovered!", description: "Your orders are now linked to this device." });
    } catch (err) {
      toast({ title: "Recovery failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(showRecoveryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show recovery code after successful registration
  if (showRecoveryResult) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Key className="h-7 w-7 text-green-600" />
            </div>
            <DialogTitle>Save Your Recovery Code</DialogTitle>
            <DialogDescription>
              Write this code down or screenshot it. You'll need it to access your orders on a new phone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-mono font-bold tracking-widest">{showRecoveryResult}</p>
          </div>
          <Button onClick={copyCode} variant="outline" className="w-full">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied!" : "Copy Code"}
          </Button>
          <Button onClick={() => setShowRecoveryResult("")} className="w-full">
            I've Saved It — Continue
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle>Welcome to Sir Wanda's</DialogTitle>
          <DialogDescription>
            {mode === "register"
              ? "Let's set up your device so you can track orders easily."
              : "Enter your recovery code to restore your orders on this device."}
          </DialogDescription>
        </DialogHeader>

        {mode === "register" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Your Full Name</Label>
              <Input
                id="reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                className="h-11"
              />
            </div>
            <Button onClick={handleRegister} disabled={isLoading} className="w-full h-11">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Started
            </Button>
            <button
              onClick={() => setMode("recover")}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              I have a recovery code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rec-code">Recovery Code</Label>
              <Input
                id="rec-code"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="e.g., AB3K7YWZ"
                className="h-11 text-center font-mono text-lg tracking-widest"
                maxLength={8}
              />
            </div>
            <Button onClick={handleRecover} disabled={isLoading} className="w-full h-11">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Recover My Data
            </Button>
            <button
              onClick={() => setMode("register")}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              I'm a new user
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeviceRegistrationDialog;
