import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'manager' | 'seller' | 'customer' | 'user' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  userRole: UserRole;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role?: 'seller' | 'customer') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const checkUserRole = async (userId: string): Promise<{ isAdmin: boolean; isSeller: boolean; role: UserRole }> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking user role:", error);
        return { isAdmin: false, isSeller: false, role: null };
      }

      if (!data || data.length === 0) {
        return { isAdmin: false, isSeller: false, role: 'customer' };
      }

      const roles = data.map(r => r.role);
      const isAdminOrManager = roles.includes('admin') || roles.includes('manager');
      const isSellerRole = roles.includes('seller');
      
      // Priority: admin > manager > seller > customer
      let primaryRole: UserRole = 'customer';
      if (roles.includes('admin')) primaryRole = 'admin';
      else if (roles.includes('manager')) primaryRole = 'manager';
      else if (roles.includes('seller')) primaryRole = 'seller';
      else if (roles.includes('customer')) primaryRole = 'customer';
      else if (roles.includes('user')) primaryRole = 'user';

      return { isAdmin: isAdminOrManager, isSeller: isSellerRole, role: primaryRole };
    } catch (error) {
      console.error("Error checking user role:", error);
      return { isAdmin: false, isSeller: false, role: null };
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            const { isAdmin, isSeller, role } = await checkUserRole(session.user.id);
            setIsAdmin(isAdmin);
            setIsSeller(isSeller);
            setUserRole(role);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSeller(false);
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { isAdmin, isSeller, role } = await checkUserRole(session.user.id);
        setIsAdmin(isAdmin);
        setIsSeller(isSeller);
        setUserRole(role);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string, role?: 'seller' | 'customer') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, requested_role: role || 'customer' },
        emailRedirectTo: window.location.origin,
      },
    });

    // If signup successful and we have a user, add their role
    if (!error && data.user && role) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role: role });
      
      if (roleError) {
        console.error("Error assigning role:", roleError);
      }
    }

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        isSeller,
        userRole,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
