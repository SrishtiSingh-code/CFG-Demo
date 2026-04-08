import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Navigation } from './components/Navigation';
import { Section } from './components/Section';
import { ParseTreeViz } from './components/ParseTreeViz';
import { LogicMesh } from './components/LogicMesh';
import { parseGrammar, findDerivations, buildParseTree, generateLMD, generateRMD, TreeNode, DerivationSequenceStep } from './utils/cfgParser';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Linkedin,
  Monitor,
  MessageSquare,
  Search,
  FileCode,
  Bot,
  Wrench,
  Layers,
  Cpu,
  Code2,
  XCircle,
  Star,
  HelpCircle,
  GitBranch,
  Terminal
} from 'lucide-react';
import { cn } from './components/Section';

const DEFAULT_GRAMMAR = `S -> E
E -> E + T | T
T -> T * F | F
F -> ( E ) | a | b`;
const DEFAULT_TARGET = `a + b * a`;

export default function App() {
  const [grammarText, setGrammarText] = useState(DEFAULT_GRAMMAR);
  const [targetString, setTargetString] = useState(DEFAULT_TARGET);
  const [error, setError] = useState<string | null>(null);
  
  const [lmdSteps, setLmdSteps] = useState<DerivationSequenceStep[] | null>(null);
  const [rmdSteps, setRmdSteps] = useState<DerivationSequenceStep[] | null>(null);
  const [parseTree, setParseTree] = useState<TreeNode | null>(null);
  const [allParseTrees, setAllParseTrees] = useState<TreeNode[]>([]);
  const [currentTreeIndex, setCurrentTreeIndex] = useState(0);
  const [isAmbiguous, setIsAmbiguous] = useState(false);

  const [checkerInput, setCheckerInput] = useState('S -> aS');
  const [checkerResult, setCheckerResult] = useState<{valid: boolean, message: string} | null>(null);
  const [bgColor, setBgColor] = useState('#0f1115');
  const [activeChomskyIndex, setActiveChomskyIndex] = useState(2); // Default to Type 2 (CFG)

  const CHOMSKY_DATA = [
    {
      type: 'TYPE 0',
      name: 'Unrestricted',
      language: 'Recursively Enumerable',
      desc: 'The most general class of grammars. No restrictions on production rules. Can simulate any computational process.',
      automaton: 'Turing Machine',
      rule: 'X \\rightarrow Y',
      ruleX: 'X \\in (V \\cup \\Sigma)^* V (V \\cup \\Sigma)^* \\text{ (X has } \\ge 1 \\text{ non-terminal)}',
      ruleY: 'Y \\in (V \\cup \\Sigma)^*',
      color: 'slate',
      borderColor: 'border-slate-500/30',
      textColor: 'text-slate-400',
      accentColor: 'bg-slate-500/10',
      iconColor: 'text-slate-400',
      glow: 'shadow-[0_0_50px_rgba(148,163,184,0.1)]'
    },
    {
      type: 'TYPE 1',
      name: 'Context-Sensitive',
      language: 'CSLs',
      desc: 'Rules are dependent on surrounding context. The length of the string never decreases during derivation.',
      automaton: 'LBA',
      rule: 'X \\rightarrow Y',
      ruleX: 'X \\in (V \\cup \\Sigma)^* V (V \\cup \\Sigma)^*',
      ruleY: 'Y \\in (V \\cup \\Sigma)^* \\text{ and } |Y| \\ge |X| \\text{ (length does not decrease)}',
      color: 'purple',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      accentColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.1)]'
    },
    {
      type: 'TYPE 2',
      name: 'Context-Free',
      language: 'CFLs',
      desc: 'LHS is exactly one non-terminal variable. Replacement is independent of the surrounding symbols.',
      automaton: 'PDA',
      rule: 'X \\rightarrow Y',
      ruleX: 'X \\in V \\text{ (exactly 1 non-terminal)}',
      ruleY: 'Y \\in (V \\cup \\Sigma)^*',
      color: 'cyan',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400',
      accentColor: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      glow: 'shadow-[0_0_50px_rgba(34,211,238,0.1)]'
    },
    {
      type: 'TYPE 3',
      name: 'Regular',
      language: 'Regular Languages',
      desc: 'The simplest class of grammars. Used for lexical analysis and pattern matching in strings.',
      automaton: 'DFA / NFA',
      rule: 'X \\rightarrow Y',
      ruleX: 'X \\in V \\text{ (exactly 1 non-terminal)}',
      ruleY: '\\text{Right-Linear: } Y \\in \\{aT, a, \\epsilon\\}, \\text{ Left-Linear: } Y \\in \\{Ta, a, \\epsilon\\}',
      color: 'emerald',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      accentColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.1)]'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'essence', color: '#f5f5f2' },
        { id: 'tuples', color: '#0f1115' },
        { id: 'real-world', color: '#f5f5f2' },
        { id: 'chomsky', color: '#05070a' },
        { id: 'chomsky-comparison', color: '#0a0c10' },
        { id: 'chomsky-details', color: '#0f172a' },
        { id: 'cfg-checker', color: '#0d1a1a' },
        { id: 'theory', color: '#0d1a1a' },
        { id: 'parse-tree', color: '#050505' },
        { id: 'workshop', color: '#0f1115' },
        { id: 'results', color: '#0f1115' },
      ];
      
      let current = '#0f1115';
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            current = sec.color;
          }
        }
      }
      setBgColor(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCheckCFG = () => {
    const parts = checkerInput.split(/(?:->|→)/);
    if (parts.length !== 2) {
      setCheckerResult({ valid: false, message: "Invalid format. Use '->' or '→' to separate LHS and RHS." });
      return;
    }
    
    const lhs = parts[0].trim();
    const rhs = parts[1].trim();

    if (lhs.length === 0) {
      setCheckerResult({ valid: false, message: "Invalid: Left-Hand Side (LHS) cannot be empty." });
      return;
    }

    // Strict CFG check: LHS must be exactly one uppercase letter
    if (lhs.length === 1) {
      if (/^[A-Z]$/.test(lhs)) {
        setCheckerResult({ valid: true, message: "Valid CFG Rule!" });
      } else {
        setCheckerResult({ valid: false, message: `Invalid: LHS contains a terminal "${lhs}".` });
      }
    } else {
      // LHS length > 1
      const terminals = lhs.match(/[^A-Z]/);
      if (terminals) {
        setCheckerResult({ valid: false, message: `Invalid: LHS contains a terminal "${terminals[0]}".` });
      } else {
        setCheckerResult({ valid: false, message: "Invalid: LHS has multiple variables." });
      }
    }
  };

  const handleGenerate = () => {
    setError(null);
    setLmdSteps(null);
    setRmdSteps(null);
    setParseTree(null);
    setAllParseTrees([]);
    setCurrentTreeIndex(0);
    setIsAmbiguous(false);

    try {
      const grammar = parseGrammar(grammarText);
      if (!grammar.startSymbol) {
        setError("Invalid grammar: No start symbol found.");
        return;
      }

      const derivations = findDerivations(grammar, targetString, 2); // Find up to 2 to show ambiguity
      if (derivations.length === 0) {
        setError(`Syntax Error: The string "${targetString}" cannot be derived from the given grammar.`);
        return;
      }

      const trees = derivations.map(steps => buildParseTree(grammar.startSymbol, steps));
      setAllParseTrees(trees);
      setParseTree(trees[0]);
      setIsAmbiguous(trees.length > 1);

      const lmd = generateLMD(trees[0]);
      const rmd = generateRMD(trees[0]);

      setLmdSteps(lmd);
      setRmdSteps(rmd);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      setError(err.message || "An error occurred during parsing.");
    }
  };

  const handleSwitchTree = (index: number) => {
    setCurrentTreeIndex(index);
    const tree = allParseTrees[index];
    setParseTree(tree);
    setLmdSteps(generateLMD(tree));
    setRmdSteps(generateRMD(tree));
  };

  return (
    <div 
      className="flex flex-col min-h-screen text-[#e2e8f0] font-sans selection:bg-cyan-500/30 selection:text-cyan-100 transition-colors duration-500 ease-in-out"
      style={{ backgroundColor: bgColor }}
    >
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
          <LogicMesh />
          
          <div className="relative z-10 flex flex-col items-start text-left max-w-5xl w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-start"
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none uppercase font-mono">
                <span className="text-white">CONTEXT</span>
                <br />
                <span className="flex items-center gap-4">
                  <span className="text-[#facc15]">FREE</span>
                  <span className="text-white">GRAMMAR</span>
                </span>
              </h1>
              
              <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed">
                A visual journey through derivations, parse trees, and the formal structure of language — from symbol to syntax.
              </p>

              <div className="mt-6 text-[10px] md:text-xs tracking-[0.3em] font-bold text-cyan-400 uppercase">
                BY SRISHTI SINGH
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-start gap-6">
                <button 
                  onClick={() => document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-[#facc15] text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                >
                  Explore Now
                </button>
                <button 
                  onClick={() => document.getElementById('workshop')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-[#facc15] text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center gap-2"
                >
                  Try Derivation & Tree Generator <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[10px] tracking-[0.2em] font-bold text-slate-500 uppercase">SCROLL TO EXPLORE</span>
            <div className="w-px h-12 bg-gradient-to-b from-slate-500 to-transparent" />
          </motion.div>

          {/* Grammar Preview Card */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-10 right-10 hidden lg:block"
          >
            <div className="glass-card p-6 rounded-2xl border-white/10 flex flex-col gap-3">
              <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">GRAMMAR PREVIEW</div>
              <div className="text-2xl font-mono text-cyan-400">
                S → aSb | ε
              </div>
              <div className="text-[11px] text-slate-400 max-w-[200px]">
                A simple recursive grammar generating balanced strings of 'a's and 'b's.
              </div>
            </div>
          </motion.div>
        </section>

        {/* Essence Section */}
        <section id="essence" className="bg-[#f5f5f2] text-[#0a0a0a] min-h-screen flex flex-col justify-center py-20 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-[11px] font-bold tracking-[0.3em] text-slate-400 uppercase mb-4">
                01 — FOUNDATION
              </div>
              <h2 className="text-7xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-12 uppercase">
                THE OVERVIEW <br /> OF CFG
              </h2>
              <div className="max-w-xl space-y-6">
                <p className="text-2xl leading-relaxed">
                  A <span className="font-bold">Context-Free Grammar (CFG)</span> is a <br />
                  formal system that describes how to generate <br />
                  all valid strings in a language using a set of <br />
                  recursive production rules.
                </p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  CFGs are the backbone of compiler design, <br />
                  natural language processing, and programming <br />
                  language theory. Every time you write code, <br />
                  a CFG-based parser reads it.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative max-w-md mx-auto"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Example of CFG</div>
              <div className="bg-white border-2 border-black rounded-[40px] p-12 shadow-[20px_20px_0_rgba(0,0,0,0.05)]">
                <div className="space-y-6 font-mono text-xl">
                  <div className="space-y-2">
                    <div className="flex gap-6">
                      <span className="text-slate-300">01</span>
                      <span className="font-bold">S → aSb</span>
                    </div>
                    <div className="flex gap-6">
                      <span className="text-slate-300">02</span>
                      <span className="font-bold">S → ε</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Generates strings like:</div>
                      <div className="text-slate-600 font-sans">ε, ab, aabb, aaabbb</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pattern:</div>
                      <div className="text-slate-600 font-sans italic">equal number of a’s followed by b’s</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-cyan-100/50 to-transparent blur-3xl" />
            </motion.div>
          </div>
        </section>

        {/* Tuples Section */}
        <section id="tuples" className="bg-white text-[#0a0a0a] min-h-screen flex flex-col justify-center py-20 px-6 relative overflow-hidden">
          <div className="max-w-[95rem] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-6xl md:text-7xl font-bold tracking-tighter uppercase">
                THE DEFINITION
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left Definition Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-6"
              >
                <div className="bg-[#f8f8f6] border-2 border-black rounded-[40px] p-10 shadow-xl">
                  <p className="text-4xl italic font-serif mb-10">
                    A CFG is defined as <span className="font-bold not-italic">G = (V, Σ, P, S)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { symbol: 'V', label: 'VARIABLES' },
                      { symbol: 'Σ', label: 'TERMINALS' },
                      { symbol: 'P', label: 'PRODUCTIONS' },
                      { symbol: 'S', label: 'START' }
                    ].map((item) => (
                      <div key={item.symbol} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#facc15] flex items-center justify-center font-bold text-lg rounded-md">
                          {item.symbol}
                        </div>
                        <span className="text-sm font-bold tracking-widest text-slate-800">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right Detail Cards */}
              <div className="lg:col-span-6 grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: 'VARIABLES',
                    desc: 'Non-terminals like S, A, B that get replaced during derivation. Represented in UPPERCASE.',
                    example: 'S, A, B, EXPR, STMT',
                    color: 'border-b-[#facc15]'
                  },
                  {
                    title: 'TERMINALS',
                    desc: 'Actual symbols of the language — letters, digits, operators. They appear in the final string.',
                    example: 'a, b, 0, 1, +, *, (, )',
                    color: 'border-b-[#22d3ee]'
                  },
                  {
                    title: 'PRODUCTIONS',
                    desc: 'Rules that define substitutions. A non-terminal on the left, a string of symbols on the right.',
                    example: 'E → E + T | T',
                    color: 'border-b-[#ec4899]'
                  },
                  {
                    title: 'START SYMBOL',
                    desc: 'The initial non-terminal from which all derivations begin. Every sentence derives from S.',
                    example: 'S ⇒ ... ⇒ w',
                    color: 'border-b-[#10b981]'
                  }
                ].map((card, idx) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border-b-4 ${card.color}`}
                  >
                    <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 text-right">
                      {card.title}
                    </div>
                    <p className="text-base text-slate-600 mb-6 leading-relaxed">
                      {card.desc}
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg font-mono text-sm text-slate-500">
                      {card.example}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Real World Section */}
        <section id="real-world" className="bg-[#f5f5f2] text-[#0a0a0a] min-h-screen flex flex-col justify-center py-20 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-6xl md:text-7xl font-bold tracking-tighter uppercase">
                CFGS IN THE REAL WORLD
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: 'COMPILER DESIGN', Icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'NATURAL LANGUAGE PROCESSING', Icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'SYNTAX ANALYSIS', Icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-50' },
                { label: 'XML/HTML PARSING', Icon: FileCode, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'AI LANGUAGE MODELS', Icon: Bot, color: 'text-pink-500', bg: 'bg-pink-50' },
                { label: 'IDE AUTOCOMPLETE', Icon: Wrench, color: 'text-slate-500', bg: 'bg-slate-50' }
              ].map((item, idx) => {
                const Icon = item.Icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[32px] p-12 flex flex-col items-center justify-center gap-6 shadow-sm hover:shadow-xl transition-all duration-500 group border border-transparent hover:border-black/5"
                  >
                    <div className={cn("p-6 rounded-2xl transition-transform duration-500 group-hover:scale-110", item.bg)}>
                      <Icon className={cn("w-10 h-10", item.color)} />
                    </div>
                    <span className="text-lg font-bold tracking-[0.1em] text-center uppercase">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Chomsky Hierarchy Section */}
        <section id="chomsky" className="bg-[#05070a] text-white pt-20 pb-10 md:pt-24 md:pb-16 px-6 relative overflow-hidden min-h-screen flex items-center scroll-mt-20">
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-1">
                <span className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">02 — Classification</span>
                <div className="h-px w-12 bg-slate-800"></div>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-5xl font-bold tracking-tighter uppercase mb-1">
                Chomsky Hierarchy
              </h2>
              <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
                A containment hierarchy of formal grammars, where each type is a subset of the one above it.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left: Interactive Diagram */}
              <div className="relative aspect-square w-full max-w-[380px] mx-auto lg:mx-0">
                {/* Labels */}
                <div className="absolute top-0 left-0 w-full flex justify-between px-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
                  <span>Grammars (Generators)</span>
                  <span>Automata (Acceptors)</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  {CHOMSKY_DATA.map((item, idx) => {
                    const size = 100 - (idx * 22);
                    const isActive = activeChomskyIndex === idx;
                    return (
                      <motion.div
                        key={item.type}
                        onMouseEnter={() => setActiveChomskyIndex(idx)}
                        className={cn(
                          "absolute rounded-full border transition-all duration-500 cursor-pointer flex items-center justify-center",
                          isActive ? "border-white/40 bg-white/5" : "border-white/10 hover:border-white/20",
                          isActive && item.glow
                        )}
                        style={{ 
                          width: `${size}%`, 
                          height: `${size}%`,
                          zIndex: 10 + idx
                        }}
                        initial={false}
                        animate={{
                          scale: isActive ? 1.02 : 1,
                        }}
                      >
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-bold tracking-widest uppercase mb-1">{item.type}</span>
                        </div>
                        
                        {/* Inner labels for specific types */}
                        <div className="absolute top-1/3 left-4 right-4 flex justify-between items-center pointer-events-none">
                          <span className={cn("text-xs font-mono tracking-wider", isActive ? "text-white" : "text-slate-600")}>
                            {item.name}
                          </span>
                          <span className={cn("text-xs font-mono tracking-wider text-right", isActive ? "text-white" : "text-slate-600")}>
                            {item.automaton.split(' (')[0]}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Complexity Arrow */}
                <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                  <div className="h-48 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-700 rounded-full"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-slate-700"></div>
                  </div>
                  <div className="flex flex-col gap-1 text-[10px] font-bold tracking-widest text-slate-600 uppercase vertical-text">
                    <span>+ More Complex</span>
                    <span>+ More Powerful</span>
                    <span>- Less Restricted</span>
                  </div>
                </div>
              </div>

              {/* Right: Detail Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChomskyIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "glass-card p-6 md:p-8 rounded-[24px] relative overflow-hidden border-t border-l border-white/10",
                    CHOMSKY_DATA[activeChomskyIndex].glow
                  )}
                >
                  {/* Background Accent */}
                  <div className={cn(
                    "absolute top-0 right-0 w-48 h-48 blur-[80px] -mr-24 -mt-24 opacity-20 transition-colors duration-500",
                    CHOMSKY_DATA[activeChomskyIndex].accentColor
                  )}></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className={cn("text-xs font-bold tracking-[0.3em] uppercase", CHOMSKY_DATA[activeChomskyIndex].textColor)}>
                        {CHOMSKY_DATA[activeChomskyIndex].type}
                      </span>
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Layers className={cn("w-4 h-4", CHOMSKY_DATA[activeChomskyIndex].iconColor)} />
                      </div>
                    </div>

                    <h3 className="text-3xl sm:text-4xl md:text-4xl font-bold tracking-tight mb-3">
                      {CHOMSKY_DATA[activeChomskyIndex].name}
                    </h3>
                    
                    <p className="text-base text-slate-400 leading-relaxed mb-4 italic">
                      {CHOMSKY_DATA[activeChomskyIndex].desc}
                    </p>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-md">
                          <Cpu className="w-3 h-3 text-slate-500" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-0">Automaton</span>
                          <span className="text-xs font-semibold text-slate-200">{CHOMSKY_DATA[activeChomskyIndex].automaton}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-md">
                          <Code2 className="w-3 h-3 text-slate-500" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-0">Production Rule</span>
                          <div className={cn("text-sm font-mono flex flex-col gap-0.5", CHOMSKY_DATA[activeChomskyIndex].textColor)}>
                            <InlineMath math={CHOMSKY_DATA[activeChomskyIndex].rule} />
                            <InlineMath math={CHOMSKY_DATA[activeChomskyIndex].ruleX} />
                            <InlineMath math={CHOMSKY_DATA[activeChomskyIndex].ruleY} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 text-center">
              <span className="text-[10px] font-bold tracking-[0.3em] text-slate-600 uppercase">
                Hover over the diagram layers to explore the hierarchy
              </span>
            </div>
          </div>
        </section>

        {/* Chomsky Subsection 2: Comparison Matrix */}
        <section id="chomsky-comparison" className="bg-[#0a0c10] text-white py-20 md:py-24 px-6 relative overflow-hidden scroll-mt-20 min-h-screen flex flex-col justify-center">
          <div className="max-w-[90rem] mx-auto w-full">
            <div className="mb-6 md:mb-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-3">
                Key Differences
              </h2>
              <p className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed">
                A technical comparison of the four grammar types, their computational limits, and formal rule structures.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="py-6 px-8 text-sm font-bold tracking-[0.3em] text-slate-500 uppercase">Type</th>
                    <th className="py-6 px-8 text-sm font-bold tracking-[0.3em] text-slate-500 uppercase">Grammar</th>
                    <th className="py-6 px-8 text-sm font-bold tracking-[0.3em] text-slate-500 uppercase">Language</th>
                    <th className="py-6 px-8 text-sm font-bold tracking-[0.3em] text-slate-500 uppercase">Automaton</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[...CHOMSKY_DATA].reverse().map((item, idx) => {
                    const isType2 = item.type === 'TYPE 2';
                    return (
                      <tr 
                        key={item.type} 
                        className={cn(
                          "border-b border-white/5 transition-colors group",
                          isType2 ? "bg-cyan-500/5" : "hover:bg-white/[0.02]"
                        )}
                      >
                        <td className="py-3 md:py-4 px-6">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border",
                            item.type === 'TYPE 3' && "bg-amber-500/10 border-amber-500/30 text-amber-400",
                            item.type === 'TYPE 2' && "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
                            item.type === 'TYPE 1' && "bg-purple-500/10 border-purple-500/30 text-purple-400",
                            item.type === 'TYPE 0' && "bg-slate-500/10 border-slate-500/30 text-slate-400"
                          )}>
                            {item.type}
                            {isType2 && <Star className="w-2.5 h-2.5 fill-current" />}
                          </div>
                        </td>
                        <td className="py-5 md:py-6 px-8">
                          <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
                            {item.name}
                          </span>
                        </td>
                        <td className="py-5 md:py-6 px-8">
                          <span className="text-base md:text-lg font-medium text-slate-400">
                            {item.language}
                          </span>
                        </td>
                        <td className="py-5 md:py-6 px-8">
                          <span className="text-base md:text-lg font-medium text-slate-400">
                            {item.automaton}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>


        {/* CFG Checker Section */}
        <section id="cfg-checker" className="bg-[#05070a] text-white py-20 md:py-24 px-6 relative overflow-hidden scroll-mt-20 border-b border-white/5 min-h-screen flex flex-col justify-center">
          <div className="max-w-[90rem] mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">03 — Theory & Tool</span>
                  <div className="h-px w-12 bg-slate-800"></div>
                </div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-4">
                  CFG Validator
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed mb-4">
                  The defining characteristic of a <span className="text-[#facc15] font-bold">Context-Free Grammar</span> is that the Left-Hand Side (LHS) of every production rule must consist of <span className="border-b-2 border-[#facc15] pb-0.5">exactly one non-terminal variable</span>.
                </p>
                <p className="text-base text-slate-500 leading-relaxed mb-4">
                  This means the replacement of the variable is independent of its context — it doesn't matter what symbols surround it; the rule always applies the same way.
                </p>

                <div className="space-y-4">
                  <span className="block text-xs font-bold tracking-[0.4em] text-slate-600 uppercase mb-4">Quick Reference</span>
                  
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="font-mono text-base text-emerald-400">S → aSb</span>
                    </div>
                    <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">Valid</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 rounded-lg">
                        <XCircle className="w-5 h-5 text-rose-400" />
                      </div>
                      <span className="font-mono text-base text-rose-400">aSa → b</span>
                    </div>
                    <span className="text-xs font-bold tracking-widest text-slate-600 uppercase text-right">Invalid: LHS Has Terminals</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-rose-500/10 rounded-lg">
                        <XCircle className="w-5 h-5 text-rose-400" />
                      </div>
                      <span className="font-mono text-base text-rose-400">AB → c</span>
                    </div>
                    <span className="text-xs font-bold tracking-widest text-slate-600 uppercase text-right">Invalid: Multiple Variables</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-[#facc15]/5 blur-3xl rounded-full"></div>
                <div className="relative glass-card p-8 md:p-10 rounded-[32px] border-white/10 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 bg-[#facc15]/10 rounded-xl">
                      <ArrowRight className="w-5 h-5 text-[#facc15]" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Test a Production Rule</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold tracking-[0.3em] text-slate-500 uppercase mb-3">
                        Enter Rule (e.g., A → BAC)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={checkerInput}
                          onChange={(e) => setCheckerInput(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 font-mono text-lg text-white focus:outline-none focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] transition-all"
                          placeholder="S -> aSb"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCheckCFG}
                      className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-bold py-4 rounded-xl transition-all shadow-[0_10px_30px_rgba(250,204,21,0.2)] active:scale-[0.98] uppercase tracking-widest text-sm"
                    >
                      Verify Rule
                    </button>

                    <AnimatePresence mode="wait">
                      {checkerResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "p-4 rounded-xl border flex items-start gap-3",
                            checkerResult.valid 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                              : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                          )}
                        >
                          {checkerResult.valid ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                          <div>
                            <span className="block font-bold text-[10px] uppercase tracking-widest mb-0.5">
                              {checkerResult.valid ? 'Valid CFG Rule' : 'Invalid Rule'}
                            </span>
                            <p className="text-xs opacity-80 leading-relaxed">{checkerResult.message}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theory Section: Derivation Strategies */}
        <Section 
          id="theory" 
          title="" 
          className="min-h-screen flex flex-col justify-center py-20 md:py-24 border-b-0 scroll-mt-20"
          contentClassName="justify-center"
        >
          <div className="relative mb-4 text-center">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter uppercase text-white leading-none"
            >
              Derivation <br className="md:hidden" /> Strategies
            </motion.h2>
            
            {/* Decorative Arrows (Desktop only) */}
            <div className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 w-full max-w-5xl h-16 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 1000 100" fill="none" preserveAspectRatio="none">
                {/* Left Arrow */}
                <motion.path 
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.2 }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  d="M450 10 Q 350 10, 200 80" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeDasharray="6 6"
                />
                <motion.path 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.2 }}
                  transition={{ delay: 1.7 }}
                  d="M215 70 L 200 80 L 218 85" 
                  stroke="white" 
                  strokeWidth="2"
                />
                
                {/* Right Arrow */}
                <motion.path 
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.2 }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  d="M550 10 Q 650 10, 800 80" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeDasharray="6 6"
                />
                <motion.path 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.2 }}
                  transition={{ delay: 1.7 }}
                  d="M785 70 L 800 80 L 782 85" 
                  stroke="white" 
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          <div className="max-w-[90rem] mx-auto w-full grid md:grid-cols-2 gap-8 items-stretch relative z-10">
            {/* Leftmost Derivation */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass-card p-5 rounded-3xl border-t-4 border-cyan-500/50 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg font-bold border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">L</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Leftmost Derivation</h3>
                  <span className="text-cyan-400/70 text-[10px] font-mono uppercase tracking-widest">LMD Strategy</span>
                </div>
              </div>
              
              <div className="space-y-5 flex-1">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <p className="text-base md:text-lg text-slate-300 leading-relaxed">
                    In a <strong className="text-cyan-400">Leftmost Derivation</strong>, the leftmost non-terminal variable in the current sentential form is always the next one to be replaced by a production rule.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step-by-Step Example</h4>
                  <p className="text-[10px] text-slate-400 italic mb-1">Grammar: E → E + E | id | (E)</p>
                  <div className="font-mono text-sm text-slate-300 bg-black/60 p-3 rounded-xl border border-cyan-500/10 space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 w-6 text-xs">1</span>
                      <span>E</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 w-6 text-xs">2</span>
                      <span>⇒ <span className="text-cyan-400 font-bold underline">E</span> + E</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 w-6 text-xs">3</span>
                      <span>⇒ <span className="text-cyan-400 font-bold underline">id</span> + E</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 w-6 text-xs">4</span>
                      <span>⇒ id + <span className="text-cyan-400 font-bold underline">id</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rightmost Derivation */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass-card p-5 rounded-3xl border-t-4 border-purple-500/50 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg font-bold border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">R</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Rightmost Derivation</h3>
                  <span className="text-purple-400/70 text-[10px] font-mono uppercase tracking-widest">RMD Strategy</span>
                </div>
              </div>
              
              <div className="space-y-5 flex-1">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <p className="text-base md:text-lg text-slate-300 leading-relaxed">
                    In a <strong className="text-purple-400">Rightmost Derivation</strong>, the rightmost non-terminal variable in the current sentential form is always the next one to be replaced by a production rule.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step-by-Step Example</h4>
                  <p className="text-[10px] text-slate-400 italic mb-1">Grammar: E → E + E | id | (E)</p>
                  <div className="font-mono text-sm text-slate-300 bg-black/60 p-3 rounded-xl border border-purple-500/10 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-4 text-[10px]">1</span>
                      <span>E</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-4 text-[10px]">2</span>
                      <span>⇒ E + <span className="text-purple-400 font-bold underline">E</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-4 text-[10px]">3</span>
                      <span>⇒ E + <span className="text-purple-400 font-bold underline">id</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-4 text-[10px]">4</span>
                      <span>⇒ <span className="text-purple-400 font-bold underline">id</span> + id</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>

        <Section 
          id="parse-tree" 
          title=""
          className="min-h-screen flex flex-col justify-center py-20 md:py-24 border-b-0 scroll-mt-20"
          contentClassName="justify-center"
        >
          <div className="max-w-[90rem] mx-auto w-full">
            <div className="relative mb-10 text-center">
              <motion.h2 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase text-white leading-none mb-4"
              >
                Parse Tree
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-400 text-xl md:text-2xl max-w-4xl mx-auto"
              >
                A tree representation of how a string is generated from a context-free grammar (CFG)
              </motion.p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-stretch">
              {/* Left Column: Text Content */}
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex-1 p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-3xl flex flex-col"
                  >
                    <h4 className="text-white font-bold mb-4 flex items-center gap-3 text-base uppercase tracking-wider">
                      DERIVATIONS AND PARSE TREES
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-400 mb-6">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span><strong className="text-slate-200">Leftmost Derivation:</strong> Expands the leftmost variable first</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                        <span><strong className="text-slate-200">Rightmost Derivation:</strong> Expands the rightmost variable first</span>
                      </li>
                      <li className="pt-2 border-t border-white/5 text-emerald-400 font-medium italic text-xs">
                        Both will produce the same parse tree structure if grammar is unambiguous
                      </li>
                    </ul>

                    <div className="mt-auto p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <p className="text-[13px] text-emerald-300/70 italic leading-snug text-center">
                        "A derivation shows <span className="text-emerald-400/80 font-bold">how</span> a string is generated, while a parse tree shows <span className="text-emerald-400/80 font-bold">what</span> structure it represents."
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right Column: Diagram */}
              <div className="relative h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-purple-500/10 blur-[100px] -z-10"></div>
                
                <div className="h-full bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="text-[9px] font-bold tracking-[0.3em] text-slate-600 uppercase">Component Breakdown</div>
                  </div>

                  <div className="flex flex-col items-center space-y-8">
                    {/* Root Node */}
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="relative group"
                    >
                      <div className="px-6 py-3 bg-white/5 border-2 border-white/20 rounded-2xl group-hover:border-white/40 transition-colors duration-300 text-center min-w-[200px]">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Root</div>
                        <div className="text-white font-bold text-base">Start Symbol (S)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Where derivation begins</div>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-0.5 bg-gradient-to-b from-white/20 to-cyan-400/40"></div>
                    </motion.div>

                    {/* Internal Nodes */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative group"
                    >
                      <div className="px-6 py-3 bg-cyan-500/5 border-2 border-cyan-400/30 group-hover:border-cyan-400/60 rounded-2xl transition-colors duration-300 text-center min-w-[200px]">
                        <div className="text-[9px] font-bold text-cyan-500/70 uppercase tracking-widest mb-0.5">Internal Nodes</div>
                        <div className="text-cyan-400 font-bold text-base">Variables</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 italic">Intermediate expansion steps</div>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-0.5 bg-gradient-to-b from-cyan-400/40 to-purple-500/40"></div>
                    </motion.div>

                    {/* Leaf Nodes */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="relative group"
                    >
                      <div className="px-6 py-3 bg-purple-500/5 border-2 border-purple-500/30 group-hover:border-purple-500/60 rounded-2xl transition-colors duration-300 text-center min-w-[200px]">
                        <div className="text-[9px] font-bold text-purple-500/70 uppercase tracking-widest mb-0.5">Leaf Nodes</div>
                        <div className="text-purple-400 font-bold text-base">Terminals</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Final output string (L → R)</div>
                      </div>
                    </motion.div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </Section>

        {/* Generator Section */}
        <Section id="workshop" title="" className="py-12 md:py-16">
          <div className="relative mb-12 text-center">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase text-white leading-none"
            >
              Derivation and Parse Tree Generator
            </motion.h2>
          </div>
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/10">
              
              {/* Grammar Input */}
              <div className="md:col-span-3 p-6 bg-white/[0.02]">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    1. Define Production Rules
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Format: <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300">S -&gt; a B | b A</code>. Separate symbols with spaces.
                  </p>
                </div>
                <textarea
                  value={grammarText}
                  onChange={(e) => setGrammarText(e.target.value)}
                  className="w-full h-48 p-4 font-mono text-sm bg-black/50 border border-white/5 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none text-slate-200"
                  spellCheck={false}
                />
              </div>

              {/* Target String & Action */}
              <div className="md:col-span-2 p-6 flex flex-col bg-white/[0.01]">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    2. Target String
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    The string you want to derive.
                  </p>
                </div>
                <input
                  type="text"
                  value={targetString}
                  onChange={(e) => setTargetString(e.target.value)}
                  className="w-full p-4 font-mono text-lg bg-black/50 border border-white/5 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none mb-auto text-white"
                  placeholder="e.g. a + b * a"
                  spellCheck={false}
                />

                <button
                  onClick={handleGenerate}
                  className="mt-4 w-full py-4 px-6 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all flex items-center justify-center gap-2 group"
                >
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform fill-black" />
                  Generate Derivation & Tree
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-rose-300">Parsing Failed</h4>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* Results Section */}
        <Section id="results" title="" className="min-h-screen flex flex-col justify-center pt-20 pb-10 md:pt-24 md:pb-16">
          <div className="relative mb-8 text-center">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase text-white leading-none"
            >
              Results
            </motion.h2>
          </div>

          <AnimatePresence mode="wait">
            {(parseTree || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mb-12"
              >
                {parseTree ? (
                  <div className="w-full py-4 bg-emerald-500/10 border-y border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold uppercase tracking-[0.3em] text-sm backdrop-blur-sm">
                    <CheckCircle2 className="w-4 h-4 mr-3" />
                    Derivation Successful
                  </div>
                ) : (
                  <div className="w-full py-4 bg-rose-500/10 border-y border-rose-500/20 flex items-center justify-center text-rose-400 font-bold uppercase tracking-[0.3em] text-sm backdrop-blur-sm">
                    <AlertCircle className="w-4 h-4 mr-3" />
                    Derivation Failed
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!parseTree ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-black/40 border border-white/5 flex items-center justify-center mb-6">
                <ArrowRight className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg">Enter your grammar and string above to see the results.</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left Sidebar: Input Summary */}
              <div className="lg:col-span-1 space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 rounded-2xl border-white/10 sticky top-24"
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        PRODUCTION RULES
                      </h3>
                      <div className="font-mono text-[13px] text-slate-300 whitespace-pre-wrap break-all bg-black/40 p-4 rounded-xl border border-white/5 leading-relaxed">
                        {grammarText}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        TARGET STRING
                      </h3>
                      <div className="font-mono text-xl font-bold text-white bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-4 rounded-xl border border-white/5 break-all shadow-inner">
                        {targetString}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Status: Derived
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Content: Results */}
              <div className="lg:col-span-4 space-y-8">
                <div className="glass-card p-5 px-6 rounded-2xl border-white/10">
                  <h3 className="text-xs font-bold text-amber-50/90 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span className="text-cyan-500">01.</span> <span className="underline underline-offset-4">DERIVATION SEQUENCES</span>
                  </h3>
                </div>
                
                {isAmbiguous && (
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 backdrop-blur-sm"
                    >
                      <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-300">Ambiguity Detected!</h4>
                        <p className="text-base mt-1">
                          This grammar is ambiguous for the string "{targetString}". There are multiple parse trees possible. Here are 2 of them:
                        </p>
                      </div>
                    </motion.div>

                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 w-fit">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest px-3">Switch Derivations:</span>
                      {allParseTrees.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handleSwitchTree(i)}
                          className={cn(
                            "w-10 h-10 rounded-lg font-bold transition-all",
                            currentTreeIndex === i 
                              ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Part 1: Derivation Sequences */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass-card p-6 rounded-2xl border-white/5 bg-white/[0.01]">
                      <h3 className="text-lg font-semibold text-cyan-300 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm border border-cyan-500/30">L</div>
                        Leftmost Derivation
                      </h3>
                      <div className="font-mono text-base space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {lmdSteps?.map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex flex-col gap-1"
                          >
                            <div className="flex items-center gap-3 text-slate-300">
                              <span className="text-slate-500 w-6 text-right shrink-0">{i === 0 ? '' : '⇒'}</span>
                              <span className="bg-black/40 px-3 py-1.5 rounded border border-white/5 break-all">
                                {step.form.join(' ') || 'ε'}
                              </span>
                            </div>
                            {step.rule && (
                              <div className="ml-9 text-xs text-cyan-500/60 font-medium">
                                using {step.rule}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border-white/5 bg-white/[0.01]">
                      <h3 className="text-lg font-semibold text-purple-300 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">R</div>
                        Rightmost Derivation
                      </h3>
                      <div className="font-mono text-base space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {rmdSteps?.map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex flex-col gap-1"
                          >
                            <div className="flex items-center gap-3 text-slate-300">
                              <span className="text-slate-500 w-6 text-right shrink-0">{i === 0 ? '' : '⇒'}</span>
                              <span className="bg-black/40 px-3 py-1.5 rounded border border-white/5 break-all">
                                {step.form.join(' ') || 'ε'}
                              </span>
                            </div>
                            {step.rule && (
                              <div className="ml-9 text-xs text-purple-500/60 font-medium">
                                using {step.rule}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                {/* Part 2: Parse Tree */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-amber-50/90 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                    <span className="text-purple-500">02.</span> <span className="underline underline-offset-4">PARSE TREE VISUALIZATION</span>
                  </h3>
                  
                  {isAmbiguous ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {allParseTrees.map((tree, idx) => (
                        <div key={idx} className="glass-card p-8 rounded-3xl border-white/5 bg-white/[0.01]">
                          <h4 className="text-center text-cyan-400 font-bold mb-4">Parse Tree {idx + 1}</h4>
                          <ParseTreeViz data={tree} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-8 rounded-3xl border-white/5 bg-white/[0.01]">
                      <ParseTreeViz data={parseTree} />
                    </div>
                  )}

                  <div className="glass-card p-8 rounded-3xl border-white/5 bg-white/[0.01] mt-6">
                    <div className="text-sm text-slate-400 text-center bg-black/20 py-3 rounded-xl border border-white/5">
                      Scroll to zoom, click and drag to pan. <span className="text-[#3A7BD5] font-semibold">Blue</span> nodes are non-terminals, <span className="text-[#E6C15A] font-semibold">Amber</span> nodes are terminals.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>
      </main>

      {/* Dark Footer */}
      <footer className="relative bg-[#0f1115] border-t-2 border-slate-700/50 py-6 px-6 mt-auto shadow-[0_-2px_10px_rgba(34,211,238,0.05)]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          {/* Left Side */}
          <div className="flex justify-center md:justify-start">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/e4/NSUT_logo.png" 
              alt="NSUT Logo" 
              className="h-[50px]"
            />
          </div>
          
          {/* Center Section */}
          <div className="flex flex-col items-center text-center">
            <div className="text-white font-bold text-sm">
              Designed & Developed by Srishti Singh
            </div>
            <div className="text-slate-400 text-xs mt-0.5">
              Netaji Subhas University of Technology, Delhi
            </div>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center justify-center md:justify-end gap-4">
            <a href="mailto:srishti.singh_ug24@nsut.ac.in" className="text-slate-400 hover:text-cyan-400 transition-colors hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact: srishti.singh_ug24@nsut.ac.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
