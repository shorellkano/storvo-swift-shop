import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Tag } from "lucide-react";

const MONTHLY_PRICE = 3500;
const YEARLY_PRICE = 30000;
const MONTHLY_EQUIV = Math.round(YEARLY_PRICE / 12);
const YEARLY_SAVING = MONTHLY_PRICE * 12 - YEARLY_PRICE;
const SAVING_PCT = Math.round((YEARLY_SAVING / (MONTHLY_PRICE * 12)) * 100);

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

const fmt = (n: number) => "₦" + n.toLocaleString("en-NG");

const Pricing = () => {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

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
        </motion.div>

        <div className="mt-16 mx-auto grid max-w-3xl gap-8 md:grid-cols-2">

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
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Check className="h-3 w-3 text-primary" />
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
            className="relative flex flex-col rounded-2xl border border-primary/30 bg-background p-8 shadow-elevated ring-1 ring-primary/10 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="gradient-primary rounded-full px-4 py-1 text-xs font-bold text-primary-foreground shadow-button">
                Most Popular
              </span>
            </div>

            {/* Pro heading + sliding toggle side by side */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Pro</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">For serious sellers</p>
              </div>

              {/* Sliding pill toggle */}
              <div
                className="relative flex h-9 w-[100px] shrink-0 cursor-pointer items-center rounded-full border border-border/60 bg-muted p-1 transition-colors"
                onClick={() => setYearly((v) => !v)}
                role="switch"
                aria-checked={yearly}
                data-testid="toggle-yearly-billing"
                title={yearly ? "Switch to monthly" : "Switch to yearly - save 29%"}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className={`absolute h-7 w-[46px] rounded-full shadow-sm ${yearly ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ left: yearly ? "calc(100% - 46px - 4px)" : "4px" }}
                />
                <span className={`relative z-10 flex-1 text-center text-[10px] font-bold transition-colors ${!yearly ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  Mo
                </span>
                <span className={`relative z-10 flex-1 text-center text-[10px] font-bold transition-colors ${yearly ? "text-white" : "text-muted-foreground"}`}>
                  Yr
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mt-6 min-h-[64px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={yearly ? "yr" : "mo"}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-foreground">
                      {yearly ? fmt(YEARLY_PRICE) : fmt(MONTHLY_PRICE)}
                    </span>
                    <span className="text-muted-foreground">{yearly ? "/year" : "/month"}</span>
                  </div>
                  {yearly && (
                    <p className="mt-1 text-sm font-medium text-emerald-600">
                      {fmt(MONTHLY_EQUIV)}/mo - billed annually
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <ul className="mt-6 space-y-3.5 flex-1">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Yearly savings detail - shown when yearly is active */}
            <AnimatePresence>
              {yearly && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <Tag className="h-3.5 w-3.5" />
                      Yearly plan breakdown
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-emerald-700">Monthly equivalent</span>
                      <span className="font-semibold text-emerald-900 text-right">{fmt(MONTHLY_EQUIV)}/mo</span>
                      <span className="text-emerald-700">Billed as one payment</span>
                      <span className="font-semibold text-emerald-900 text-right">{fmt(YEARLY_PRICE)}/yr</span>
                      <span className="text-emerald-700">You save</span>
                      <span className="font-bold text-emerald-700 text-right">{fmt(YEARLY_SAVING)} ({SAVING_PCT}% off)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <div className="mt-5">
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                <Zap className="mr-2 h-4 w-4" />
                {yearly ? "Go Pro Yearly" : "Go Pro"}
              </Button>
              <AnimatePresence mode="wait">
                {!yearly ? (
                  <motion.p
                    key="monthly-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 text-center text-[11px] text-muted-foreground"
                  >
                    Slide to Yr above to save {SAVING_PCT}%
                  </motion.p>
                ) : (
                  <motion.p
                    key="yearly-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 text-center text-[11px] font-medium text-emerald-600"
                  >
                    Yearly plan - {fmt(YEARLY_SAVING)} saved vs monthly
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
