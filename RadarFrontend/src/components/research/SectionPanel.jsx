import { motion } from "framer-motion";

const SectionPanel = ({ title, subtitle, accent = "cyan", children, className = "" }) => {
  const accentClass = accent === "emerald"
    ? "from-emerald-400/20"
    : accent === "violet"
      ? "from-violet-400/20"
      : accent === "amber"
        ? "from-amber-300/20"
        : "from-cyan-400/20";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border border-white/10 bg-[rgba(10,20,38,0.72)] p-5 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className={`mb-4 rounded-xl border border-white/10 bg-gradient-to-r ${accentClass} to-transparent px-4 py-3`}>
        <h3 className="text-sm font-black tracking-[0.14em] text-white uppercase">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-300">{subtitle}</p> : null}
      </div>
      {children}
    </motion.section>
  );
};

export default SectionPanel;
