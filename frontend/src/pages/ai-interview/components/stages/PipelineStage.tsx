import { motion } from "framer-motion";

interface Props {
  progress: number;
}

const steps = [
  { icon: "📄", label: "PARSE", sub: "Data Extraction", color: "from-primary/20", border: "border-primary/30" },
  { icon: "🧠", label: "ANALYSIS", sub: "Domain Mapping", color: "from-accent/20", border: "border-accent/30" },
  { icon: "❓", label: "GENERATE", sub: "Smart Queries", color: "from-primary/20", border: "border-primary/30" },
  { icon: "💻", label: "INTERVIEW", sub: "Live Session", color: "from-accent/20", border: "border-accent/30" },
  { icon: "📊", label: "EVALUATE", sub: "AI Scoring", color: "from-primary/20", border: "border-primary/30" },
  { icon: "🎯", label: "ANALYTICS", sub: "Final Insights", color: "from-accent/20", border: "border-accent/30" },
];

const PipelineStage = ({ progress }: Props) => {
  const opacity = progress < 0.1 ? progress / 0.1 : 1;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6" style={{ opacity }}>
      
      {/* Central Title Overlay */}
      <motion.div 
        className="absolute top-[8%] flex flex-col items-center z-20 text-center px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0, y: progress > 0.1 ? 0 : -20 }}
      >
        <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Stage 08 <span className="text-primary/50 mx-1">/</span> 08
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground drop-shadow-2xl mb-4 italic tracking-tighter uppercase font-mono">Final Pipeline</h2>
        <p className="text-foreground/80 max-w-lg text-sm font-bold leading-relaxed uppercase tracking-widest">End-to-end interview automation engine.</p>
        
        {/* Status Badge */}
        <div className="mt-8 px-4 py-1.5 rounded-full bg-success/10 border border-success/30 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_hsl(var(--success))]" />
           <span className="text-[10px] font-black text-success uppercase tracking-[0.3em]">System Pipeline: Optimized</span>
        </div>
      </motion.div>

      {/* Pipeline Grid Visualization */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 w-full max-w-6xl z-10 pointer-events-auto mt-24 lg:mt-32">
        {steps.map((step, i) => {
          const itemProgress = Math.min(1, Math.max(0, (progress - i * 0.08) / 0.2));
          
          return (
            <motion.div
              key={step.label}
              className="relative group"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: itemProgress }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Connector lines (Desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 left-[100%] w-6 h-[1px] bg-gradient-to-r from-border to-transparent z-0" />
              )}
              
              {/* Architecture Card */}
              <div className={`glass-card-strong rounded-2xl p-6 border ${step.border} bg-background/90 backdrop-blur-3xl shadow-xl relative overflow-hidden flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:bg-surface-2/40`}>
                 {/* Card Background Glow */}
                 <div className={`absolute inset-0 bg-gradient-to-br ${step.color} to-transparent opacity-30`} />
                 
                 {/* Step ID */}
                 <div className="absolute top-3 left-3 text-[10px] font-mono font-black text-foreground/40">
                    ID-0{i+1}
                 </div>

                 {/* Icon with Ring */}
                 <div className="w-16 h-16 rounded-full border border-border/50 bg-surface-2/50 flex items-center justify-center text-3xl mb-6 shadow-inner relative z-10">
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity" />
                    {step.icon}
                 </div>

                  {/* Text Info */}
                 <h3 className="text-[13px] font-black text-foreground tracking-widest mb-1 relative z-10">{step.label}</h3>
                 <p className="text-[10px] text-foreground/70 uppercase tracking-tight relative z-10 font-bold">{step.sub}</p>

                 {/* Micro status progress line */}
                 <div className="mt-6 w-full h-[1px] bg-muted/20 relative z-10 overflow-hidden">
                    <motion.div 
                      className="absolute h-full bg-primary"
                      initial={{ left: '-100%' }}
                      animate={{ left: '0%' }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Visualization: Floating Data Strings */}
      <div className="absolute bottom-20 w-full flex justify-center opacity-20 pointer-events-none">
         <div className="flex gap-1">
            {[...Array(40)].map((_, i) => (
              <motion.div 
                key={i} 
                className="w-[1px] bg-primary/40"
                animate={{ height: [10, 40, 15, 30, 20] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
         </div>
      </div>
    </div>
  );
};

export default PipelineStage;
