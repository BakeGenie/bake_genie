import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import ParticleBackground from '@/components/ParticleBackground';
import EnhancedSidebar from '@/components/enhanced-sidebar/EnhancedSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <ParticleBackground />
      
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">BakeDiary</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex">
        <EnhancedSidebar />
        <main className="flex-1 p-4 md:p-6 max-w-full overflow-auto">
          <div className="bg-background/80 backdrop-blur-md rounded-lg shadow-md p-4 md:p-6 border border-border">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;