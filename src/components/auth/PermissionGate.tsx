import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PermissionGateProps {
  children: ReactNode;
  /** Permission page key from the staff permissions map (e.g. "products"). Omit to require admin only. */
  page?: string;
  /** Required action; defaults to "view". */
  action?: "view" | "create" | "edit" | "delete";
  /** When true, only admins/managers may pass — staff permissions are ignored. */
  adminOnly?: boolean;
}

const PermissionGate = ({ children, page, action = "view", adminOnly = false }: PermissionGateProps) => {
  const { user, isLoading, isAdmin, staffActive, can } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!staffActive) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-3">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Account Disabled</h1>
        <p className="text-muted-foreground max-w-md">Your staff account is currently inactive. Contact an administrator to regain access.</p>
        <Button asChild variant="outline"><Link to="/">Return to store</Link></Button>
      </div>
    );
  }

  const allowed = adminOnly ? isAdmin : (page ? can(page, action) : isAdmin);

  if (!allowed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-3">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to {action} this page. Ask an administrator to grant you access.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/admin">Admin Home</Link></Button>
          <Button asChild><Link to="/">Return to store</Link></Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionGate;
