import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₦0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "10 products",
      "Storvo subdomain",
      "Basic order management",
      "Social sharing tools",
      "1% transaction fee",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Pro",
    price: "₦3,500",
    period: "/month",
    description: "For serious sellers",
    features: [
      "Unlimited products",
      "Custom domain support",
      "Sales analytics",
      "Remove Storvo branding",
      "0% transaction fee",
      "Priority support",
    ],
    cta: "Go Pro",
    featured: true,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute top-20 left-0 h-[500px] w-[500px] glow-indigo opacity-30" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-storvo-indigo">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start free and upgrade when you're ready. No hidden fees.
          </p>
        </motion.div>

        <div className="mt-16 mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl border p-8 ${
                plan.featured
                  ? "border-primary/30 bg-card shadow-card-hover ring-1 ring-primary/10"
                  : "border-border/60 bg-card shadow-card"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary rounded-full px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 flex-shrink-0 text-storvo-indigo" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.featured ? "hero" : "hero-outline"}
                size="lg"
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
