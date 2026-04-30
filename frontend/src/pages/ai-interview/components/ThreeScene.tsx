import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

interface ThreeSceneProps {
  progress: number;
}

const PARTICLE_COUNT = 3000; // Optimized density
const NODE_COUNT = 12;

function createTargetPositions() {
  const targets = [];
  
  // 0. Hero: Diffuse Starfield (Wide spread)
  const hero = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 5 + Math.random() * 4;
    hero[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    hero[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    hero[i * 3 + 2] = r * Math.cos(phi);
  }
  targets.push(hero);

  // 1. Resume: THE PILLAR (Prominent Vertical column)
  const pillar = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const height = 18; 
    const radius = 1.2;
    const theta = Math.random() * Math.PI * 2;
    // Offset to right to avoid central text
    pillar[i * 3] = 4.5 + (Math.sqrt(Math.random()) * radius * Math.cos(theta)); 
    pillar[i * 3 + 1] = (Math.random() - 0.5) * height;
    pillar[i * 3 + 2] = (Math.random() - 0.5) * radius * 4;
  }
  targets.push(pillar);

  // 2. Analysis: THE NEBULA (Radiant dense sphere)
  const nebula = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = Math.pow(Math.random(), 3) * 6; // Concentrated center
    nebula[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    nebula[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    nebula[i * 3 + 2] = r * Math.cos(phi);
  }
  targets.push(nebula);

  // 3. Questions: Neural Node Clusters
  const questions = new Float32Array(PARTICLE_COUNT * 3);
  const clusterCenters = Array.from({ length: 10 }).map(() => ({
    x: (Math.random() - 0.5) * 14,
    y: (Math.random() - 0.5) * 10,
    z: (Math.random() - 0.5) * 6,
  }));
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const center = clusterCenters[i % clusterCenters.length];
    const r = 0.5 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    questions[i * 3] = center.x + r * Math.sin(phi) * Math.cos(theta);
    questions[i * 3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta);
    questions[i * 3 + 2] = center.z + r * Math.cos(phi);
  }
  targets.push(questions);

  // 4. Interview: Energetic Waveform
  const wave = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (i / PARTICLE_COUNT) * 30 - 15;
    const intensity = Math.exp(-Math.pow(x / 8, 2));
    const y = Math.sin(x * 1.5) * 8 * intensity + (Math.random() - 0.5) * 1.5;
    const z = Math.cos(x * 1.5) * 3 * intensity + (Math.random() - 0.5) * 1.5;
    wave[i * 3] = x;
    wave[i * 3 + 1] = y;
    wave[i * 3 + 2] = z;
  }
  targets.push(wave);

  // Remaining stages... (repeating wave/nebula patterns for flow)
  for (let s = 5; s < 9; s++) {
    const filler = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 3 + Math.random() * 3 + s;
      filler[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      filler[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      filler[i * 3 + 2] = r * Math.cos(phi);
    }
    targets.push(filler);
  }

  return targets;
}

export default function ThreeScene({ progress }: ThreeSceneProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);
  
  const targets = useMemo(() => createTargetPositions(), []);
  const initialPositions = useMemo(() => new Float32Array(targets[0]), [targets]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // 1. Particle Morphing & Life
    const stageFloat = progress * (targets.length - 1);
    const stageIndex = Math.floor(stageFloat);
    const nextStageIndex = Math.min(stageIndex + 1, targets.length - 1);
    const lerpFactor = stageFloat - stageIndex;

    const currentPos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const tA = targets[stageIndex];
    const tB = targets[nextStageIndex];

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      const ideal = THREE.MathUtils.lerp(tA[i], tB[i], lerpFactor);
      
      // Dynamic noise jitter
      const shimmer = Math.sin(state.clock.elapsedTime * 4 + i) * 0.08;
      const pulse = Math.cos(state.clock.elapsedTime * 2 + (i % 50)) * 0.04;
      
      currentPos[i] = THREE.MathUtils.lerp(currentPos[i], ideal + shimmer + pulse, 0.04); 
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // 2. Systems Interaction
    pointsRef.current.rotation.y += delta * 0.12;
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.5;
      coreRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.12);
    }
    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.15;
    }

    // Dynamic color shifting based on progress
    if (pointsRef.current.material instanceof THREE.PointsMaterial) {
      const hue = 200 + progress * 50; 
      pointsRef.current.material.color.setHSL(hue / 360, 1, 0.7);
    }

    // Fade nucleus out at the very end
    const coreVisibility = progress < 0.98 ? 1 : 0;
    if (coreRef.current) coreRef.current.visible = coreVisibility > 0.5;
  });

  return (
    <group>
      {/* Radiant AI Nucleus */}
      <Float speed={3} rotationIntensity={1.2} floatIntensity={1}>
        <group ref={coreRef}>
          <Sphere args={[0.55, 48, 48]}>
            <MeshDistortMaterial
              color="#3b82f6"
              emissive="#2563eb"
              emissiveIntensity={3.5}
              speed={5}
              distort={0.5}
            />
          </Sphere>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.9, 0.006, 16, 120]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
          </mesh>
        </group>
      </Float>

      {/* Orbit Array */}
      <group ref={orbitRef}>
        {Array.from({ length: NODE_COUNT }).map((_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / NODE_COUNT]}>
            <mesh position={[5.5, 0, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
            </mesh>
            <mesh position={[2.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.003, 0.003, 5.5, 8]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Primary High-Visibility Point Array */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={initialPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#3b82f6"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* Background Mask */}
      <mesh scale={30}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#000" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
