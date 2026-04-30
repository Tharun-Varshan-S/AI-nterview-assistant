import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  progress: number;
}

const AnalysisStage = ({ progress }: Props) => {
  const opacity = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  const nodes = useMemo(() => [
    { label: "Skills detected", value: "14", x: -180, y: -100, color: "primary", icon: "⚡" },
    { label: "Experience", value: "4 yrs", x: 180, y: -80, color: "accent", icon: "⏱️" },
    { label: "Domain", value: "Backend", x: -160, y: 120, color: "primary", icon: "📊" },
    { label: "AI Ready", value: "94%", x: 160, y: 100, color: "accent", icon: "🧠" },
    { label: "Graph built", value: "23 nodes", x: 0, y: -160, color: "primary", icon: "🔗" },
  ], []);

  const coreScale = 1 + progress * 0.2;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 md:pt-24 pointer-events-none" style={{ opacity }}>
      {/* Central Title Overlay */}
      <motion.div 
        className="flex flex-col items-center z-20 text-center px-4 mb-8 md:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0, y: progress > 0.1 ? 0 : -20 }}
      >
        <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Stage 02 <span className="text-primary/50 mx-1">/</span> 08
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-foreground drop-shadow-xl mb-3 uppercase font-mono italic tracking-tighter">Neural Extraction</h2>
        <p className="text-foreground/80 max-w-md text-sm font-medium leading-relaxed uppercase tracking-widest">Deep learning models extract professional context and technical capability</p>
      </motion.div>

      {/* Content Area */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        {/* AI Core */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center z-10 relative"
          style={{ transform: `scale(${coreScale})`, boxShadow: '0 0 60px hsl(217 91% 60% / 0.2), inset 0 0 30px hsl(217 91% 60% / 0.2)' }}
        >
          <div className="absolute inset-0 rounded-full border-t-2 border-primary/80 animate-spin-slow" />
          <div className="absolute inset-0 rounded-full border-b-2 border-accent/80 animate-spin-reverse" />
          <div className="w-10 h-10 rounded-full bg-primary/40 animate-pulse-glow shadow-[0_0_30px_hsl(var(--primary))]" />
        </motion.div>

        {/* Data Nodes (Floating Labels) */}
        {nodes.map((node, i) => {
          const nodeProgress = Math.max(0, Math.min(1, (progress - i * 0.1) / 0.3));
          return (
            <motion.div
              key={node.label}
              className="absolute z-10"
              style={{
                left: `calc(50% + ${node.x * nodeProgress}px)`,
                top: `calc(50% + ${node.y * nodeProgress}px)`,
                opacity: nodeProgress,
                transform: `translate(-50%, -50%) scale(${nodeProgress})`,
              }}
            >
              {/* Connection line */}
              <svg className="absolute pointer-events-none" style={{ left: '50%', top: '50%', width: 400, height: 400, transform: 'translate(-50%, -50%)', overflow: 'visible', zIndex: -1 }}>
                <line
                  x1="0" y1="0"
                  x2={-node.x * nodeProgress} y2={-node.y * nodeProgress}
                  stroke={node.color === 'primary' ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--accent) / 0.4)'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Floating Card */}
              <motion.div 
                className="glass-card rounded-xl px-4 py-2 flex items-center gap-3 whitespace-nowrap border border-primary/20 bg-background/80 backdrop-blur-md shadow-[0_0_20px_hsl(217_91%_60%_/_0.15)]"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              >
                <div className="text-sm">{node.icon}</div>
                <div>
                  <p className="text-[10px] text-foreground/70 uppercase tracking-widest font-black leading-none mb-1">{node.label}</p>
                  <p className={`text-xs font-bold ${node.color === 'primary' ? 'text-primary' : 'text-accent'} uppercase`}>{node.value}</p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Progress Line */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-muted overflow-hidden rounded-full z-10">
        <div 
          className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary))] transition-all duration-300"
          style={{ width: `${Math.min(progress * 3 * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default AnalysisStage;
