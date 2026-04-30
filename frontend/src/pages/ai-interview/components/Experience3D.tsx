import { Canvas } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import { useRef, useMemo } from "react";
import HeroSection from "./HeroSection";
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const PARTICLE_COUNT = 3000;

function createTargetPositions() {
  const targets = [];
  
  // 0. Initial/Hero: Floating Orb
  const hero = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 2 + Math.random() * 0.5;
    hero[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    hero[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    hero[i * 3 + 2] = r * Math.cos(phi);
  }
  targets.push(hero);

  // 1. Resume (Document): Flat rectangle
  const doc = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 4;
    const y = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 0.2;
    doc[i * 3] = x;
    doc[i * 3 + 1] = y;
    doc[i * 3 + 2] = z;
  }
  targets.push(doc);

  // 2. Analysis (Neural Brain): Two lobes / sphere
  const brain = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 3 + Math.sin(theta * 4) * 0.5 + Math.cos(phi * 3) * 0.5;
    brain[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    brain[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    brain[i * 3 + 2] = r * Math.cos(phi) * (0.8 + Math.random() * 0.2);
  }
  targets.push(brain);

  // 3. Questions (Node Network): Clustered
  const nodes = new Float32Array(PARTICLE_COUNT * 3);
  const centers = Array.from({ length: 8 }).map(() => ({
    x: (Math.random() - 0.5) * 8,
    y: (Math.random() - 0.5) * 8,
    z: (Math.random() - 0.5) * 8,
  }));
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const center = centers[i % centers.length];
    nodes[i * 3] = center.x + (Math.random() - 0.5) * 2;
    nodes[i * 3 + 1] = center.y + (Math.random() - 0.5) * 2;
    nodes[i * 3 + 2] = center.z + (Math.random() - 0.5) * 2;
  }
  targets.push(nodes);

  // 4. Interview (Waveform): Sine wave
  const wave = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (i / PARTICLE_COUNT) * 16 - 8;
    const y = Math.sin(x * 2) * 2 + (Math.random() - 0.5);
    const z = (Math.random() - 0.5) * 2;
    wave[i * 3] = x;
    wave[i * 3 + 1] = y;
    wave[i * 3 + 2] = z;
  }
  targets.push(wave);

  // 5. Evaluation (Graph): Bars / ascending
  const graph = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (i / PARTICLE_COUNT) * 10 - 5;
    const yBase = (x + 5) * 0.8;
    const y = (Math.random() * yBase) - 2;
    const z = (Math.random() - 0.5) * 2;
    graph[i * 3] = x;
    graph[i * 3 + 1] = y;
    graph[i * 3 + 2] = z;
  }
  targets.push(graph);

  return targets;
}

function MorphingParticles({ progress }: { progress: MotionValue<number> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const targets = useMemo(() => createTargetPositions(), []);

  // Make an independent copy of target[0] for our active buffer
  const positions = useMemo(() => {
    const arr = new Float32Array(targets[0].length);
    arr.set(targets[0]);
    return arr;
  }, [targets]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // Use framer-motion's mapped scroll value
    const rawProgress = progress.get();
    const stageFloat = rawProgress * (targets.length - 1);
    const stageIndex = Math.min(Math.floor(stageFloat), targets.length - 1);
    const nextStageIndex = Math.min(stageIndex + 1, targets.length - 1);
    const lerpFactor = stageFloat - stageIndex;

    const currentPositions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const targetA = targets[stageIndex];
    const targetB = targets[nextStageIndex];

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      // Find the ideal position between the two target geometries
      const ideal = THREE.MathUtils.lerp(targetA[i], targetB[i], lerpFactor);
      
      // Smoothly animate towards it to create fluid continuous motion
      currentPositions[i] = THREE.MathUtils.lerp(currentPositions[i], ideal, 0.1);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Ambient rotations
    pointsRef.current.rotation.y += delta * 0.2;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    
    // Parallax & scale based on stage
    const targetScale = 1.2 + Math.sin(rawProgress * Math.PI) * 0.5;
    pointsRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#3b82f6"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

const pipelineLabels = [
  { title: "📄 Resume Parsing", desc: "Extracting skills and history directly from your uploaded document." },
  { title: "🧠 AI Neural Analysis", desc: "Deep matching skills, identifying your primary domains." },
  { title: "❓ Smart Questions", desc: "Generating adaptive node-based situational queries just for you." },
  { title: "💻 Live Coding", desc: "Interactive waveform-guided technical challenges." },
  { title: "📊 Automated Evaluation", desc: "Graphing your real-time logical and syntactical accuracy." },
];

export default function Experience3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create a 600vh timeline
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Calculate opacity for the Hero section: disappears quickly
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <div ref={containerRef} className="relative w-full text-foreground" style={{ height: "600vh" }}>
      
      {/* 3D Canvas Background fixed behind everything */}
      <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none z-0 bg-background">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 w-full h-full" style={{ background: 'radial-gradient(circle at center, transparent 0%, var(--background) 100%)' }} />
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <MorphingParticles progress={scrollYProgress} />
          </Float>
        </Canvas>
      </div>

      {/* HTML Overlay text Content */}
      <div className="absolute top-0 w-full z-10 pointer-events-none">
        
        {/* Stage 0: Hero Section overlay */}
        <motion.div style={{ opacity: heroOpacity }} className="h-screen flex items-center justify-center pointer-events-auto">
          <HeroSection />
        </motion.div>

        {/* Dynamic scroll labels for stages 1 to 5 */}
        <div className="flex flex-col w-full px-6 max-w-7xl mx-auto items-center pointer-events-auto">
          {pipelineLabels.map((lbl, idx) => {
            // Map each label sequentially down the 600vh space
            const viewportOffset = (idx + 1) * 100; 
            return (
              <div 
                key={idx} 
                className="h-screen w-full flex items-center justify-start lg:pl-12"
              >
                <ScrollStageLabel 
                  progress={scrollYProgress} 
                  index={idx} 
                  total={pipelineLabels.length} 
                  title={lbl.title} 
                  desc={lbl.desc} 
                />
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

function ScrollStageLabel({ progress, index, total, title, desc }: { progress: MotionValue<number>, index: number, total: number, title: string, desc: string }) {
  // Total sections = 6 (Hero + 5 stages)
  const totalSections = total + 1;
  const start = (index + 0.5) / totalSections;
  const peak = (index + 1) / totalSections;
  const end = (index + 1.5) / totalSections;

  const opacity = useTransform(progress, [start, peak, end], [0, 1, 0]);
  const y = useTransform(progress, [start, peak, end], [50, 0, -50]);

  return (
    <motion.div 
      style={{ opacity, y }}
      className="glass-card-strong rounded-2xl p-8 max-w-[400px] border border-primary/30 shadow-[0_0_40px_hsl(217_91%_60%_/_0.2)] bg-background/80 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shrink-0">
          <p className="text-primary font-bold">{index + 1}</p>
        </div>
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-muted-foreground text-base leading-relaxed">{desc}</p>
      <div className="mt-6 w-full h-[2px] bg-gradient-to-r from-primary to-transparent" />
    </motion.div>
  );
}
