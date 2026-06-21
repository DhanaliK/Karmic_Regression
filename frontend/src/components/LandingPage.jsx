import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LandingPage = ({ onStart, onSignIn }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const textReveal = {
    hidden: { y: 50, opacity: 0, filter: 'blur(10px)' },
    visible: { 
      y: 0, 
      opacity: 1, 
      filter: 'blur(0px)',
      transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071013] select-none font-['Outfit',sans-serif]">
      
      {/* ── BACKGROUND: DARK TEAL GRADIENT & NOISE ── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0c1f26] via-[#050a0f] to-[#020507]" />
      
      {/* CSS Noise Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* ── SWEEPING ELEGANT LINES (Comet Style) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <svg className="absolute w-full h-full opacity-40" preserveAspectRatio="none">
          <path 
            d="M -100 800 Q 500 200 1200 100" 
            fill="transparent" 
            stroke="url(#grad1)" 
            strokeWidth="1" 
          />
          <path 
            d="M 200 1000 Q 800 600 1500 200" 
            fill="transparent" 
            stroke="url(#grad2)" 
            strokeWidth="1.5" 
          />
          <path 
            d="M -200 200 Q 400 300 1000 -100" 
            fill="transparent" 
            stroke="url(#grad3)" 
            strokeWidth="1" 
          />
          
          <defs>
            <linearGradient id="grad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── ACTION AURA ── */}
      <motion.div 
        className="absolute w-[800px] h-[800px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none z-0"
        animate={{
          x: mousePos.x - 400,
          y: mousePos.y - 400,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 1.5 }}
      />

      {/* ── ABSTRACT ORB CLUSTER (Right Side) ── */}
      <div className="absolute right-10 md:right-32 top-1/2 -translate-y-1/2 z-10 pointer-events-none hidden lg:block w-[500px] h-[600px]">
        
        {/* Orb 1: Massive Teal/Emerald/Dark Swirl */}
        <motion.div 
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-80 h-80 rounded-full shadow-2xl"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(20, 184, 166, 0.9) 0%, transparent 50%),
              radial-gradient(circle at 80% 40%, rgba(6, 78, 59, 0.9) 0%, transparent 60%),
              radial-gradient(circle at 50% 80%, rgba(15, 23, 42, 0.9) 0%, #022c22 100%)
            `,
            boxShadow: 'inset -25px -25px 50px rgba(0,0,0,0.6), inset 15px 15px 30px rgba(255,255,255,0.1)'
          }}
        />

        {/* Orb 2: Medium Orange/Purple/Gold Marble */}
        <motion.div 
          animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[50%] w-48 h-48 rounded-full shadow-2xl"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(249, 115, 22, 0.9) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.8) 0%, transparent 60%),
              radial-gradient(circle at 40% 90%, rgba(234, 179, 8, 0.6) 0%, #431407 100%)
            `,
            boxShadow: 'inset -15px -15px 30px rgba(0,0,0,0.6), inset 10px 10px 20px rgba(255,255,255,0.2)'
          }}
        />

        {/* Orb 3: Small Silver/Cyan/Black Mix */}
        <motion.div 
          animate={{ x: [0, -20, 0], y: [0, -15, 0], rotate: [0, 20, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-10 w-32 h-32 rounded-full shadow-2xl"
          style={{
            background: `
              radial-gradient(circle at 40% 30%, rgba(226, 232, 240, 0.9) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.8) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, rgba(15, 23, 42, 0.9) 0%, #0f172a 100%)
            `,
            boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.7), inset 5px 5px 15px rgba(255,255,255,0.3)'
          }}
        />

        {/* Orb 4: Medium Crimson/Indigo/Gold Mix */}
        <motion.div 
          animate={{ x: [0, 25, 0], y: [0, 25, 0], rotate: [0, -10, 0] }} 
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 right-[60%] w-36 h-36 rounded-full shadow-2xl z-20"
          style={{
            background: `
              radial-gradient(circle at 25% 25%, rgba(225, 29, 72, 0.9) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(79, 70, 229, 0.8) 0%, transparent 60%),
              radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.5) 0%, #4c0519 100%)
            `,
            boxShadow: 'inset -12px -12px 25px rgba(0,0,0,0.6), inset 8px 8px 18px rgba(255,255,255,0.2)'
          }}
        />

        {/* Orb 5: Tiny Bright Blue/Pink Core */}
        <motion.div 
          animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[30%] right-[-5%] w-20 h-20 rounded-full shadow-lg z-30"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.9) 0%, transparent 60%),
              radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.8) 0%, #1e3a8a 100%)
            `,
            boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.5), inset 4px 4px 10px rgba(255,255,255,0.4)',
            filter: 'brightness(1.2)'
          }}
        />
      </div>

      {/* ── FOREGROUND CONTENT (Left Aligned - Ripple Style) ── */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 md:px-24 max-w-4xl pointer-events-none">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col pointer-events-auto"
        >
          <motion.p variants={textReveal} className="text-teal-400 font-bold tracking-[0.6em] uppercase text-xs md:text-sm mb-6">
            Every Action Creates An Echo
          </motion.p>
          
          <div className="mb-2">
            <motion.h1 variants={textReveal} className="text-6xl md:text-[6.5rem] font-black tracking-tighter text-white leading-none pr-4">
              KARMIC
            </motion.h1>
          </div>
          <div className="mb-8">
            <motion.h1 variants={textReveal} className="text-6xl md:text-[6.5rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-cyan-400 to-emerald-300 leading-tight pr-8 pb-2">
              REGRESSION
            </motion.h1>
          </div>
          
          <motion.p variants={textReveal} className="text-lg md:text-xl text-slate-300 mb-12 font-light max-w-xl leading-relaxed">
            Trace the ripples of your past. An AI-driven psychological engine that models your behavioral patterns and decodes your hidden loops.
          </motion.p>

          <motion.div variants={textReveal} className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            {/* Magnetic/Scale Primary Button */}
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden group px-12 py-5 bg-white text-black font-bold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all"
            >
              <span className="relative z-10 uppercase tracking-widest text-sm">Analyze My Echoes</span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            
            {/* Secondary Button */}
            <motion.button
              onClick={onSignIn}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-transparent border border-white/20 text-white font-bold rounded-full uppercase tracking-widest text-sm transition-all hover:border-teal-400 hover:text-teal-300"
            >
              Access Portal
            </motion.button>
          </motion.div>

        </motion.div>

        {/* Bottom Abstract HUD */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 2 }}
          className="absolute bottom-10 left-12 md:left-24 flex gap-12 text-[10px] text-white/20 font-bold tracking-[0.5em] uppercase pointer-events-none"
        >
          <span>Action</span>
          <span className="hidden sm:inline">•</span>
          <span>Reaction</span>
          <span className="hidden sm:inline">•</span>
          <span>Evolution</span>
        </motion.div>
      </div>

    </div>
  );
};

export default LandingPage;
