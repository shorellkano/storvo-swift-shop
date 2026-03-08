import storvoLogo from "@/assets/storvo-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={storvoLogo} alt="Storvo" className="h-10 w-auto shrink-0" />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">Storvo</span>
          </div>

          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Support</a>
          </div>

          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>© {new Date().getFullYear()} Storvo. All rights reserved.</p>
            <p className="mt-1">Powered by Upbeatz Marcom</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
