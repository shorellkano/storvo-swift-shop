import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const MONTHLY_PRICE = 3500;
const YEARLY_PRICE = 30000; // ~₦2,500/mo — save 2+ months

const freeFeatures = [
  "Up to 10 products",
  "Storvo subdomain",
  "Paystack payments",
  "Order management",
  "WhatsApp sharing",
  "1% transaction fee",
];

const proFeatures = [
  "Unlimited products",
  "Custom domain",
  "Analytics dashboard",
  "Remove Storvo branding",
  "Priority support",
  "0% transaction fee",
];

const Pricing = () => {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  const proPrice = yearly ? YEARLY_PRICE : MONTHLY_PRICE;
  const proPeriod = yearly ? "/year" : "/month";
  const monthlyEquiv = yearly ? Math.round(YEARLY_PRICE / 12) : null;
  const savings = yearly ? Math.round(((MONTHLY_PRICE * 12 - YEARLY_PRICE) / (MONTHLY_PRICE * 12)) * 100) : 0;

  const formatPrice = (n: number) =>
    "₦" + n.toLocaleString("en-NG");

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-card">
      <div className="pointer-events-none absolute top-20 left-0 h-[500px] w-[500px] glow-primary opacity-30" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free and upgrade when you're ready. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border/60 bg-background p-1.5 shadow-card">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                !yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <AnimatePresence>
                {!yearly && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
                  >
                    Save {savings}%
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>

        <div className="mt-12 mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {/* Free plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="relative rounded-2xl border border-border/60 bg-background p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          >
            <h3 className="font-display text-xl font-bold text-foreground">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">Perfect for getting started</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-foreground">₦0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>

            <ul className="mt-8 space-y-3.5">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <Check className="h-3 w-3 flex-shrink-0 text-primary" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button variant="hero-outline" size="lg" className="mt-8 w-full" onClick={() => navigate("/auth")}>
              Start Free
            </Button>
          </motion.div>

          {/* Pro plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="relative rounded-2xl border border-primary/30 bg-background p-8 shadow-elevated ring-1 ring-primary/10 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="gradient-primary rounded-full px-4 py-1 text-xs font-bold text-primary-foreground shadow-button">
                Most Popular
              </span>
            </div>

            <h3 className="font-display text-xl font-bold text-foreground">Pro</h3>
            <p className="mt-1 text-sm text-muted-foreground">For serious sellers</p>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={yearly ? "yearly" : "monthly"}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="font-display text-4xl font-extrabold text-foreground">{formatPrice(proPrice)}</span>
                  <span className="text-muted-foreground">{proPeriod}</span>
                </motion.div>
              </AnimatePresence>
              {yearly && monthlyEquiv && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 flex items-center gap-1.5 text-sm text-emerald-600 font-medium"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {formatPrice(monthlyEquiv)}/mo · saves {formatPrice(MONTHLY_PRICE * 12 - YEARLY_PRICE)} vs monthly
                </motion.p>
              )}
            </div>

            <ul className="mt-8 space-y-3.5">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 flex-shrink-0 text-primary" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button variant="hero" size="lg" className="mt-8 w-full" onClick={() => navigate("/auth")}>
              Go Pro
            </Button>
            {yearly && (
              <p className="mt-2 text-center text-xs text-muted-foreground">Billed annually. Cancel anytime.</p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
