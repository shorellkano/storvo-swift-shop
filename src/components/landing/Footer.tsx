import { useNavigate, Link } from "react-router-dom";
import storvoLogo from "@/assets/storvo-logo.png";
import { Phone, Mail, Instagram } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div>
            <button onClick={() => navigate("/")} className="flex items-center">
              <img
                src={storvoLogo}
                alt="Storvo"
                className="h-12 w-auto shrink-0 rounded-md border border-border/60 bg-card/80 p-1 shadow-sm"
              />
            </button>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The simplest way for social sellers to create an online store, accept payments, and manage orders.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Storvo. All rights reserved.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Powered by LHF Studio</p>
          </div>

          {/* Links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Platform</p>
            <div className="space-y-2">
              <a href="#features" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
              <a href="#pricing" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
              <Link to="/legal/terms" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Terms of Service</Link>
              <Link to="/legal/privacy" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Privacy Policy</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Contact</p>
            <div className="space-y-3">
              <a
                href="tel:+2347071042782"
                className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                +234 707 104 2782
              </a>
              <a
                href="mailto:help@storvo.co"
                className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                help@storvo.co
              </a>
              <a
                href="https://instagram.com/storvo.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Instagram className="h-4 w-4 shrink-0 text-primary" />
                @storvo.co
              </a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
