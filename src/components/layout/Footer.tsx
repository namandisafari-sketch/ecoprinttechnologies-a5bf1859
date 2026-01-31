import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">SW</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Sir Wanda</h3>
                <p className="text-xs text-secondary-foreground/70">Phone Care</p>
              </div>
            </div>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Uganda's trusted source for quality phone screens, batteries, 
              and spare parts. Professional repair services available.
            </p>
            <div className="flex gap-3">
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
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Phone Screens</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Batteries</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Chargers & Cables</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Spare Parts</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Accessories</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">FAQs</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Returns Policy</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Track Order</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-secondary-foreground/70">
                <Phone className="h-4 w-4 text-primary" />
                <span>+256 705 154 828</span>
              </li>
              <li className="flex items-center gap-3 text-secondary-foreground/70">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@sirwanda.com</span>
              </li>
              <li className="flex items-start gap-3 text-secondary-foreground/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Gayaza, opp Extra Care Pharmacy<br />Kampala, Uganda</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/50">
            © 2025 Sir Wanda Phone Care. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-secondary-foreground/50">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
