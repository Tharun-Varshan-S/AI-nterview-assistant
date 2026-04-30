import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Props {
  progress: number;
}

const codeLines = [
  "def maxPathSum(root):",
  "    self.max_sum = float('-inf')",
  "",
  "    def dfs(node):",
  "        if not node: return 0",
  "        left = max(dfs(node.left), 0)",
  "        right = max(dfs(node.right), 0)",
  "        total = node.val + left + right",
  "        self.max_sum = max(self.max_sum, total)",
  "        return node.val + max(left, right)",
  "",
  "    dfs(root)",
  "    return self.max_sum",
];

const InterviewStage = ({ progress }: Props) => {
  const opacity = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const lines = Math.floor(progress * codeLines.length * 1.5);
    setVisibleLines(Math.min(lines, codeLines.length));
  }, [progress]);

  const showSuccess = progress > 0.6;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 md:pt-24 pointer-events-none" style={{ opacity }}>
      {/* Central Title Overlay */}
      <motion.div 
        className="flex flex-col items-center z-20 text-center px-4 mb-8 md:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0, y: progress > 0.1 ? 0 : -20 }}
      >
        <div className="text-xs font-mono font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Stage 04 <span className="text-primary/50 mx-1">/</span> 08
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground drop-shadow-2xl mb-4 italic tracking-tighter uppercase font-mono">Live Session</h2>
        <p className="text-foreground/80 max-w-lg text-sm font-bold leading-relaxed uppercase tracking-widest">Code, answer and solve in a real-time interview environment with AI oversight.</p>
      </motion.div>

      {/* Main Module Panel (Code Editor Dashboard) */}
      <div className="relative flex-1 w-full flex items-center justify-center px-4">
        <motion.div 
          className="glass-card-strong rounded-2xl overflow-hidden w-full max-w-[800px] h-full max-h-[450px] shadow-[0_0_50px_hsl(var(--primary)/0.15)] border border-primary/20 bg-background/95 backdrop-blur-2xl flex flex-col pointer-events-auto"
          initial={{ scale: 0.95, y: 50 }}
          animate={{ scale: 1, y: 0 }}
        >
        {/* Top bar (System Controls) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-surface-2/30 backdrop-blur-md">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/40 border border-destructive/50" />
            <div className="w-3 h-3 rounded-full bg-warning/40 border border-warning/50" />
            <div className="w-3 h-3 rounded-full bg-success/40 border border-success/50" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono font-black uppercase tracking-widest">python</span>
            <div className="w-[1px] h-3 bg-border" />
            <span className="text-[10px] text-primary font-mono font-bold">solution.py</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-mono text-success uppercase font-bold tracking-widest">Live: Connected</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-1 md:flex-row overflow-hidden flex-1">
          {/* Question context (Left Panel - Hidden on very small screens to save space) */}
          <div className="hidden sm:block md:w-1/3 p-4 md:p-6 border-b md:border-b-0 md:border-r border-border/30 overflow-y-auto bg-surface-1/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[9px] font-mono bg-destructive/20 text-destructive border border-destructive/30 px-2 py-0.5 rounded uppercase font-black">Hard</span>
              <span className="text-[9px] font-mono text-foreground/60">#142</span>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-4">Maximum Path Sum in Binary Tree</h3>
            <p className="text-[11px] text-foreground/80 leading-relaxed mb-6 font-medium">
              Given a non-empty binary tree, find the maximum path sum. A path is any sequence of nodes from some starting node to any node in the tree.
            </p>
            <div className="rounded-lg bg-surface-2/70 border border-border/50 p-3 space-y-2">
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-foreground/60">Input:</span>
                <span className="text-primary font-bold">[-10,9,20,null,null,15,7]</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-foreground/60">Output:</span>
                <span className="text-success font-bold">42</span>
              </div>
            </div>
          </div>

          {/* Editor (Right Panel) */}
          <div className="flex-1 p-4 md:p-6 font-mono text-[11px] md:text-[12px] bg-black/40 overflow-y-auto custom-scrollbar relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
            {codeLines.slice(0, visibleLines).map((line, i) => (
              <div key={i} className="flex leading-[1.8] group">
                <span className="text-foreground/30 w-6 md:w-8 text-right mr-3 md:mr-4 select-none text-[9px] md:text-[10px]">{i + 1}</span>
                <span className="text-foreground/90 whitespace-pre overflow-x-auto">{colorize(line)}</span>
              </div>
            ))}
            {/* Blinking cursor */}
            {visibleLines < codeLines.length && (
              <span className="inline-block w-[2px] h-4 bg-primary animate-blink ml-12" />
            )}
          </div>
        </div>

        {/* Bottom bar (System Action Bar) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-surface-2/30 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors uppercase tracking-widest">
              <span className="text-xs">▶</span> Run Code
            </button>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-success"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-success flex items-center justify-center text-[8px] border border-success">✓</div>
                <span className="text-[10px] font-bold uppercase tracking-wider">All tests passed</span>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground/60">
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-widest">Runtime</p>
              <p className="text-[10px] font-mono font-bold text-foreground">48ms</p>
            </div>
            <div className="w-[1px] h-6 bg-border/50" />
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-widest">Memory</p>
              <p className="text-[10px] font-mono font-bold text-foreground">16MB</p>
            </div>
          </div>
        </div>

        {/* Bottom Status Progress Line */}
        <div className="h-[2px] w-full bg-muted/30 relative">
          <motion.div 
            className="absolute h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_hsl(var(--primary))]"
            style={{ width: `${Math.min(progress * 1.5 * 100, 100)}%` }}
          />
        </div>
      </motion.div>
      </div>
    </div>
  );
};

function colorize(line: string): React.ReactNode {
  const keywords = ["def", "return", "if", "not", "class", "async", "await"];
  const parts = line.split(/(\b(?:def|return|if|not|class|async|await)\b|self\.\w+|\.\w+\(|'.*?')/g);
  return parts.map((part, i) => {
    if (keywords.includes(part)) return <span key={i} className="text-primary italic">{part}</span>;
    if (part.startsWith("self.")) return <span key={i} className="text-accent underline decoration-primary/20 underline-offset-4">{part}</span>;
    if (part.match(/^\.\w+\(/)) return <span key={i} className="text-warning">{part}</span>;
    if (part.startsWith("'")) return <span key={i} className="text-success">{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

export default InterviewStage;
