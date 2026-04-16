import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import storvoLogo from "@/assets/storvo-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <button onClick={() => navigate("/")} className="flex items-center">
          <img src={storvoLogo} alt="Storvo" className="h-12 w-auto shrink-0 rounded-md border border-border/60 bg-card/80 p-1 shadow-sm" />
        </button>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            data-testid="button-login-nav"
          >
            Log in
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={() => navigate("/auth?mode=signup")}
            data-testid="button-create-store-nav"
          >
            Create Store
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
