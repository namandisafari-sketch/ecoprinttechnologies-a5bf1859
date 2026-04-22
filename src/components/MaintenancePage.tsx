import { Wrench } from "lucide-react";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Wrench className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">We'll Be Right Back</h1>
          <p className="text-muted-foreground">
            Our store is currently undergoing scheduled maintenance. We'll be back online shortly. Thank you for your patience!
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.png" alt="Eco Print Technologies" className="h-10 w-auto" />
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Need urgent help? Call us at{" "}
            <a href="tel:+256705154828" className="text-primary hover:underline">+256 705 154 828</a>
          </p>
        </div>
        <div className="pt-2">
          <a
            href="https://tennahubapps.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 hover:text-primary transition-colors"
          >
            Powered by Tennahub Technologies Limited
          </a>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
