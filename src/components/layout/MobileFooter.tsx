import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const MobileFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground pb-20">
      <div className="px-4 py-8">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="/logo.png" alt="Eco Print Technologies" className="w-10 h-10 rounded-lg object-contain" />
            <div className="text-left">
              <h3 className="font-bold text-lg">Eco Print</h3>
              <p className="text-xs text-secondary-foreground/70">Technologies Ltd</p>
            </div>
          </div>
          <p className="text-secondary-foreground/70 text-sm max-w-xs mx-auto">
            Your trusted laptop marketplace at Suncity Mall, Kampala.
          </p>
        </div>

        {/* Contact - Compact */}
        <div className="flex flex-col items-center gap-3 mb-6 text-sm">
          <a href="tel:+256705154828" className="flex items-center gap-2 text-secondary-foreground/70 hover:text-primary transition-colors">
            <Phone className="h-4 w-4 text-primary" />
            <span>+256 702 365 176 / +256 783 393 721</span>
          </a>
          <a href="mailto:ecoprinttechnologies2020@gmail.com" className="flex items-center gap-2 text-secondary-foreground/70 hover:text-primary transition-colors">
            <Mail className="h-4 w-4 text-primary" />
            <span>ecoprinttechnologies2020@gmail.com</span>
          </a>
          <div className="flex items-center gap-2 text-secondary-foreground/70">
            <MapPin className="h-4 w-4 text-primary" />
            <span>F2-4 Suncity Plaza, Kampala Road, Kampala</span>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-3 mb-6">
          <a href="#" className="p-2 bg-secondary-foreground/10 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
            <Facebook className="h-5 w-5" />
          </a>
          <a href="#" className="p-2 bg-secondary-foreground/10 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#" className="p-2 bg-secondary-foreground/10 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
            <Twitter className="h-5 w-5" />
          </a>
        </div>

        {/* Quick Links - Horizontal */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-secondary-foreground/50 mb-4">
          <Link to="/search" className="hover:text-primary transition-colors">All Laptops</Link>
          <Link to="/track-order" className="hover:text-primary transition-colors">Track Order</Link>
          <Link to="/technicians" className="hover:text-primary transition-colors">Technicians</Link>
        </div>

        {/* Copyright */}
        <div className="text-center space-y-2">
          <p className="text-xs text-secondary-foreground/50">
            © 2025 Eco Print Technologies Ltd. All rights reserved.
          </p>
          <a
            href="https://www.kabejjasystems.store"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-secondary-foreground/40 hover:text-primary transition-colors inline-block"
          >
            Powered by Kabejja Systems
          </a>
        </div>
      </div>
    </footer>
  );
};

export default MobileFooter;
