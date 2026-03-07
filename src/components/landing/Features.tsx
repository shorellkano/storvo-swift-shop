import { motion } from "framer-motion";
import {
  ShoppingBag,
  CreditCard,
  MessageCircle,
  Share2,
  Package,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: ShoppingBag,
    title: "Instant Store Setup",
    description: "Create your store in under 5 minutes. Pick a name, add products, and you're live.",
  },
  {
    icon: CreditCard,
    title: "Accept Payments",
    description: "Receive payments directly to your bank account via Paystack. No hassle.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integration",
    description: "Every product has a 'Chat on WhatsApp' button so customers can reach you instantly.",
  },
  {
    icon: Share2,
    title: "Social Sharing",
    description: "Share product links on Instagram, TikTok, and Facebook with rich previews.",
  },
  {
    icon: Package,
    title: "Physical & Digital Products",
    description: "Sell anything — clothes, gadgets, e-books, courses. We support both.",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description: "Track your revenue, orders, and top products from your seller dashboard.",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] glow-indigo opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-storvo-indigo">Features</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Everything you need to sell online
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Built specifically for social commerce sellers. No complicated setup, no technical skills required.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border/60 bg-card p-7 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-storvo-indigo">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
