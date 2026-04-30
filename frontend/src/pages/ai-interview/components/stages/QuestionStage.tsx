import { motion } from "framer-motion";

interface Props {
  progress: number;
}

const questions = [
  { 
    q: "Explain how React's Virtual DOM works and why it improves performance.", 
    level: "Easy", 
    tag: "React", 
    time: "8 min", 
    angle: -40, 
    r: 220 
  },
  { 
    q: "Design a distributed cache with LRU eviction policy supporting concurrent reads.", 
    level: "Hard", 
    tag: "System Design", 
    time: "25 min", 
    angle: 30, 
    r: 280 
  },
  { 
    q: "Given a binary tree, find the maximum path sum between any two nodes.", 
    level: "Medium", 
    tag: "Trees", 
    time: "20 min", 
    angle: 150, 
    r: 250 
  },
  { 
    q: "Design a RESTful API for a ride-sharing app including endpoints and auth.", 
    level: "Medium", 
    tag: "API Design", 
    time: "15 min", 
    angle: -160, 
    r: 240 
  },
];

const QuestionStage = ({ progress }: Props) => {
  const opacity = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 md:pt-24 pointer-events-none" style={{ opacity }}>
      {/* Central Title Overlay */}
      <motion.div 
        className="flex flex-col items-center z-20 text-center px-4 mb-8 md:mb-16"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0, scale: progress > 0.1 ? 1 : 0.9 }}
      >
        <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Stage 03 <span className="text-primary/50 mx-1">/</span> 08
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground drop-shadow-2xl mb-4 italic tracking-tight uppercase font-mono italic tracking-tighter">Smart Generation</h2>
        <p className="text-foreground/80 max-w-md text-sm opacity-90 leading-relaxed font-bold uppercase tracking-widest">AI generates personalized questions based on your unique skill profile.</p>
        
        {/* Signal pulses */}
        <div className="flex gap-1 mt-6">
          {[1,2,3].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        {/* AI Core center */}
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center z-10 relative">
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center glow-primary">
            <span className="text-primary text-xl">🤖</span>
          </div>
        </div>

        {/* Question Cards (System Component Panels) */}
        {questions.map((item, i) => {
          const itemProgress = Math.max(0, Math.min(1, (progress - i * 0.1) / 0.4));
          const rad = (item.angle * Math.PI) / 180;
          const x = Math.cos(rad) * item.r * itemProgress;
          const y = Math.sin(rad) * item.r * itemProgress;
          
          const badgeColor = item.level === "Easy" ? "text-success border-success/30 bg-success/10" : 
                            item.level === "Medium" ? "text-warning border-warning/30 bg-warning/10" : 
                            "text-destructive border-destructive/30 bg-destructive/10";

          return (
            <motion.div
              key={i}
              className="absolute z-10"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                opacity: itemProgress,
                transform: `translate(-50%, -50%) scale(${itemProgress})`,
              }}
            >
              {/* Connection line to center with pulse */}
              <svg className="absolute pointer-events-none" style={{ left: '50%', top: '50%', width: 600, height: 600, transform: 'translate(-50%, -50%)', overflow: 'visible', zIndex: -1 }}>
                <line
                  x1="0" y1="0"
                  x2={-x} y2={-y}
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="1"
                  className="animate-pulse"
                />
                <circle r="3" fill="hsl(var(--primary))">
                  <animateMotion 
                    dur="2s" 
                    repeatCount="indefinite" 
                    path={`M 0 0 L ${-x} ${-y}`} 
                  />
                </circle>
              </svg>

              {/* AI Module Panel (Question Card) */}
              <motion.div 
                className="glass-card-strong rounded-xl p-4 md:p-5 w-64 md:w-72 border border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-primary/50 transition-colors pointer-events-auto"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
              >
                {/* Inner Glow Border effect */}
                <div className="absolute inset-0 border-[1px] border-primary/5 rounded-xl pointer-events-none" />
                
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border ${badgeColor}`}>
                    {item.level.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Active</span>
                  </div>
                </div>

                <div className="h-[2px] w-12 bg-primary/30 mb-4" />

                <p className="text-foreground text-[13px] leading-relaxed font-semibold mb-6">
                  {item.q}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">{item.tag}</span>
                    <span className="text-primary/30 text-[10px]">•</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.time}</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-primary/20 flex items-center justify-center text-[10px] text-primary group-hover:bg-primary/10 transition-colors">
                    ?
                  </div>
                </div>

                {/* Bottom pulse line */}
                <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 w-full opacity-40 group-hover:opacity-80 transition-opacity" />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionStage;
