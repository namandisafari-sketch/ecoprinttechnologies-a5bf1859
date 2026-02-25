import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Desktop Sidebar - static in flow */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with hamburger menu */}
        <AdminMobileHeader />
        
        {/* Page Content */}
        <main className="flex-1">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
