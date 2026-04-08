import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  stickyHeader?: boolean;
}

export const Section = ({ id, title, children, className, titleClassName, contentClassName, stickyHeader }: SectionProps) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className={cn("min-h-screen flex flex-col justify-center py-16 md:py-24 border-b border-white/5 last:border-0", className)}
    >
      <div className={cn("max-w-5xl mx-auto px-6 md:px-12 flex flex-col", contentClassName)}>
        {title && (
          <h2 className={cn(
            "text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-8",
            stickyHeader && "sticky top-24 z-30 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-md py-4 -mt-4",
            titleClassName
          )}>
            {title}
          </h2>
        )}
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </motion.section>
  );
};
