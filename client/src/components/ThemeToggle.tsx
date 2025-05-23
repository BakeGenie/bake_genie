import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  SunIcon, 
  MoonIcon, 
  PaletteIcon,
  CircleIcon
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          {theme === 'light' && <SunIcon className="h-5 w-5" />}
          {theme === 'dark' && <MoonIcon className="h-5 w-5" />}
          {theme !== 'light' && theme !== 'dark' && <PaletteIcon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-2">
        <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2 cursor-pointer">
          <SunIcon className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2 cursor-pointer">
          <MoonIcon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('blue')} className="flex items-center gap-2 cursor-pointer">
          <CircleIcon className="h-4 w-4 text-blue-500" />
          <span>Blue</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('purple')} className="flex items-center gap-2 cursor-pointer">
          <CircleIcon className="h-4 w-4 text-purple-500" />
          <span>Purple</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('green')} className="flex items-center gap-2 cursor-pointer">
          <CircleIcon className="h-4 w-4 text-green-500" />
          <span>Green</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('red')} className="flex items-center gap-2 cursor-pointer">
          <CircleIcon className="h-4 w-4 text-red-500" />
          <span>Red</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}