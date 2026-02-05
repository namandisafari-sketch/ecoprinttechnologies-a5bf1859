import { Outlet } from "react-router-dom";
import SellerSidebar from "@/components/seller/SellerSidebar";

const SellerLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <SellerSidebar />
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;
