import React from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import useMobile from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isMobile = useMobile();
  const [location] = useLocation();
  const { toast } = useToast();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  React.useEffect(() => {
    if (isMobileMenuOpen && isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location, isMobile]);

  // Check if we're on the landing page
  const isLandingPage = location === "/";
  
  // If on landing page, don't show the app layout with sidebar
  if (isLandingPage) {
    return <div className="h-screen">{children}</div>;
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={!isMobile || isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentPath={location}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="h-16 flex items-center px-4 border-b border-gray-200 bg-white">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="ml-4 flex items-center">
              <span className="text-primary-500 text-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </span>
              <span className="ml-2 text-xl font-semibold text-gray-800">
                BakeDiary
              </span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
