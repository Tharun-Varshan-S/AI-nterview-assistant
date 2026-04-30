import { motion } from "framer-motion";

interface Props {
  progress: number;
}

const skills = [
  { name: "React", val: 92 },
  { name: "System Design", val: 78 },
  { name: "Algorithms", val: 85 },
  { name: "TypeScript", val: 94 },
  { name: "APIs", val: 88 },
];

const DashboardStage = ({ progress }: Props) => {
  const opacity = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
  const readiness = Math.round(87 * Math.min(progress * 1.5, 1));

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 md:pt-24 pointer-events-none" style={{ opacity }}>
      
      {/* Central Title Overlay */}
      <motion.div 
        className="flex flex-col items-center z-20 text-center px-4 mb-8 md:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0, y: progress > 0.1 ? 0 : -20 }}
      >
        <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Stage 07 <span className="text-primary/50 mx-1">/</span> 08
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground drop-shadow-2xl mb-4 italic tracking-tighter uppercase font-mono">Analytics & Insights</h2>
        <p className="text-foreground/80 max-w-lg text-sm font-medium leading-relaxed uppercase tracking-widest">Real-time performance tracking and skill calibration.</p>
      </motion.div>

      {/* Main Module Panel (Dashboard Interface) */}
      <div className="relative flex-1 w-full flex items-center justify-center px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full max-w-[1000px] z-10 pointer-events-auto h-full max-h-[60vh] md:max-h-none overflow-y-auto md:overflow-visible custom-scrollbar px-2 md:px-0">
        
        {/* Readiness Command Center (Left) */}
        <motion.div 
          className="md:col-span-8 glass-card-strong rounded-2xl p-6 md:p-8 border border-primary/20 bg-background/95 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <div>
              <p className="text-[10px] text-foreground/80 uppercase tracking-[0.3em] font-black mb-1">Interview Readiness</p>
              <h3 className="text-7xl font-black text-foreground tabular-nums tracking-tighter">
                {readiness}<span className="text-primary text-2xl ml-1 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]">%</span>
              </h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30">
               <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
               <span className="text-[9px] font-black text-success uppercase tracking-widest">Live Engine</span>
            </div>
          </div>

          {/* Readiness Trend Line (Bar charts) */}
          <div className="flex items-end gap-2 h-32 mb-8 bg-surface-2/20 rounded-xl p-4 border border-border/50 relative overflow-hidden">
             {/* Subtle scan beam */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12 translate-x-[-150%] animate-scan" style={{ animationDuration: '4s' }} />
            
            {[40, 55, 48, 62, 58, 82, 75, 88, 80, 87].map((v, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm relative group"
                initial={{ height: 0 }}
                animate={{ height: `${(v / 100) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 1 }}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/40 group-hover:bg-primary transition-colors" />
                <div className="w-full h-full bg-gradient-to-t from-primary/5 to-primary/20" />
              </motion.div>
            ))}
          </div>

          {/* Detailed Skill Analysis */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {skills.map((s, i) => (
              <div key={s.name} className="p-3 bg-surface-2/60 border border-border/70 rounded-xl relative z-10">
                 <p className="text-[9px] text-foreground/80 uppercase font-black tracking-widest mb-2 overflow-hidden text-ellipsis whitespace-nowrap">{s.name}</p>
                 <p className="text-sm font-bold text-foreground font-mono">{s.val}%</p>
                 <div className="h-[2px] w-full bg-muted/30 mt-2 overflow-hidden rounded-full">
                    <div className="h-full bg-primary" style={{ width: `${s.val}%` }} />
                 </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent & Action Center (Right) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          
          {/* Recent sessions */}
          <motion.div 
            className="glass-card-strong rounded-2xl p-6 border border-primary/10 bg-background/80 backdrop-blur-xl flex flex-col"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-6">Recent Records</p>
             <div className="space-y-4">
                {[
                  { name: "Frontend Architecture", score: 92, date: "2H AGO", color: "text-primary" },
                  { name: "Systems Overview", score: 78, date: "1D AGO", color: "text-accent" },
                  { name: "Algorithm Set A", score: 85, date: "3D AGO", color: "text-primary" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between group">
                     <div>
                        <p className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer">{item.name}</p>
                        <p className="text-[8px] text-muted-foreground font-mono mt-0.5">{item.date}</p>
                     </div>
                     <span className={`text-[12px] font-black ${item.color}`}>{item.score}%</span>
                  </div>
                ))}
             </div>
          </motion.div>

          {/* System status & Action */}
          <motion.div 
             className="flex-1 glass-card-strong rounded-2xl p-6 border border-primary/10 bg-background/80 backdrop-blur-xl relative overflow-hidden group"
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
          >
             <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-6">System Health</p>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-mono text-muted-foreground">Neural Path:</span>
                   <span className="text-[10px] font-mono text-success font-black">STABLE</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-mono text-muted-foreground">Calibration:</span>
                   <span className="text-[10px] font-mono text-primary font-black">99.2%</span>
                </div>
             </div>
             
              <button className="w-full mt-8 py-2 rounded-xl bg-primary/20 border border-primary/40 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/30 transition-all shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                Sync Data Feed
             </button>
          </motion.div>
        </div>
      </div>
    </div>

      {/* Footer System Indicator */}
      <div className="absolute bottom-6 md:bottom-10 w-full px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-foreground/60 max-w-[1000px] pointer-events-none gap-2 md:gap-0">
         <div className="flex items-center gap-6 md:gap-10">
            <span>MOD: DASH-X2</span>
            <span>MEM: 247MB</span>
         </div>
         <div className="flex items-center gap-4">
            <span className="animate-pulse text-primary">●</span>
            <span>SYSTEM ENCRYPTED</span>
         </div>
      </div>
    </div>
  );
};

export default DashboardStage;
