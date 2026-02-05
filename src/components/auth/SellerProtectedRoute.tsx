 import { Navigate } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { Loader2 } from "lucide-react";
 
 interface SellerProtectedRouteProps {
   children: React.ReactNode;
 }
 
 const SellerProtectedRoute = ({ children }: SellerProtectedRouteProps) => {
   const { user, isLoading, isSeller, isAdmin } = useAuth();
 
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/login" replace />;
   }
 
   // Allow sellers and admins
   if (!isSeller && !isAdmin) {
     return <Navigate to="/" replace />;
   }
 
   return <>{children}</>;
 };
 
 export default SellerProtectedRoute;