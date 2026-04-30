import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{ background: 'linear-gradient(180deg, hsl(216 28% 7% / 0.9) 0%, transparent 100%)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-foreground font-semibold text-lg tracking-tight">AI Interview</span>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Global Status</span>
          <div className="flex items-center gap-1.5 mt-1">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.2em]">All Systems Nominal</span>
          </div>
        </div>
        <button
          onClick={handleGetStarted}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-white shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
        >
          Get Started
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
