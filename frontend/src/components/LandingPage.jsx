import React, { useEffect, useRef } from 'react';

const LandingPage = ({ onStart, onSignIn }) => {
  const planetRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!sceneRef.current) return;
      const { clientX, clientY } = e;
      const xRatio = (clientX / window.innerWidth - 0.5);
      const yRatio = (clientY / window.innerHeight - 0.5);

      // Subtle parallax on the whole scene
      sceneRef.current.style.transform = `translate(${xRatio * 12}px, ${yRatio * 8}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#01010a] select-none font-['Outfit',sans-serif]">

      {/* ── STAR FIELD ── */}
      <div className="absolute inset-0 z-0">
        {[...Array(120)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + 'px',
              height: Math.random() * 2 + 0.5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.6 + 0.1,
              animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + 's',
            }}
          />
        ))}
      </div>

      {/* ── SUN GLOW (off-screen top-right) ── */}
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] z-0">
        {/* Core sun */}
        <div className="absolute inset-[30%] rounded-full bg-amber-200/30 blur-2xl" />
        {/* Sun rays */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: '350px',
              height: '1.5px',
              background: 'linear-gradient(to right, rgba(251,191,36,0.15), transparent)',
              transform: `rotate(${i * 30}deg) translateY(-50%)`,
              animation: `rayPulse ${3 + i * 0.3}s ease-in-out infinite`,
              animationDelay: i * 0.2 + 's',
            }}
          />
        ))}
        {/* Soft halo */}
        <div className="absolute inset-0 rounded-full bg-amber-400/5 blur-3xl" />
      </div>

      {/* ── ATMOSPHERIC GLOW (left side, deep space color) ── */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-indigo-900/20 blur-[100px] z-0 rounded-full" />

      {/* ── PLANET SCENE ── */}
      <div
        ref={sceneRef}
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{ transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      >
        {/* Planet container — offset right-center like in the inspo */}
        <div className="absolute" style={{ top: '10%', right: '8%', width: '380px', height: '380px' }}>

          {/* Outer atmosphere ring */}
          <div
            className="absolute -inset-6 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(99,102,241,0.15) 80%, transparent 100%)',
              animation: 'atmospherePulse 6s ease-in-out infinite',
            }}
          />

          {/* Planet body */}
          <div
            ref={planetRef}
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `
                radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15) 0%, transparent 40%),
                radial-gradient(circle at 70% 60%, rgba(99,102,241,0.3) 0%, transparent 50%),
                linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e3a5f 60%, #0f2744 100%)
              `,
              boxShadow: `
                inset -60px -20px 80px rgba(0,0,0,0.8),
                inset 20px 10px 60px rgba(255,255,255,0.06),
                0 0 80px rgba(99,102,241,0.25),
                0 0 160px rgba(99,102,241,0.1)
              `,
            }}
          >
            {/* Rotating surface bands */}
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background: `
                  repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    transparent 18px,
                    rgba(255,255,255,0.04) 18px,
                    rgba(255,255,255,0.04) 20px
                  )
                `,
                animation: 'planetRotate 40s linear infinite',
              }}
            />
            {/* Cloud wisps */}
            <div
              className="absolute inset-0 rounded-full opacity-15"
              style={{
                background: `
                  radial-gradient(ellipse 80% 20% at 30% 40%, rgba(255,255,255,0.3), transparent),
                  radial-gradient(ellipse 60% 15% at 70% 60%, rgba(255,255,255,0.2), transparent)
                `,
                animation: 'planetRotate 28s linear infinite reverse',
              }}
            />
            {/* Terminator (day/night shadow) */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 70% 40%, transparent 35%, rgba(0,0,0,0.75) 70%)',
              }}
            />
          </div>

          {/* Sun-side rim light */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: 'inset 18px -8px 40px rgba(251,191,36,0.12)',
            }}
          />
        </div>
      </div>

      {/* ── TEXT CONTENT (left side) ── */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-16 md:px-24 max-w-2xl">
        <p className="text-blue-400 font-black tracking-[0.5em] uppercase text-[10px] mb-6">
          Behavioral Research Engine
        </p>
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9]">
          KARMIC{' '}
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            REGRESSION
          </span>
        </h1>
        <p className="text-lg md:text-xl text-white/50 mb-12 leading-relaxed font-light max-w-lg">
          An AI-driven behavioral reflection system using probabilistic emotional modeling
          and symbolic personalization. Decode your recurring cycles.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onStart}
            className="group relative w-fit px-10 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            <span className="relative z-10 uppercase tracking-widest text-xs">Begin the Regression</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          
          <button
            onClick={onSignIn}
            className="group relative w-fit px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-full overflow-hidden transition-all hover:border-purple-400 hover:text-purple-300 active:scale-95"
          >
            <span className="relative z-10 uppercase tracking-widest text-xs">Sign In</span>
          </button>
        </div>

        {/* Bottom HUD */}
        <div className="absolute bottom-10 left-16 flex gap-10 text-[10px] text-white/20 font-bold tracking-[0.4em] uppercase">
          <span>Discovery</span>
          <span>Probabilistic</span>
          <span>Synthesis</span>
        </div>
      </div>

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes planetRotate {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        @keyframes atmospherePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
