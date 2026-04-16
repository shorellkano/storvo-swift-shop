import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create your store",
    description: "Sign up, choose your store name, and get your own storvo.co link instantly.",
  },
  {
    number: "02",
    title: "Add your products",
    description: "Upload photos, set prices, and describe your products. Physical or digital, your choice.",
  },
  {
    number: "03",
    title: "Share & start selling",
    description: "Share your store link on Instagram, WhatsApp, TikTok, or anywhere your customers are.",
  },
  {
    number: "04",
    title: "Get paid",
    description: "Customers pay via Paystack. Money goes straight to your bank. Manage orders from your dashboard.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 gradient-section">
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] glow-purple opacity-40" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl lg:text-5xl">
            From zero to selling in 5 minutes
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative rounded-2xl border border-border/40 bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-button">
                <span className="text-sm font-bold text-primary-foreground">{step.number}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
