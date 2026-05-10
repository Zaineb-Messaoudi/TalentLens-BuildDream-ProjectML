import { motion } from "framer-motion";
import { cn } from "../../lib/utils.jsx";

export function GlassPanel({ className, children, hover = true }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-glow backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_50%)]" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
