import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Users } from "lucide-react";

const MESSAGES = [
  { text: "Built for social sellers", icon: Zap, accent: "hsl(190 100% 42%)", bg: "hsl(190 100% 42% / 0.08)" },
  { text: "₦0 to get started", icon: TrendingUp, accent: "hsl(244 100% 65%)", bg: "hsl(244 100% 65% / 0.08)" },
  { text: "Thousands of stores live", icon: Users, accent: "hsl(258 72% 62%)", bg: "hsl(258 72% 62% / 0.08)" },
];

const AnimatedBadge = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const advance = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % MESSAGES.length);
  }, []);

  useEffect(() => {
    const id = setInterval(advance, 3200);
    return () => clearInterval(id);
  }, [advance]);

  const msg = MESSAGES[index];
  const Icon = msg.icon;

  const textVariants = {
    enter: (d: number) => ({
      y: d * 18,
      opacity: 0,
      filter: "blur(6px)",
    }),
    center: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (d: number) => ({
      y: d * -18,
      opacity: 0,
      filter: "blur(6px)",
    }),
  };

  const iconVariants = {
    enter: {
      scale: 0,
      opacity: 0,
      rotate: -90,
    },
    center: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    exit: {
      scale: 0,
      opacity: 0,
      rotate: 90,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="mb-5 inline-flex"
    >
      <div className="badge-container relative inline-flex items-center">
        {/* Animated gradient border — flows via CSS, no spinning div */}
        <div className="badge-border absolute inset-0 rounded-full" />

        {/* Shimmer sweep overlay */}
        <div className="badge-shimmer absolute inset-0 rounded-full overflow-hidden">
          <div className="badge-shimmer-light" />
        </div>

        {/* Content pill */}
        <motion.div
          className="relative z-10 m-[1.5px] inline-flex items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-md px-4 py-2"
          animate={{
            boxShadow: `0 2px 24px -4px ${msg.accent.replace(")", " / 0.18)")}, 0 0 0 0.5px ${msg.accent.replace(")", " / 0.08)")}`,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Animated accent bar */}
          <motion.div
            className="absolute left-4 right-4 bottom-[5px] h-[2px] rounded-full origin-left"
            animate={{
              backgroundColor: msg.accent,
              scaleX: [0, 1],
              opacity: [0, 0.3, 0.3, 0],
            }}
            transition={{ duration: 3.2, ease: "easeInOut", times: [0, 0.15, 0.85, 1] }}
            key={`bar-${index}`}
          />

          {/* Color dot with morphing glow */}
          <span className="relative flex h-2 w-2 shrink-0">
            <motion.span
              className="absolute inset-0 rounded-full"
              animate={{
                backgroundColor: msg.accent,
                boxShadow: `0 0 8px 2px ${msg.accent.replace(")", " / 0.4)")}`,
                scale: [1, 1.4, 1],
              }}
              transition={{
                backgroundColor: { duration: 0.6 },
                boxShadow: { duration: 0.6 },
                scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              }}
            />
            <motion.span
              className="relative inline-flex h-2 w-2 rounded-full"
              animate={{ backgroundColor: msg.accent }}
              transition={{ duration: 0.6 }}
            />
          </span>

          {/* Icon — spring rotation entrance */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.span
              key={`icon-${index}`}
              variants={iconVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="shrink-0"
            >
              <Icon className="h-3.5 w-3.5" style={{ color: msg.accent }} />
            </motion.span>
          </AnimatePresence>

          {/* Text — vertical slide with blur */}
          <div className="overflow-hidden relative" style={{ height: "1.25rem" }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.span
                key={`text-${index}`}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="whitespace-nowrap text-sm font-semibold block"
                style={{ color: "hsl(230 25% 10%)" }}
              >
                {msg.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnimatedBadge;
