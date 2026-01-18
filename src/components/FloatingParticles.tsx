import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  type: 'turquoise' | 'turquoise-bright' | 'gold' | 'white';
}

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const types: Particle['type'][] = ['turquoise', 'turquoise-bright', 'gold', 'white'];
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < 60; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 8 + 3,
          delay: Math.random() * 5,
          duration: Math.random() * 12 + 8,
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  const getParticleStyle = (type: Particle['type']) => {
    switch (type) {
      case 'turquoise': 
        return {
          background: 'hsl(174 100% 42%)',
          boxShadow: '0 0 15px hsl(174 100% 50% / 0.8), 0 0 30px hsl(174 100% 42% / 0.5)'
        };
      case 'turquoise-bright': 
        return {
          background: 'hsl(174 100% 50%)',
          boxShadow: '0 0 20px hsl(174 100% 50% / 0.9), 0 0 40px hsl(174 100% 50% / 0.6)'
        };
      case 'gold': 
        return {
          background: 'hsl(51 100% 50%)',
          boxShadow: '0 0 15px hsl(51 100% 50% / 0.8), 0 0 30px hsl(51 100% 50% / 0.5)'
        };
      case 'white': 
        return {
          background: 'hsl(0 0% 100%)',
          boxShadow: '0 0 10px hsl(174 100% 50% / 0.6), 0 0 20px hsl(0 0% 100% / 0.4)'
        };
      default: 
        return {
          background: 'hsl(174 100% 50%)',
          boxShadow: '0 0 15px hsl(174 100% 50% / 0.8)'
        };
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Central 5D Radial Glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(174 100% 50% / 0.12) 0%, hsl(174 100% 42% / 0.06) 40%, transparent 70%)',
        }}
      />

      {/* Sacred Geometry Background */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="sacred-geometry-turquoise" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(174 100% 42%)" strokeWidth="0.3" />
              <circle cx="10" cy="10" r="4" fill="none" stroke="hsl(51 100% 50%)" strokeWidth="0.2" />
              <polygon points="10,2 18,10 10,18 2,10" fill="none" stroke="hsl(174 100% 50%)" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sacred-geometry-turquoise)" />
        </svg>
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            ...getParticleStyle(particle.type),
          }}
          animate={{
            y: [0, -150, -300],
            x: [0, Math.random() * 60 - 30, Math.random() * 120 - 60],
            opacity: [0, 0.9, 0],
            scale: [0.5, 1.3, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Large Glowing Orbs - Turquoise Theme */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ 
          left: '5%', 
          top: '15%',
          background: 'radial-gradient(circle, hsl(174 100% 50% / 0.15), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ 
          right: '10%', 
          top: '50%',
          background: 'radial-gradient(circle, hsl(174 100% 42% / 0.12), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.12, 0.2, 0.12],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full blur-3xl"
        style={{ 
          left: '40%', 
          bottom: '5%',
          background: 'radial-gradient(circle, hsl(51 100% 50% / 0.08), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </div>
  );
};

export default FloatingParticles;