import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
export function ThemeToggle() {
  const {
    state,
    dispatch
  } = useApp();
  const toggleTheme = () => {
    dispatch({
      type: 'TOGGLE_DARK_MODE'
    });
  };
  return;
}