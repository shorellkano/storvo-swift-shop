import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl gradient-primary p-12 md:p-20 text-center"
        >
          <div className="pointer-events-none absolute -top-20 -right-20 h-[300px] w-[300px] rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-primary-foreground/5 blur-3xl" />

          <h2 className="relative font-display text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
            Ready to start selling?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            Join thousands of sellers already using Storvo to grow their business on social media.
          </p>
          <div className="relative mt-8">
            <Button variant="hero-outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/50 group">
              Create Your Free Store
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
