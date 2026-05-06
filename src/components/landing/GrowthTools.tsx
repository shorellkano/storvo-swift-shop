import { motion } from "framer-motion";
import { Megaphone, TrendingUp, MessageCircle, BarChart3 } from "lucide-react";

const tools = [
  {
    icon: Megaphone,
    title: "Campaign Requests",
    description: "Submit local visibility boosts, product launches, and targeted campaigns to reach more buyers.",
    gradient: "from-primary/15 to-storvo-purple/10",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Lead Gen",
    description: "Generate pre-filled WhatsApp links for products and share them with potential customers.",
    gradient: "from-storvo-cyan/15 to-primary/10",
  },
  {
    icon: TrendingUp,
    title: "First Sale Tracker",
    description: "A guided checklist that walks you from your first product upload to your first sale, step by step.",
    gradient: "from-storvo-purple/15 to-storvo-cyan/10",
  },
  {
    icon: BarChart3,
    title: "Performance Insights",
    description: "Track product views, store clicks, and revenue trends to see what's working and double down.",
    gradient: "from-primary/10 to-storvo-purple/15",
  },
];

const GrowthTools = () => {
  return (
    <section className="relative py-24 md:py-32 gradient-section">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] glow-primary opacity-20" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Growth Tools</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl lg:text-5xl">
            Tools to grow your sales
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
            Go beyond listing products. Use built-in growth tools to reach more buyers, track performance, and hit your first sale faster.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-7 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/20"
            >
              <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${tool.gradient} opacity-50 transition-opacity group-hover:opacity-80`} />
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <tool.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{tool.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GrowthTools;
