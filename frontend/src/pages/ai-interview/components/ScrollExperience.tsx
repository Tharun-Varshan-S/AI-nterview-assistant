import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ResumeStage from "./stages/ResumeStage";
import AnalysisStage from "./stages/AnalysisStage";
import QuestionStage from "./stages/QuestionStage";
import InterviewStage from "./stages/InterviewStage";
import EvaluationStage from "./stages/EvaluationStage";
import AdaptiveStage from "./stages/AdaptiveStage";
import DashboardStage from "./stages/DashboardStage";
import PipelineStage from "./stages/PipelineStage";

const TOTAL_STAGES = 8;
const SCROLL_HEIGHT_PER_STAGE = 100; // vh

const stageLabels = [
  "Document Parsing",
  "Neural Extraction",
  "Smart Generation",
  "Live Interview",
  "AI Evaluation",
  "Neural Adaptation",
  "System Analytics",
  "Final Pipeline",
];

const ScrollExperience = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(1, scrolled / totalHeight);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger once on mount
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use a slightly different mapping to ensure the last stage stays visible during the last scroll
  const totalProgress = scrollProgress * (TOTAL_STAGES - 1);
  const currentStage = Math.min(Math.floor(totalProgress), TOTAL_STAGES - 1);
  const nextStage = Math.min(currentStage + 1, TOTAL_STAGES - 1);
  const stageProgress = totalProgress - currentStage;

  return (
    <div
      ref={containerRef}
      style={{ height: `${TOTAL_STAGES * SCROLL_HEIGHT_PER_STAGE}vh` }}
      className="relative"
    >
      {/* Fixed viewport container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        
        {/* Background Layer: Deep Ambient Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full"
            style={{ 
              scale: 1 + Math.sin(scrollProgress * 10) * 0.2,
              opacity: 0.3 + Math.cos(scrollProgress * 5) * 0.1
            }}
          />
        </div>

        {/* System Navigation (Right) */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
          {stageLabels.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end gap-4 group cursor-pointer transition-all duration-300"
              onClick={() => {
                if (!containerRef.current) return;
                const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
                // Land near the middle of the requested stage so its content is visible immediately.
                const target = Math.min(
                  totalHeight,
                  ((i + 0.5) / (TOTAL_STAGES - 1)) * totalHeight,
                );
                window.scrollTo({ top: target, behavior: "smooth" });
              }}
            >
              <div className="flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Stage 0{i+1}</span>
                 <span className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap">{label}</span>
              </div>
              <div className="relative">
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    i === currentStage ? 'w-4 h-4 bg-primary' : i < currentStage ? 'bg-primary/40' : 'bg-muted'
                  }`}
                  style={{
                    boxShadow: i === currentStage ? '0 0 15px hsl(var(--primary))' : 'none',
                  }}
                />
                {i === currentStage && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute -inset-1 border border-primary/50 rounded-full" 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Global Progress Bar (Bottom) */}
        <div className="absolute bottom-8 left-12 right-12 h-[1px] bg-muted/20 z-40">
           <motion.div 
              className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_hsl(var(--primary))]"
              style={{ width: `${scrollProgress * 100}%` }}
           />
           <div className="flex justify-between mt-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">
              <span>System Initialization</span>
              <span>Process Complete</span>
           </div>
        </div>

        {/* Top-Right Status Badge Removed to resolve Navbar overlap. Now hosted in Navbar */}

        {/* Stage Content Layer */}
        <div className="relative w-full h-full z-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
             <motion.div
               key={currentStage}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.5 }}
               className="w-full h-full"
             >
                {currentStage === 0 && <ResumeStage progress={stageProgress} />}
                {currentStage === 1 && <AnalysisStage progress={stageProgress} />}
                {currentStage === 2 && <QuestionStage progress={stageProgress} />}
                {currentStage === 3 && <InterviewStage progress={stageProgress} />}
                {currentStage === 4 && <EvaluationStage progress={stageProgress} />}
                {currentStage === 5 && <AdaptiveStage progress={stageProgress} />}
                {currentStage === 6 && <DashboardStage progress={stageProgress} />}
                {currentStage === 7 && <PipelineStage progress={stageProgress} />}
             </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ScrollExperience;
