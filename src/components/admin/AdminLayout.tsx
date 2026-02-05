import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import AdminBottomNavigation from "@/components/admin/AdminBottomNavigation";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Desktop Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <AdminMobileHeader />
        
        {/* Page Content */}
        <main className="flex-1">
          <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <AdminBottomNavigation />
      </div>
    </div>
  );
};

export default AdminLayout;
