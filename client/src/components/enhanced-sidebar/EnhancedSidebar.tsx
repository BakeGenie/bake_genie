import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home,
  Calendar as CalendarIcon,
  FileText,
  ShoppingBag,
  Users,
  Settings,
  BarChart,
  MessageSquare,
  CheckSquare,
  Menu,
  X,
  Upload,
  Download,
  Layers,
  HelpCircle,
  CreditCard
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const EnhancedSidebar = () => {
  const [location] = useLocation();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', href: '/', icon: Home },
    { label: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { label: 'Orders & Quotes', href: '/orders', icon: FileText },
    { label: 'Products', href: '/products', icon: ShoppingBag },
    { label: 'Contacts', href: '/contacts', icon: Users },
    { label: 'Recipes & Ingredients', href: '/recipes', icon: Layers },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Reports & Lists', href: '/reports', icon: BarChart },
    { label: 'Enquiries', href: '/enquiries', icon: MessageSquare },
    { label: 'Import/Export', href: '/data-import-export', icon: Upload },
    { label: 'Business & Expenses', href: '/expenses', icon: CreditCard },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help', href: '/help', icon: HelpCircle },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Generate dynamic classes based on the current theme
  const getLinkClasses = (href: string) => {
    const isActive = location === href;
    const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200";
    
    if (isActive) {
      return `${baseClasses} bg-primary text-primary-foreground font-medium`;
    }
    
    return `${baseClasses} text-foreground hover:bg-accent hover:text-accent-foreground`;
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline" 
        size="icon" 
        className="fixed bottom-4 right-4 z-50 lg:hidden shadow-lg rounded-full"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar for both mobile and desktop */}
      <aside 
        className={`
          bg-background/90 backdrop-blur-md border-r border-border 
          transition-all duration-300 ease-in-out z-40
          ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-64'}
          fixed inset-0 lg:static overflow-hidden
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary">BakeDiary</h2>
          </div>
          
          <Separator />
          
          <ScrollArea className="flex-1 py-2">
            <nav className="space-y-1 px-3">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="menu-item">
                    <Link href={item.href}>
                      <div className={getLinkClasses(item.href)} onClick={() => setIsOpen(false)}>
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </nav>
          </ScrollArea>
          
          <Separator />
          
          <div className="p-4">
            <div className="text-xs text-muted-foreground">
              <p>© 2025 BakeDiary</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default EnhancedSidebar;