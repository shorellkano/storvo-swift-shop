import { useNavigate } from "react-router-dom";
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
      "Up to 10 products",
      "Storvo subdomain",
      "Paystack payments",
      "Order management",
      "WhatsApp sharing",
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
      "Custom domain",
      "Analytics dashboard",
      "Remove Storvo branding",
      "Priority support",
      "0% transaction fee",
    ],
    cta: "Go Pro",
    featured: true,
  },
];

const Pricing = () => {
  const navigate = useNavigate();

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
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "border-primary/30 bg-background shadow-elevated ring-1 ring-primary/10 hover:shadow-card-hover"
                  : "border-border/60 bg-background shadow-card hover:shadow-card-hover"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary rounded-full px-4 py-1 text-xs font-bold text-primary-foreground shadow-button">
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

              <ul className="mt-8 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${plan.featured ? 'bg-primary/10' : 'bg-accent'}`}>
                      <Check className={`h-3 w-3 flex-shrink-0 ${plan.featured ? 'text-primary' : 'text-primary'}`} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.featured ? "hero" : "hero-outline"}
                size="lg"
                className="mt-8 w-full"
                onClick={() => navigate("/auth")}
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
