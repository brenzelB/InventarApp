"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  Folder,
  ChevronLeft, 
  ChevronRight,
  X,
  Users,
  User
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const { role, user } = useAuth();
  
  // DEBUG LOG
  console.log("[Sidebar] Aktuelle Rolle:", role, "User:", user?.email);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Artikel', href: '/dashboard/articles', icon: Package },
    { name: 'Gruppen', href: '/dashboard/groups', icon: Folder },
    { name: 'Profil', href: '/dashboard/profile', icon: User },
  ];

  // Relaxed condition for debugging
  const showTeam = role === 'admin' || role === 'Admin' || user?.email === 'brenzel.ai@gmail.com';

  if (showTeam) {
    console.log("[Sidebar] Zugriff gewährt (showTeam = true), füge Team hinzu");
    navItems.push({ name: 'Team', href: '/dashboard/team', icon: Users });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out
          bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
            {!isCollapsed && (
              <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400 truncate">
                InventarApp
              </span>
            )}
            {isCollapsed && (
              <div className="mx-auto bg-indigo-600 rounded-lg p-1.5">
                <Package className="w-5 h-5 text-white" />
              </div>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group
                    ${isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                  `}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 hidden lg:block">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Einklappen</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
