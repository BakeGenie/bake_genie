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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPath }) => {
  // Fetch task count
  const { data: taskCount } = useQuery<number>({
    queryKey: ["/api/tasks/count"],
  });

  // Fetch enquiry count
  const { data: enquiryCount } = useQuery<number>({
    queryKey: ["/api/enquiries/count"],
  });

  const links: SidebarLink[] = [
    {
      path: "/",
      label: "Dashboard",
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      path: "/orders",
      label: "Orders & Quotes",
      icon: <FileTextIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/contacts",
      label: "Contacts",
      icon: <ContactIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/enquiries",
      label: "Enquiries",
      icon: <MessageSquareIcon className="w-5 h-5" />,
      badge: enquiryCount || 0,
    },
    {
      path: "/tasks",
      label: "Task List",
      icon: <ListTodoIcon className="w-5 h-5" />,
      badge: taskCount || 0,
    },
    {
      path: "/calendar",
      label: "Calendar",
      icon: <CalendarIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/recipes",
      label: "Recipes & Ingredients",
      icon: <BookOpenIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/products",
      label: "Products",
      icon: <TagIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/reports",
      label: "Reports & Lists",
      icon: <BarChartIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/expenses",
      label: "Business & Expenses",
      icon: <DollarSignIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/printables",
      label: "Printables",
      icon: <PrinterIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/tools",
      label: "Tools",
      icon: <Hammer className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/account",
      label: "Account",
      icon: <UserIcon className="w-5 h-5" />,
      sublinks: true,
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar Overlay (Mobile only) */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="md:relative fixed inset-y-0 left-0 z-50 md:z-auto flex flex-col w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <UtensilsIcon className="h-6 w-6 text-primary-500" />
            <span className="ml-2 text-xl font-semibold text-gray-800">BakeDiary</span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto md:hidden text-gray-500 hover:text-gray-700"
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
                  <a
                    className={`sidebar-link flex items-center justify-between px-4 py-3 text-sm ${
                      currentPath === link.path || currentPath.startsWith(`${link.path}/`)
                        ? "active"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`w-5 ${
                        currentPath === link.path || currentPath.startsWith(`${link.path}/`)
                          ? "text-primary-500"
                          : "text-gray-500"
                      }`}>
                        {link.icon}
                      </span>
                      <span className="ml-3">{link.label}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 ? (
                      <Badge variant={link.badge > 0 ? "default" : "secondary"} className="text-xs">
                        {link.badge}
                      </Badge>
                    ) : link.sublinks ? (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    ) : null}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
