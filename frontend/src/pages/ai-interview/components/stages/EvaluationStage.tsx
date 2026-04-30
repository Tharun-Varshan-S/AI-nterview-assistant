import { motion } from "framer-motion";

interface Props {
  progress: number;
}

const scores = [
  { label: "LOGIC SCORE", score: 92, color: "primary", desc: "Algorithmic correctness and efficiency" },
  { label: "READABILITY", score: 88, color: "accent", desc: "Nesting depth and naming conventions" },
  { label: "PERFORMANCE", score: 94, color: "primary", desc: "Big O complexity and space usage" },
  { label: "EDGE CASES", score: 85, color: "warning", desc: "Error handling and input validation" },
];

const EvaluationStage = ({ progress }: Props) => {
  const opacity = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  const displayScore = Math.round(90 * Math.min(progress * 1.5, 1));

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 md:pt-24 pointer-events-none" style={{ opacity }}>
      
      {/* Central Title Overlay */}
      <motion.div 
        className="flex flex-col items-center z-20 text-center px-4 mb-8 md:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0, y: progress > 0.1 ? 0 : -20 }}
      >
        <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Stage 05 <span className="text-primary/50 mx-1">/</span> 08
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground drop-shadow-2xl mb-4 italic tracking-tighter uppercase font-mono">AI Evaluation</h2>
        <p className="text-foreground/80 max-w-lg text-sm font-bold leading-relaxed uppercase tracking-widest">Multi-dimensional scoring with detailed feedback generated in real-time.</p>
      </motion.div>

      {/* Main Module Panel (Performance Dashboard) */}
      <div className="relative flex-1 w-full flex items-center justify-center px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[900px] z-10 h-full max-h-[65vh] md:max-h-none overflow-y-auto md:overflow-visible custom-scrollbar px-2 md:px-0">
        
        {/* Left Column: Specific Metrics */}
        <div className="grid grid-cols-1 gap-4">
          {scores.map((item, i) => {
            const itemProgress = Math.max(0, Math.min(1, (progress - i * 0.1) / 0.4));
            const val = Math.round(item.score * itemProgress);
            const colorClass = item.color === 'primary' ? 'text-primary' : item.color === 'accent' ? 'text-accent' : 'text-warning';
            const barGradient = item.color === 'primary' ? 'from-primary/50 to-primary' : item.color === 'accent' ? 'from-accent/50 to-accent' : 'from-warning/50 to-warning';

            return (
              <motion.div
                key={item.label}
                className="glass-card-strong rounded-2xl p-6 border border-primary/10 bg-background/80 backdrop-blur-xl relative overflow-hidden pointer-events-auto group hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h4 className="text-[10px] font-black tracking-widest text-foreground/70 uppercase mb-1">{item.label}</h4>
                    <span className={`text-4xl font-black tabular-nums transition-all duration-500 ${colorClass}`}>
                      {val}
                    </span>
                  </div>
                  <div className="text-right pb-1">
                    <p className="text-[9px] text-foreground/80 font-mono font-bold leading-tight max-w-[120px] uppercase">{item.desc}</p>
                  </div>
                </div>
                <div className="h-[3px] w-full bg-muted/20 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full bg-gradient-to-r ${barGradient} shadow-[0_0_10px_currentColor]`}
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    style={{ color: 'hsl(var(--' + item.color + '))' }}
                  />
                </div>
                {/* Micro-sparkle decor */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-primary/20" />
                  <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Summary & Final Decision */}
        <div className="flex flex-col gap-4">
          <motion.div 
            className="flex-1 glass-card-strong rounded-2xl p-8 border border-primary/20 bg-background/90 backdrop-blur-2xl flex flex-col items-center justify-center relative overflow-hidden pointer-events-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Status indicator */}
            <div className="absolute top-4 right-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-mono text-success uppercase font-black">Finalized</span>
            </div>

            <div className="absolute top-4 left-6">
               <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-black">Overall Score</span>
            </div>

            <div className="relative mt-8">
              <span className="text-9xl font-black tracking-tighter text-foreground drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)] tabular-nums">
                {displayScore}
              </span>
              <span className="absolute -bottom-2 -right-4 text-primary font-mono font-black text-xl">/100</span>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-[1px] w-8 bg-success/30" />
              <span className="text-success text-[11px] font-black uppercase tracking-[0.2em]">✓ Excellent Performance</span>
              <div className="h-[1px] w-8 bg-success/30" />
            </div>

            {/* AI Feedback Snippet */}
            <div className="mt-12 w-full p-6 border border-border/50 bg-surface-2/30 rounded-xl relative">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-3 text-right">Feedback</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed italic font-medium">
                "Great DFS approach. Consider adding inline comments for complex logic steps. Time complexity O(N) is optimal."
              </p>
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>

      {/* Progress Footer */}
      <div className="absolute bottom-12 flex flex-col items-center gap-3 z-10">
        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">
          <span>05</span>
          <div className="w-16 h-[2px] bg-muted relative">
             <div className="absolute h-full bg-primary" style={{ width: `${Math.min(progress * 2 * 100, 100)}%` }} />
          </div>
          <span>08</span>
        </div>
      </div>
    </div>
  );
};

export default EvaluationStage;
