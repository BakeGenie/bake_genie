import React from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import useMobile from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isMobile = useMobile();
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  React.useEffect(() => {
    if (isMobileMenuOpen && isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location, isMobile]);

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/enquiry-form"];
  const isPublicRoute = publicRoutes.includes(location);
  
  // Check if we're on the landing page or login/register pages
  const isFullscreenPage = location === "/" || location === "/login" || location === "/register";
  
  // If on landing page or login/register pages, don't show the app layout with sidebar
  if (isFullscreenPage) {
    return <div className="h-screen">{children}</div>;
  }
  
  // If route requires authentication, wrap with ProtectedRoute
  const routeContent = isPublicRoute ? children : <ProtectedRoute>{children}</ProtectedRoute>;
  
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
          <div className="h-16 flex items-center px-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none"
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
              <span className="text-primary text-2xl">
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
              <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
                BakeGenie
              </span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {routeContent}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
