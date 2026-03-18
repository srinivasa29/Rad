import { clsx } from 'clsx';
import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const SplitScreenSection = ({
    title,
    description,
    features = [],
    imageComp,
    reverse = false,
    id,
    gridLayout = false,
    workflowLayout = false,
    className,
    titleClassName,
    descriptionClassName,
    featureTitleClassName
}) => {
    return (
        <section id={id} className={cn("min-h-screen flex flex-col justify-center py-24 relative overflow-hidden", className)}>
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className={cn(
                    "flex flex-col lg:flex-row items-center gap-16 lg:gap-24",
                    reverse ? "lg:flex-row-reverse" : ""
                )}>

                    { }
                    <motion.div
                        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 space-y-8"
                    >
                        <h2 className={cn("text-4xl lg:text-5xl font-bold tracking-tight text-gradient-oklab leading-[1.1] pb-1", titleClassName)}>
                            {title}
                        </h2>
                        <p className={cn("text-lg text-gray-200 font-medium leading-relaxed", descriptionClassName)}>
                            {description}
                        </p>

                        <div className={cn("grid gap-8",
                            gridLayout ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
                            workflowLayout ? "relative pl-6" : ""
                        )}>
                            {workflowLayout && (
                                <div className="absolute left-[43px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#348E87] via-[#6FFFE9]/50 to-transparent shadow-[0_0_10px_#6FFFE9]" />
                            )}

                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 * idx, duration: 0.5 }}
                                    className={cn(
                                        "group transition-all duration-300",
                                        gridLayout ? "flex flex-col items-center text-center gap-4 p-0" :
                                            workflowLayout ? "relative flex gap-8 items-start p-2 rounded-xl" :
                                                "p-5 bg-[#0F3942]/40 backdrop-blur-md border border-[#6FFFE9]/10 rounded-2xl hover:border-[#6FFFE9]/40 hover:bg-[#0F3942]/60"
                                    )}
                                >
                                    {gridLayout ? (
                                        <>
                                            <div className="mb-2">
                                                {feature.icon && (
                                                    typeof feature.icon === 'string' ? (
                                                        <img src={feature.icon} alt={`${feature.title} icon`} className="w-24 h-24 object-contain rounded-2xl" />
                                                    ) : (
                                                        <feature.icon className="w-24 h-24 text-[#348E87] rounded-2xl overflow-hidden" />
                                                    )
                                                )}
                                            </div>
                                            <h3 className={cn("text-xl font-semibold text-white mb-0", featureTitleClassName)}>
                                                {feature.title}
                                            </h3>
                                        </>
                                    ) : workflowLayout ? (
                                        <>
                                            <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-[#020617] border-2 border-[#348E87] group-hover:border-[#6FFFE9] group-hover:shadow-[0_0_20px_#6FFFE9] transition-all duration-300 flex items-center justify-center">
                                                <div className="absolute inset-0 bg-[#348E87]/10 rounded-full blur-md group-hover:bg-[#6FFFE9]/20 transition-all duration-300" />
                                                {feature.icon && (
                                                    <feature.icon className="w-6 h-6 text-[#348E87] group-hover:text-[#6FFFE9] transition-colors duration-300" />
                                                )}
                                            </div>
                                            <div className="pt-2">
                                                <h3 className="text-2xl font-bold text-[#E2E8F0] mb-2 group-hover:text-[#6FFFE9] transition-colors duration-300">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-lg text-gray-300 leading-relaxed font-light">
                                                    {feature.text}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="mr-3 inline-block">
                                                    {feature.icon && (
                                                        typeof feature.icon === 'string' ? (
                                                            <img src={feature.icon} alt={`${feature.title} icon`} className="w-8 h-8 object-contain" />
                                                        ) : (
                                                            <feature.icon className="w-8 h-8 text-[#348E87]" />
                                                        )
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-semibold text-white inline-block">
                                                    {feature.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-300 pl-5">
                                                {feature.text}
                                            </p>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    { }
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: reverse ? -50 : 50 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex-1 w-full max-w-[600px] lg:max-w-none relative"
                    >
                        <div className="absolute inset-0 bg-radar-cyan/10 blur-[100px] rounded-full opacity-20" />
                        <div className="relative z-10 w-full aspect-square lg:aspect-auto flex items-center justify-center">
                            {imageComp}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default SplitScreenSection;
