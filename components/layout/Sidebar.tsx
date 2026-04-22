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
  ChevronDown,
  X,
  Users,
  User,
  Settings
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

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'LAGER': true,
    'VERWALTUNG': false
  });

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const showTeam = role === 'admin' || user?.email === 'brenzel.ai@gmail.com';

  const menuGroups = [
    {
      id: 'DASHBOARD',
      items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
    },
    {
      id: 'LAGER',
      items: [
        { name: 'Artikel', href: '/dashboard/articles', icon: Package },
        { name: 'Gruppen', href: '/dashboard/groups', icon: Folder },
      ]
    },
    {
      id: 'VERWALTUNG',
      items: [
        { name: 'Profil', href: '/dashboard/profile', icon: User },
        ...(showTeam ? [
          { name: 'Team', href: '/dashboard/team', icon: Users },
          { name: 'Einstellungen', href: '/dashboard/settings', icon: Settings }
        ] : [])
      ]
    }
  ];

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
          bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
            {!isCollapsed && (
              <span className="font-bold text-xl text-accent truncate">
                InventarApp
              </span>
            )}
            {isCollapsed && (
              <div className="mx-auto bg-accent rounded-2xl p-1.5">
                <Package className="w-5 h-5 text-white" />
              </div>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto custom-scrollbar">
            {menuGroups.map((group) => {
              if (group.id === 'DASHBOARD') {
                return group.items.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-black transition-all group
                        ${isActive 
                          ? 'bg-indigo-50 dark:bg-slate-900 text-accent dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-800' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100'}
                      `}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent dark:text-white' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100'}`} />
                      {!isCollapsed && <span className="truncate uppercase tracking-wider">{item.name}</span>}
                    </Link>
                  );
                });
              }

              const isOpen = expandedMenus[group.id];
              
              return (
                <div key={group.id} className="space-y-1">
                  {/* Parent Toggle */}
                  <div 
                    onClick={() => toggleMenu(group.id)}
                    className={`
                      flex items-center justify-between p-3 cursor-pointer rounded-xl transition-all
                      text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-[0.2em]
                      hover:bg-slate-50 dark:hover:bg-slate-900/50
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {!isCollapsed ? (
                        <>
                          <span>{group.id}</span>
                        </>
                      ) : (
                        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2" />
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                  </div>

                  {/* Children */}
                  <div className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen && !isCollapsed ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    ${!isCollapsed ? 'ml-4 border-l border-slate-200 dark:border-slate-800' : ''}
                  `}>
                    <div className="pl-4 py-1 space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                              ${isActive 
                                ? 'text-accent dark:text-white font-black' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-accent dark:hover:text-blue-400'}
                            `}
                          >
                            <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent dark:text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-accent dark:group-hover:text-blue-400'}`} />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 hidden lg:block">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-full p-2 rounded-3xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
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
