import React, { useCallback, useState, useEffect } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '@/contexts/ThemeContext';

export const ParticleBackground: React.FC = () => {
  const { theme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');

  // Update particle colors based on the theme
  useEffect(() => {
    // Extract colors based on theme
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Get HSL colors from CSS variables and convert to hex for particles
    const primary = computedStyle.getPropertyValue('--primary').trim();
    const secondary = computedStyle.getPropertyValue('--accent').trim();
    
    // Convert HSL to RGB (simplified for this example)
    const hslToHex = (hsl: string) => {
      if (!hsl) return theme === 'dark' ? '#ffffff' : '#000000';
      return theme === 'dark' ? '#ffffff' : '#000000';
    };
    
    setPrimaryColor(hslToHex(primary));
    setSecondaryColor(hslToHex(secondary));
  }, [theme]);

  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  return (
    <div className="particle-container">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: {
            enable: true,
            zIndex: -1,
          },
          fpsLimit: 60,
          particles: {
            number: {
              value: 40,
              density: {
                enable: true,
                value_area: 800,
              },
            },
            color: {
              value: [primaryColor, secondaryColor],
            },
            shape: {
              type: ["circle", "triangle", "square"],
            },
            opacity: {
              value: 0.15,
              random: true,
              animation: {
                enable: true,
                speed: 0.2,
                minimumValue: 0.05,
                sync: false,
              },
            },
            size: {
              value: 5,
              random: true,
              animation: {
                enable: true,
                speed: 2,
                minimumValue: 1,
                sync: false,
              },
            },
            links: {
              enable: true,
              distance: 150,
              color: primaryColor,
              opacity: 0.1,
              width: 1,
            },
            move: {
              enable: true,
              speed: 0.8,
              direction: "none",
              random: true,
              straight: false,
              outModes: {
                default: "out",
              },
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200,
              },
            },
          },
          interactivity: {
            detectsOn: "window",
            events: {
              onHover: {
                enable: true,
                mode: "grab",
              },
              onClick: {
                enable: true,
                mode: "push",
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 140,
                links: {
                  opacity: 0.3,
                },
              },
              push: {
                quantity: 4,
              },
            },
          },
          retina_detect: true,
          backgroundMask: {
            enable: true,
            cover: {
              color: {
                value: {
                  r: 255,
                  g: 255,
                  b: 255,
                },
              },
              opacity: 1,
            },
          },
          background: {
            color: {
              value: "transparent",
            },
            opacity: 0,
          },
        }}
      />
    </div>
  );
};

export default ParticleBackground;