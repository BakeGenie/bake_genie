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
      <aside className="md:relative fixed inset-y-0 left-0 z-50 md:z-auto flex flex-col w-64 text-sidebar-foreground" style={{backgroundColor: '#00c4cc'}}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/20" style={{backgroundColor: '#00c4cc'}}>
          <div className="flex items-center sidebar-brand">
            <svg className="h-8 w-8 sidebar-brand" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cake-like icon for BakeGenie */}
              <path d="M9 8c6-3 12 3 7 8 m-5 0c-6-5 0-11 7-8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <path d="M16 16v7" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <path d="M8 7.5a8 5 0 0116 0v2" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="ml-3 text-xl sidebar-brand" style={{color: '#ffffff', fontWeight: '900', fontSize: '1.25rem'}}>BakeGenie</span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto md:hidden text-sidebar-foreground hover:text-sidebar-foreground/70"
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
                    className={`sidebar-link flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors ${
                      currentPath === link.path || currentPath.startsWith(`${link.path}/`)
                        ? "bg-cyan-600 text-white font-medium"
                        : "text-white hover:bg-cyan-600/70"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`w-5 h-5 flex-shrink-0 ${
                        currentPath === link.path || currentPath.startsWith(`${link.path}/`)
                          ? "text-white"
                          : "text-white/80"
                      }`}>
                        {link.icon}
                      </span>
                      <span className="ml-3 font-medium">{link.label}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 ? (
                      <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0 ml-2">
                        {link.badge}
                      </Badge>
                    ) : link.sublinks ? (
                      <ChevronRight className="h-4 w-4 text-white/60 ml-2" />
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
            
          </ul>
          
          {/* Bottom Section with Logout */}
          <div className="mt-auto border-t border-white/20 pt-2">
            <button 
              onClick={async () => {
                try {
                  window.location.href = "/api/logout";
                } catch (error) {
                  console.error("Logout error:", error);
                  window.location.href = "/";
                }
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-white hover:bg-cyan-600/70 transition-colors"
            >
              <LogOutIcon className="h-5 w-5" />
              <span className="ml-3 font-medium">Log out</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
