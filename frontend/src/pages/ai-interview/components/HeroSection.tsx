import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleInitializeSystem = () => {
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 z-20 pointer-events-none">
      <div className="max-w-5xl w-full mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          {/* System Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl glass-card-strong text-[10px] text-primary mb-12 border border-primary/20 bg-background/40 backdrop-blur-2xl shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]" />
            <span className="font-black tracking-[0.4em] uppercase font-mono">NEUROPREP AI SYSTEM v2.0</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black text-foreground leading-[0.85] mb-12 tracking-tighter italic uppercase font-mono drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            NEURO<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary glow-text">PREP AI</span>
          </h1>

          <p className="text-foreground/90 text-sm md:text-lg max-w-xl mb-16 leading-relaxed font-bold uppercase tracking-widest">
            Experience the future of hiring. From intelligent document parsing to real-time adaptive questioning.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto pointer-events-auto">
            <button
              onClick={handleInitializeSystem}
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.3em] glow-primary hover:scale-105 transition-all duration-500 shadow-[0_0_50px_hsl(var(--primary)/0.3)]"
            >
              Initialize System
            </button>
            <button className="w-full sm:w-auto px-10 py-5 rounded-2xl glass-card-strong text-foreground font-black text-xs uppercase tracking-[0.3em] hover:bg-surface-2 transition-all duration-500 border border-primary/10">
              View Architecture
            </button>
          </div>

          <motion.div
            className="mt-28 flex flex-col items-center gap-4 opacity-70"
            animate={{ opacity: [0.7, 1, 0.7], y: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-white">Scroll to Begin</span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
