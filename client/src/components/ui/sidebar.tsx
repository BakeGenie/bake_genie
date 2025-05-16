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
  LinkIcon
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
      path: "/integrations",
      label: "Integrations",
      icon: <LinkIcon className="w-5 h-5" />,
      sublinks: true,
    },
    {
      path: "/data",
      label: "Data Import/Export",
      icon: <DatabaseIcon className="w-5 h-5" />,
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
            <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cake-like cog 3D icon */}
              <circle cx="16" cy="16" r="12" fill="#f0f0f0" stroke="#d1d1d1" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="10" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="0.5" />
              <path d="M16 6 L19 9 L22 7 L20 11 L24 13 L20 15 L22 19 L18 17 L16 21 L14 17 L10 19 L12 15 L8 13 L12 11 L10 7 L14 9 Z" fill="#6285f8" stroke="#3b64ef" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="4" fill="#f5f7ff" stroke="#d6e0fd" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="2" fill="#ffffff" stroke="#ebf0fe" strokeWidth="0.5" />
              {/* 3D effect with highlights and shadows */}
              <path d="M16 28 C22.6274 28 28 22.6274 28 16 C28 9.37258 22.6274 4 16 4" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
              <path d="M16 4 C9.37258 4 4 9.37258 4 16 C4 22.6274 9.37258 28 16 28" stroke="#d0d0d0" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </svg>
            <span className="ml-2 text-xl font-semibold text-gray-800">CakeHub</span>
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
