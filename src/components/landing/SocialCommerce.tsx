import { motion } from "framer-motion";
import { MessageCircle, Instagram, Share2, ShoppingBag, Heart, Star } from "lucide-react";

const platforms = [
  {
    name: "WhatsApp",
    icon: MessageCircle,
    color: "#25D366",
    bg: "bg-[#25D366]/10",
    description: "Share product links directly in chats and status",
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "#E1306C",
    bg: "bg-[#E1306C]/10",
    description: "Link in bio + story swipe-ups to your store",
  },
  {
    name: "TikTok",
    icon: Share2,
    color: "#000000",
    bg: "bg-black/10",
    description: "Drop your store link in bio and video captions",
  },
];

const SocialCommerce = () => {
  return (
    <section className="relative py-24 md:py-32 bg-card overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] glow-purple opacity-30" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] glow-cyan opacity-20" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start"
          >
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-storvo-purple/15 via-primary/10 to-storvo-cyan/10 blur-3xl" />

              <div className="relative w-[280px] rounded-[2.5rem] border-[8px] border-foreground/10 bg-card p-1 shadow-elevated sm:w-[300px]">
                <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-foreground/10" />

                <div className="rounded-[2rem] bg-background p-4">
                  {/* Social header mockup */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/40">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-foreground">@luxehair_ng</div>
                      <div className="text-[9px] text-muted-foreground">luxehair.storvo.co</div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[9px] font-medium">4.9</span>
                    </div>
                  </div>

                  {/* Product showcase */}
                  <div className="rounded-xl bg-gradient-to-br from-primary/10 to-storvo-purple/10 aspect-[4/3] flex items-center justify-center mb-3">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[11px] font-bold text-foreground">Silk Press Bundle</p>
                      <p className="text-[10px] font-bold text-primary">₦25,000</p>
                    </div>
                    <Heart className="h-4 w-4 text-muted-foreground/30" />
                  </div>

                  {/* Action buttons mockup */}
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg bg-[#25D366] py-2 text-center">
                      <span className="text-[9px] font-semibold text-white">WhatsApp</span>
                    </div>
                    <div className="flex-1 rounded-lg gradient-primary py-2 text-center">
                      <span className="text-[9px] font-semibold text-white">Buy Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Social Commerce</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
              Sell where your customers already are
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Your store works seamlessly with the platforms your audience uses every day. Share products, take orders, and grow — all from social media.
            </p>

            <div className="mt-8 space-y-4">
              {platforms.map((platform, i) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-4 rounded-xl border border-border/40 bg-background p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${platform.bg}`}
                  >
                    <platform.icon className="h-5 w-5" style={{ color: platform.color }} />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SocialCommerce;
