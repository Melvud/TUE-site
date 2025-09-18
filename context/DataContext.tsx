
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Event, News } from '../types';
import { MOCK_EVENTS, MOCK_NEWS } from '../constants';

interface DataContextType {
  events: Event[];
  news: News[];
  login: (password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events] = useState<Event[]>(MOCK_EVENTS);
  const [news] = useState<News[]>(MOCK_NEWS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // In a real app, this would be a proper auth flow
  const login = (password: string): boolean => {
    if (password === 'admin123') { // Super secret password
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };
  
  const value = {
    events,
    news,
    login,
    logout,
    isAuthenticated,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
