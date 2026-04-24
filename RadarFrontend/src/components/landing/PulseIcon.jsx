
import { motion } from 'framer-motion';

const PulseIcon = ({ className }) => (
  <div className={`relative flex items-center justify-center ${className} bg-[#1F3F2E] rounded-2xl overflow-hidden`}>
    <div className="absolute inset-0 bg-[#348E87]/20" />

    <motion.div
      className="absolute w-full h-full border-2 border-[#6FFFE9] rounded-2xl"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />

    <motion.div
      className="absolute w-1/2 h-1/2 bg-[#6FFFE9] rounded-full blur-md"
      animate={{
        opacity: [0.2, 0.5, 0.2],
        scale: [0.8, 1.1, 0.8],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />

    <div className="relative z-10 w-1/3 h-1/3 bg-[#6FFFE9] rounded-full shadow-[0_0_15px_#6FFFE9]" />
  </div>
);

export default PulseIcon;
