import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '@/contexts/ThemeContext';

const ParticleBackground = () => {
  const { theme } = useTheme();
  
  // Get particle colors based on current theme
  const getParticleColors = () => {
    const colors = [];
    
    // Add theme-specific colors
    colors.push(`hsl(var(--particle-color-1))`);
    colors.push(`hsl(var(--particle-color-2))`);
    colors.push(`hsl(var(--particle-color-3))`);
    
    return colors;
  };
  
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="fixed inset-0 -z-10"
      options={{
        fullScreen: false,
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        particles: {
          color: {
            value: getParticleColors(),
          },
          links: {
            color: {
              value: getParticleColors(),
            },
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: true,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 60,
          },
          opacity: {
            value: 0.4,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground;