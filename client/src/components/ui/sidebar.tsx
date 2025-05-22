import React from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { 
  HomeIcon, 
  FileTextIcon, 
  ContactIcon, 
  MessageSquareIcon, 
  ListTodoIcon, 
  CalendarIcon, 
  BookOpenIcon, 
  TagIcon, 
  BarChartIcon, 
  DollarSignIcon, 
  PrinterIcon, 
  Hammer, 
  UserIcon,
  XIcon,
  UtensilsIcon,
  DatabaseIcon,
  LinkIcon,
  LogOutIcon,
  PercentIcon,
  SettingsIcon,
  Moon,
  Sun
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFeatures } from "@/contexts/features-context";
import { useTheme } from "@/hooks/use-theme";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

interface SidebarLink {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  sublinks?: boolean;
  featureId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPath }) => {
  // Get features context to check enabled/disabled features
  const { isFeatureEnabled } = useFeatures();
  
  // Get theme context
  const { theme, setTheme } = useTheme();
  
  // Fetch task count
  const { data: taskCount } = useQuery<number>({
    queryKey: ["/api/tasks/count"],
  });

  // Fetch enquiry count
  const { data: enquiryCount } = useQuery<number>({
    queryKey: ["/api/enquiries/count"],
  });

  const allLinks: SidebarLink[] = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <HomeIcon className="w-5 h-5" />,
      featureId: "dashboard",
    },
    {
      path: "/orders",
      label: "Orders & Quotes",
      icon: <FileTextIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "orders",
    },
    {
      path: "/contacts",
      label: "Contacts",
      icon: <ContactIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "contacts",
    },
    {
      path: "/enquiries",
      label: "Enquiries",
      icon: <MessageSquareIcon className="w-5 h-5" />,
      badge: enquiryCount || 0,
      featureId: "enquiries",
    },
    {
      path: "/tasks",
      label: "Tasks",
      icon: <ListTodoIcon className="w-5 h-5" />,
      badge: taskCount || 0,
      featureId: "tasks",
    },
    {
      path: "/calendar",
      label: "Calendar",
      icon: <CalendarIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "calendar",
    },
    {
      path: "/recipes",
      label: "Recipes & Ingredients",
      icon: <BookOpenIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "recipes",
    },
    {
      path: "/products",
      label: "Products",
      icon: <TagIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "products",
    },
    {
      path: "/reports",
      label: "Reports & Lists",
      icon: <BarChartIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "reports",
    },
    {
      path: "/business-expenses",
      label: "Business & Expenses",
      icon: <DollarSignIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "expenses",
    },
    {
      path: "/printables",
      label: "Printables",
      icon: <PrinterIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "printables",
    },
    {
      path: "/tax-rates",
      label: "Tax Rates",
      icon: <PercentIcon className="w-5 h-5" />,
      featureId: "tax-rates",
    },
    {
      path: "/tools",
      label: "Tools",
      icon: <Hammer className="w-5 h-5" />,
      sublinks: true,
      featureId: "tools",
    },
    {
      path: "/integrations",
      label: "Integrations",
      icon: <LinkIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "integrations",
    },
    {
      path: "/data",
      label: "Data Import/Export",
      icon: <DatabaseIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "data",
    },

    {
      path: "/settings",
      label: "Settings",
      icon: <SettingsIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "settings",
    },
    {
      path: "/account",
      label: "Account",
      icon: <UserIcon className="w-5 h-5" />,
      sublinks: true,
      featureId: "account",
    },
  ];
  
  // Filter links based on enabled features
  const links: SidebarLink[] = allLinks.filter(link => 
    isFeatureEnabled(link.featureId || '')
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar Overlay (Mobile only) */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="md:relative fixed inset-y-0 left-0 z-50 md:z-auto flex flex-col w-64 bg-[#2A3846] text-white">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[#3A4956]">
          <div className="flex items-center">
            <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cake-like icon */}
              <path d="M16 6 L19 9 L22 7 L20 11 L24 13 L20 15 L22 19 L18 17 L16 21 L14 17 L10 19 L12 15 L8 13 L12 11 L10 7 L14 9 Z" fill="#ffffff" stroke="#ffffff" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="4" fill="#ffffff" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="2" fill="#ffffff" strokeWidth="0.5" />
            </svg>
            <span className="ml-2 text-xl font-semibold text-white">BakeDiary</span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto md:hidden text-white hover:text-gray-300"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-2">
          <ul>
            {links.map((link) => (
              <li key={link.path}>
                <Link href={link.path}>
                  <div
                    className={`sidebar-link flex items-center justify-between px-4 py-3 text-sm cursor-pointer ${
                      currentPath === link.path || currentPath.startsWith(`${link.path}/`)
                        ? "bg-[#394B5F]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="w-5 text-white">
                        {link.icon}
                      </span>
                      <span className="ml-3 text-white">{link.label}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 ? (
                      <Badge variant="secondary" className="text-xs bg-blue-500 hover:bg-blue-600 text-white">
                        {link.badge}
                      </Badge>
                    ) : link.sublinks ? (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
            
            {/* Theme Toggle Button */}
            <li className="mt-6 border-t border-[#3A4956] pt-2">
              <button 
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-white transition-colors"
              >
                <div className="flex items-center">
                  <span className="w-5 text-white">
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </span>
                  <span className="ml-3 font-medium">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </div>
              </button>
            </li>
            
            {/* Log Off Button as part of the navigation menu */}
            <li className="border-t border-[#3A4956] pt-2">
              <button 
                onClick={async () => {
                  try {
                    // Perform a fetch to the logout endpoint
                    const response = await fetch("/api/auth/logout");
                    if (response.redirected) {
                      // If the server responded with a redirect, follow it
                      window.location.href = response.url;
                    } else {
                      // Otherwise, manually redirect to the home page
                      window.location.href = "/";
                    }
                  } catch (error) {
                    console.error("Logout error:", error);
                    // Fallback to home page if there's an error
                    window.location.href = "/";
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-white transition-colors"
              >
                <div className="flex items-center">
                  <span className="w-5 text-white">
                    <LogOutIcon className="h-5 w-5" />
                  </span>
                  <span className="ml-3 font-medium">Log off</span>
                </div>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
