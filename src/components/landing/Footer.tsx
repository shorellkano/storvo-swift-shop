import { useNavigate, Link } from "react-router-dom";
import storvoLogo from "@/assets/storvo-logo.png";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <button onClick={() => navigate("/")} className="flex items-center">
            <img src={storvoLogo} alt="Storvo" className="h-12 w-auto shrink-0 rounded-md border border-border/60 bg-card/80 p-1 shadow-sm" />
          </button>

          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
            <Link to="/legal/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Terms</Link>
            <Link to="/legal/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Privacy</Link>
          </div>

          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>© {new Date().getFullYear()} Storvo. All rights reserved.</p>
            <p className="mt-1">Powered by LHF Studio</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
