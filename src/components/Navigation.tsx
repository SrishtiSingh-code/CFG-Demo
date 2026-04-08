import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './Section';

const links = [
  { id: 'home', label: 'HOME' },
  { 
    id: 'essence', 
    label: 'WHAT IS CFG', 
    hasDropdown: true,
    subSections: ['essence', 'tuples', 'real-world'],
    dropdownItems: [
      { label: 'OVERVIEW', href: '#essence' },
      { label: 'DEFINITION', href: '#tuples' },
      { label: 'REAL WORLD', href: '#real-world' },
    ]
  },
  { 
    id: 'chomsky', 
    label: 'CHOMSKY', 
    hasDropdown: true,
    subSections: ['chomsky', 'chomsky-comparison'],
    dropdownItems: [
      { label: 'CHOMSKY HIERARCHY', href: '#chomsky' },
      { label: 'KEY DIFFERENCES', href: '#chomsky-comparison' },
    ]
  },
  { id: 'cfg-checker', label: 'CFG CHECKER' },
  { 
    id: 'theory', 
    label: 'THEORY',
    hasDropdown: true,
    subSections: ['theory', 'parse-tree'],
    dropdownItems: [
      { label: 'DERIVATIONS', href: '#theory' },
      { label: 'PARSE TREES', href: '#parse-tree' },
    ]
  },
  { id: 'workshop', label: 'GENERATOR' },
  { id: 'results', label: 'RESULTS' },
];

export const Navigation = () => {
  const [activeId, setActiveId] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
      let current = '';
      for (const link of links) {
        const idsToCheck = (link as any).subSections || [link.id];
        for (const id of idsToCheck) {
          const element = document.getElementById(id);
          if (element) {
            const rect = element.getBoundingClientRect();
            // If the section is at the top or occupies most of the viewport
            if (rect.top <= 200 && rect.bottom >= 200) {
              current = link.id;
            }
          }
        }
      }
      if (current) setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 z-50 w-full transition-all duration-500 border-b",
      scrolled 
        ? "bg-black border-white/10 py-2 shadow-2xl"
        : "bg-black border-transparent py-4"
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-2 group cursor-pointer"
          whileHover="hover"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="text-white font-bold tracking-tighter text-2xl uppercase font-mono">
            CFG <span className="text-[#facc15]">Studio</span>
          </span>
        </motion.div>

        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => (
            <div 
              key={link.id} 
              className="relative"
              onMouseEnter={() => setHoveredLink(link.id)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <a
                href={`#${link.id}`}
                className={cn(
                  "px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-500 relative flex items-center gap-1",
                  activeId === link.id 
                    ? "text-[#facc15]" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                {activeId === link.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full -z-10 bg-[#facc15]/10 border border-[#facc15]/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  />
                )}
                {link.label}
                {link.hasDropdown && (
                  <motion.svg 
                    viewBox="0 0 24 24" 
                    className="w-3 h-3 fill-current"
                    animate={{ rotate: hoveredLink === link.id ? 180 : 0 }}
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </motion.svg>
                )}
              </a>

              <AnimatePresence>
                {link.hasDropdown && hoveredLink === link.id && link.dropdownItems && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                  >
                    <div className="py-2">
                      {link.dropdownItems.map((item, idx) => (
                        <a
                          key={idx}
                          href={item.href}
                          className="block px-6 py-3 text-[10px] font-bold text-gray-400 hover:text-[#facc15] hover:bg-white/5 transition-colors tracking-widest"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex flex-col gap-1.5 cursor-pointer p-2">
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-[#22d3ee]"></div>
        </div>
      </div>
    </nav>
  );
};
