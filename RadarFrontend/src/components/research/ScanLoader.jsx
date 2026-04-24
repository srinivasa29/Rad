import { motion } from "framer-motion";

const ScanLoader = () => {
  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="mx-auto h-8 w-8 rounded-full border-2 border-cyan-200/30 border-t-cyan-200"
      />
      <p className="mt-3 text-sm font-semibold text-cyan-100">Scanning market...</p>
    </div>
  );
};

export default ScanLoader;
