import { useState, useEffect } from "react";
import Navbar from "@/pages/ai-interview/components/Navbar";
import HeroSection from "@/pages/ai-interview/components/HeroSection";
import ScrollExperience from "@/pages/ai-interview/components/ScrollExperience";
import CTASection from "@/pages/ai-interview/components/CTASection";
import ThreeScene from "@/pages/ai-interview/components/ThreeScene";
import { Canvas } from "@react-three/fiber";

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setScrollProgress(Math.max(0, Math.min(1, scrolled / totalHeight)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Fixed 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Add a subtle transparent gradient overlay to blend the 3D scene with the foreground */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background/20 to-transparent" />
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
          <ThreeScene progress={scrollProgress} />
        </Canvas>
      </div>

      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ScrollExperience />
        <CTASection />
      </div>
    </div>
  );
};

export default Index;
