"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from '../Navbar';
import { useAuth } from '@/hooks/useAuth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  // If user is not logged in, show a simplified layout (no sidebar)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
