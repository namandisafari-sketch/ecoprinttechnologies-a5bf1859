import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Laptop, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Eco Print Technologies" className="w-10 h-10 rounded-lg object-contain" />
              <div>
                <h3 className="font-bold text-lg">Eco Print</h3>
                <p className="text-xs text-secondary-foreground/70">Technologies Ltd</p>
              </div>
            </div>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Your trusted tech marketplace at Suncity Mall, Kampala. 
              Find your dream laptop at affordable prices with expert technician support.
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
              <li><a href="/search" className="text-secondary-foreground/70 hover:text-primary transition-colors">All Laptops</a></li>
              <li><a href="/search?q=gaming" className="text-secondary-foreground/70 hover:text-primary transition-colors">Gaming Laptops</a></li>
              <li><a href="/search?q=business" className="text-secondary-foreground/70 hover:text-primary transition-colors">Business Laptops</a></li>
              <li><a href="/search?q=student" className="text-secondary-foreground/70 hover:text-primary transition-colors">Student Laptops</a></li>
              <li><a href="/search?q=refurbished" className="text-secondary-foreground/70 hover:text-primary transition-colors">Refurbished</a></li>
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
                <span>+256 702 365 176 / +256 783 393 721</span>
              </li>
              <li className="flex items-center gap-3 text-secondary-foreground/70">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:ecoprinttechnologies2020@gmail.com" className="hover:text-primary transition-colors">
                  ecoprinttechnologies2020@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-secondary-foreground/70">
                <Globe className="h-4 w-4 text-primary" />
                <a href="https://www.ecoprinttechnologies.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  www.ecoprinttechnologies.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-secondary-foreground/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>F2-4 Suncity Plaza<br />Kampala Road, Kampala, Uganda</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/50">
            © 2025 Eco Print Technologies Ltd. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-secondary-foreground/50">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10 mt-4 pt-4 text-center">
          <a
            href="https://www.kabejjasystems.store"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-secondary-foreground/40 hover:text-primary transition-colors"
          >
            Powered by Kabejja Systems
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
