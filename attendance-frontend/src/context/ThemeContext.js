import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    const savedSidebarState = localStorage.getItem('sidebarCollapsed') === 'true';

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setSidebarCollapsed(savedSidebarState);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-font-size', savedFontSize);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Set specific theme
  const setSpecificTheme = (themeName) => {
    setTheme(themeName);
    localStorage.setItem('theme', themeName);
    document.documentElement.setAttribute('data-theme', themeName);
  };

  // Change font size
  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  // Set sidebar state
  const setSidebarState = (collapsed) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setTheme('light');
    setFontSize('medium');
    setSidebarCollapsed(false);
    
    localStorage.setItem('theme', 'light');
    localStorage.setItem('fontSize', 'medium');
    localStorage.setItem('sidebarCollapsed', 'false');
    
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-font-size', 'medium');
  };

  const value = {
    theme,
    fontSize,
    sidebarCollapsed,
    toggleTheme,
    setSpecificTheme,
    changeFontSize,
    toggleSidebar,
    setSidebarState,
    resetToDefaults,
    isDarkMode: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;