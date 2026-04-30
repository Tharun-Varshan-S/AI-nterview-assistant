import { motion } from "framer-motion";

interface Props {
  progress: number;
}

const AdaptiveStage = ({ progress }: Props) => {
  const opacity = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
  const difficultyLevel = Math.min(progress * 1.3, 1);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 md:pt-24 pointer-events-none" style={{ opacity }}>
      
      {/* Central Title Overlay */}
      <motion.div 
        className="flex flex-col items-center z-20 text-center px-4 mb-8 md:mb-16"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0, scale: progress > 0.1 ? 1 : 0.9 }}
      >
        <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Stage 06 <span className="text-primary/50 mx-1">/</span> 08
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground drop-shadow-2xl mb-4 italic tracking-tighter uppercase font-mono">Neural Adaptation</h2>
        <p className="text-foreground/80 max-w-lg text-sm font-bold leading-relaxed uppercase tracking-widest">Neural-driven difficulty adjustment engine.</p>
      </motion.div>

      {/* Main Module Panel (Intelligence Adaptive Center) */}
      <div className="relative flex-1 w-full flex items-center justify-center px-4">
        <motion.div
          className="glass-card-strong rounded-2xl p-6 md:p-8 w-full max-w-[450px] border border-primary/20 bg-background/95 backdrop-blur-2xl shadow-[0_0_50px_hsl(var(--primary)/0.1)] relative overflow-hidden pointer-events-auto group hover:border-primary/40 transition-colors"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
        {/* Top Metadata Row */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">AI</div>
             <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">System: ADAPT-01</span>
          </div>
          <div className="px-2.5 py-1 rounded-full text-[9px] font-black border border-warning/30 bg-warning/10 text-warning flex items-center gap-1.5 uppercase">
            <div className="w-1 h-1 rounded-full bg-warning animate-pulse" />
            Adjusting
          </div>
        </div>

        {/* Difficulty Meter Visualization */}
        <div className="mb-10 p-6 bg-surface-2/40 border border-border/50 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0" />
          
          <div className="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4">
            <span>Easy</span>
            <span className="text-primary">Target: Hard</span>
            <span>Expert</span>
          </div>

          <div className="h-6 rounded-full bg-muted/20 overflow-hidden relative border border-border/30 p-1">
            <motion.div
              className="h-full rounded-full shadow-[0_0_15px_hsl(var(--primary))]"
              style={{
                width: `${difficultyLevel * 100}%`,
                background: `linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)), hsl(var(--destructive)))`,
              }}
              transition={{ type: "spring", stiffness: 50 }}
            />
            {/* Draggable-like marker decor */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-foreground flex items-center justify-center border-2 border-background shadow-2xl z-20"
              style={{ left: `calc(${difficultyLevel * 100}% - 16px)` }}
            >
               <span className="text-[10px] font-black text-background">⚡</span>
            </motion.div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground">Confidence: <span className="text-success font-bold">96.8%</span></span>
            <span className="text-[10px] font-mono text-muted-foreground">Variance: <span className="text-primary font-bold">±0.02</span></span>
          </div>
        </div>

        {/* Adjustment Logs */}
        <div className="space-y-3 relative">
          <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase border-b border-border/50 pb-2 mb-4">Adjustment Log</p>
          <StatusItem icon="📊" text="Performance analysis complete" active={progress > 0.2} timestamp="14:22:01" />
          <StatusItem icon="🎯" text="Next question adjusted" active={progress > 0.4} timestamp="14:22:04" />
          <StatusItem icon="⚡" text="Difficulty increased → Hard" active={progress > 0.6} timestamp="14:22:12" />
          <StatusItem icon="🧠" text="Personalized path generated" active={progress > 0.8} timestamp="14:22:18" />
        </div>

        {/* Bottom Progress Line */}
        <div className="mt-10 w-full h-[2px] bg-muted/20 overflow-hidden rounded-full">
          <div 
            className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
            style={{ width: `${Math.min(progress * 2.5 * 100, 100)}%` }}
          />
        </div>
      </motion.div>
      </div>
    </div>
  );
};

const StatusItem = ({ icon, text, active, timestamp }: { icon: string; text: string; active: boolean; timestamp: string }) => (
  <motion.div
    className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-transparent transition-all duration-500"
    style={{
      opacity: active ? 1 : 0.2,
      background: active ? 'hsl(var(--primary) / 0.08)' : 'transparent',
      borderColor: active ? 'hsl(var(--primary) / 0.15)' : 'transparent',
      transform: active ? 'translateX(0)' : 'translateX(-5px)',
    }}
  >
    <div className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center text-xs shadow-inner">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] font-bold text-foreground leading-none">{text}</span>
        <span className="text-[9px] font-mono text-muted-foreground opacity-50">{timestamp}</span>
      </div>
      {active && <div className="text-[8px] font-black uppercase text-success tracking-wider">Confirmed</div>}
    </div>
    {active && (
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_5px_hsl(var(--success))]" 
      />
    )}
  </motion.div>
);

export default AdaptiveStage;
