import { cn } from "../../lib/utils.jsx";

const variants = {
  primary:
    "bg-gradient-to-r from-primary to-accent text-white shadow-cyan hover:shadow-purple",
  secondary:
    "border border-white/10 bg-white/5 text-text hover:bg-white/10",
  ghost: "text-text hover:bg-white/8 bg-transparent",
};

export function Button({ className, variant = "primary", children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-300 hover:-translate-y-0.5",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
