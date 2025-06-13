
import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function ThemeToggle() {
  const { state, dispatch } = useApp();

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-10 h-10 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
    >
      {state.isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
