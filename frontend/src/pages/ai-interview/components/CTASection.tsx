import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  const handleStartInterview = () => {
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
        }}
      />
      
      <motion.div
        className="text-center max-w-2xl relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Ready to ace your next
          <br />
          <span className="text-gradient">interview?</span>
        </h2>
        <p className="text-foreground/80 mb-8 max-w-md mx-auto font-medium uppercase tracking-widest text-sm">
          Join thousands of engineers who prepare smarter with AI-powered practice sessions.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={handleStartInterview}
            className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base glow-primary hover:scale-105 transition-transform"
          >
            Start NeuroPrep AI
          </button>
          <button className="px-8 py-4 rounded-xl glass-card text-foreground font-semibold text-base hover:bg-secondary/50 transition-colors">
            Upload Resume
          </button>
        </div>
        <p className="mt-6 text-xs text-foreground/60 font-bold uppercase tracking-widest">No credit card required · Free tier available</p>
      </motion.div>
    </div>
  );
};

export default CTASection;
