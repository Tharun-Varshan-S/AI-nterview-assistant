import { motion } from "framer-motion";

interface Props {
  progress: number; // 0 to 1
}

const ResumeStage = ({ progress }: Props) => {
  const opacity = progress < 0.8 ? 1 : 1 - (progress - 0.8) / 0.2;
  const scale = 0.9 + progress * 0.1;
  const y = (1 - Math.min(progress * 2, 1)) * 40;
  
  const processingStatus = progress > 0.4 ? "COMPLETE" : "PROCESSING";
  const badgeColor = progress > 0.4 ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30";

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none px-4"
      style={{ opacity, transform: `scale(${scale}) translateY(${y}px)` }}
    >
      <div className="glass-card-strong rounded-2xl p-6 md:p-8 w-full max-w-[450px] glow-border relative overflow-hidden backdrop-blur-xl border border-primary/20 bg-background/90 shadow-[0_0_40px_hsl(217_91%_60%_/_0.15)] pointer-events-auto transition-transform hover:scale-[1.02] duration-300">
        
        {/* Scan line */}
        <div
          className="absolute inset-x-0 h-24 scan-line pointer-events-none z-0"
          style={{
            top: `${(progress * 300) % 120 - 20}%`,
            opacity: progress > 0.1 ? 0.6 : 0,
            background: 'linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.2), transparent)',
            transition: 'opacity 0.3s',
          }}
        />

        {/* Top Row */}
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest">
            Stage 01 <span className="text-primary/50 mx-1">/</span> 08
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${badgeColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${progress > 0.4 ? 'bg-success' : 'bg-warning animate-pulse'}`} />
            {processingStatus}
          </div>
        </div>

        {/* Title & Desc */}
        <div className="mb-6 relative z-10">
          <h2 className="text-2xl font-black text-foreground drop-shadow-md mb-2 uppercase font-mono italic tracking-tighter">Document Parsing</h2>
          <p className="text-sm text-foreground/80 leading-relaxed font-medium uppercase tracking-widest">
            Deep learning models parsing unstructured document data to extract professional context and technical capability.
          </p>
        </div>

        {/* Data Layer */}
        <div className="space-y-5 relative z-10 bg-surface-2/50 rounded-xl p-4 border border-border/50">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                AK
              </div>
              <div>
                <h3 className="text-foreground font-bold text-sm">Arjun Kumar</h3>
                <p className="text-primary/80 text-xs font-mono">// Full Stack Developer</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Parse Confidence</div>
              <div className="text-sm font-mono font-bold text-success">98.4%</div>
            </div>
          </div>

          <Section title="Detected Skills" delay={0.1}>
            <div className="flex flex-wrap gap-1.5">
              {["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "AWS"].map((skill, i) => (
                <span 
                  key={skill} 
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/30"
                  style={{ opacity: progress > (i * 0.05 + 0.1) ? 1 : 0.3, transition: 'opacity 0.3s' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Extracted Timeline" delay={0.2}>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground font-medium">Senior Software Engineer</span>
                <span className="text-muted-foreground font-mono text-[10px]">2022–Now</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Software Engineer</span>
                <span className="text-muted-foreground font-mono text-[10px]">2019–2022</span>
              </div>
            </div>
          </Section>
        </div>

        {/* Bottom Progress Line */}
        <div className="mt-6 w-full h-[2px] bg-muted overflow-hidden rounded-full relative z-10">
          <div 
            className="h-full bg-gradient-to-r from-primary/50 via-primary to-accent shadow-[0_0_10px_hsl(var(--primary))] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress * 2.5 * 100, 100)}%` }}
          />
        </div>

      </div>
    </motion.div>
  );
};

const Section = ({ title, children, delay }: { title: string; children: React.ReactNode; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3 + delay, duration: 0.4 }}
    className="border-t border-border/50 pt-3 mt-3"
  >
    <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest mb-2 flex items-center gap-2">
      <span className="w-1 h-1 rounded-full bg-primary" />
      {title}
    </p>
    {children}
  </motion.div>
);

export default ResumeStage;
