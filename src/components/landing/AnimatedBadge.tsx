import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Users } from "lucide-react";

const MESSAGES = [
  { text: "Built for social sellers", icon: Zap, color: "hsl(190 100% 42%)" },
  { text: "₦0 to get started", icon: TrendingUp, color: "hsl(244 100% 65%)" },
  { text: "Thousands of stores live", icon: Users, color: "hsl(258 72% 62%)" },
];

const AnimatedBadge = () => {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
      setTick((t) => t + 1);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const msg = MESSAGES[index];
  const Icon = msg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-5 inline-flex"
    >
      {/* Outer glow ring — rotates */}
      <div className="relative inline-flex items-center">
        {/* Spinning gradient border */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(244 100% 65%), hsl(258 72% 62%), hsl(190 100% 42%), hsl(244 100% 65%))",
            padding: "1.5px",
            borderRadius: "9999px",
          }}
        />
        {/* White mask behind text pill */}
        <div
          className="relative z-10 m-[1.5px] inline-flex items-center gap-2.5 rounded-full bg-white/90 backdrop-blur-sm px-4 py-1.5"
          style={{ boxShadow: "0 2px 20px -4px hsl(244 100% 65% / 0.25)" }}
        >
          {/* Pulsing live dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <motion.span
              animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inline-flex h-full w-full rounded-full"
              style={{ backgroundColor: msg.color }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: msg.color }}
            />
          </span>

          {/* Icon swap */}
          <AnimatePresence mode="wait">
            <motion.span
              key={`icon-${tick}`}
              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, rotate: 20 }}
              transition={{ duration: 0.25, ease: "backOut" }}
              className="shrink-0"
            >
              <Icon className="h-3.5 w-3.5" style={{ color: msg.color }} />
            </motion.span>
          </AnimatePresence>

          {/* Text swap */}
          <AnimatePresence mode="wait">
            <motion.span
              key={`text-${tick}`}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="whitespace-nowrap text-sm font-semibold"
              style={{ color: "hsl(230 25% 10%)" }}
            >
              {msg.text}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedBadge;
