import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Shield, Clock, Zap, Star, Heart } from "lucide-react";
import AnimatedBadge from "./AnimatedBadge";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 gradient-hero" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[700px] w-[700px] glow-primary opacity-60" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[500px] glow-purple opacity-40" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] glow-cyan opacity-20" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left side: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <AnimatedBadge />

            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Turn your social media into a{" "}
              <span className="text-gradient">store.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Launch your online store in minutes and sell directly from Instagram, WhatsApp, and TikTok. No coding, no complexity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="hero" size="xl" className="group" onClick={() => navigate("/auth")}>
                <ShoppingBag className="h-5 w-5" />
                Create Your Free Store
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="hero-outline" size="xl" onClick={scrollToHowItWorks}>
                See how it works
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-storvo-cyan" />
                Secure Paystack payments
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-storvo-cyan" />
                Setup in 5 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-storvo-cyan" />
                Free forever plan
              </span>
            </div>
          </motion.div>

          {/* Right side: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Floating glow behind phone */}
              <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-primary/20 via-storvo-purple/10 to-storvo-cyan/10 blur-3xl" />

              {/* Phone frame */}
              <div className="relative w-[300px] rounded-[2.5rem] border-[8px] border-foreground/10 bg-card p-1 shadow-elevated animate-float sm:w-[320px]">
                {/* Notch */}
                <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-foreground/10" />

                {/* Store content */}
                <div className="rounded-[2rem] bg-background p-4">
                  {/* Store header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-button">
                      <ShoppingBag className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">LuxeHair Store</div>
                      <div className="text-[10px] text-muted-foreground">luxehair.storvo.co</div>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-medium text-foreground">4.9</span>
                    </div>
                  </div>

                  {/* Product grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { name: "Silk Press Bundle", price: "₦25,000", gradient: "from-primary/15 to-storvo-purple/10" },
                      { name: "Deep Wave 18\"", price: "₦45,000", gradient: "from-storvo-purple/15 to-storvo-cyan/10" },
                      { name: "Frontal Wig Cap", price: "₦12,500", gradient: "from-storvo-cyan/15 to-primary/10" },
                      { name: "Closure Bundle", price: "₦35,000", gradient: "from-primary/10 to-storvo-purple/15" },
                    ].map((product, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="rounded-xl bg-card p-2.5 shadow-card"
                      >
                        <div className={`mb-2 aspect-square rounded-lg bg-gradient-to-br ${product.gradient} flex items-center justify-center`}>
                          <ShoppingBag className="h-6 w-6 text-muted-foreground/25" />
                        </div>
                        <p className="text-[11px] font-semibold text-foreground truncate">{product.name}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[10px] font-bold text-primary">{product.price}</p>
                          <Heart className="h-3 w-3 text-muted-foreground/30" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom action */}
                  <div className="mt-3 rounded-xl gradient-primary p-2.5 text-center shadow-button">
                    <span className="text-xs font-semibold text-primary-foreground">View All Products →</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
