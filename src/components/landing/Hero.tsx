import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 gradient-hero" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] glow-indigo" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[500px] glow-purple" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-card">
            <Zap className="h-3.5 w-3.5 text-storvo-indigo" />
            Built for social commerce sellers
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Create your online store.{" "}
          <span className="bg-gradient-to-r from-storvo-indigo to-storvo-purple bg-clip-text text-transparent">
            Start selling in minutes.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          The simplest way for Instagram, TikTok, and WhatsApp sellers to launch a store, accept payments, and manage orders — all from your phone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button variant="hero" size="xl" className="group">
            <ShoppingBag className="h-5 w-5" />
            Create Your Free Store
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button variant="hero-outline" size="xl">
            See how it works
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 text-sm text-muted-foreground"
        >
          No credit card required · Free forever plan · Setup in 5 minutes
        </motion.p>

        {/* Store preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-card">
            <div className="rounded-xl bg-muted/50 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">luxehair.storvo.co</div>
                  <div className="text-xs text-muted-foreground">Your store is live ✨</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-card p-4 shadow-card">
                    <div className="mb-3 aspect-square rounded-lg bg-accent" />
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-primary/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
