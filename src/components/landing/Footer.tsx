import storvoLogo from "@/assets/storvo-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-card py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <img src={storvoLogo} alt="Storvo" className="h-6" />
          </div>

          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Support</a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Storvo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
