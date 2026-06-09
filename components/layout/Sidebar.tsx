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
          bg-widget border-r border-outline
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        <div className="flex flex-col h-full bg-grid-pattern bg-opacity-5">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-outline">
            {!isCollapsed && (
              <span className="font-bold font-sora text-sm text-primary tracking-widest truncate">
                [ SYS_INV_01 ]
              </span>
            )}
            {isCollapsed && (
              <div className="mx-auto bg-primary rounded-element p-1.5 shadow-[0_0_10px_rgba(255,46,99,0.3)] dark:shadow-[0_0_10px_rgba(224,108,117,0.3)]">
                <Package className="w-5 h-5 text-white dark:text-black" />
              </div>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-element hover:bg-surface-2 text-foreground/75"
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
                        flex items-center gap-3 px-3 py-3 rounded-element text-xs font-bold font-mono transition-all group uppercase tracking-wider
                        ${isActive 
                          ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(224,108,117,0.1)]' 
                          : 'text-foreground/60 hover:bg-surface-2 hover:text-foreground border border-transparent'}
                      `}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-foreground/45 group-hover:text-foreground'}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
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
                      flex items-center justify-between p-3 cursor-pointer rounded-element transition-all
                      text-foreground font-bold text-[10px] font-mono uppercase tracking-[0.2em]
                      hover:bg-surface-2
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {!isCollapsed ? (
                        <>
                          <span className="text-secondary">{group.id}</span>
                        </>
                      ) : (
                        <div className="w-full h-px bg-outline my-2" />
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                  </div>

                  {/* Children */}
                  <div className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen && !isCollapsed ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    ${!isCollapsed ? 'ml-4 border-l border-outline' : ''}
                  `}>
                    <div className="pl-4 py-1 space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-element text-xs font-bold font-mono transition-all group uppercase tracking-wider
                              ${isActive 
                                ? 'text-primary' 
                                : 'text-foreground/60 hover:text-primary'}
                            `}
                          >
                            <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-foreground/45 group-hover:text-primary'}`} />
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

          <div className="p-4 border-t border-outline hidden lg:block">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-full p-2 rounded-element bg-surface-2 hover:bg-primary/10 hover:text-primary text-foreground/60 transition-colors border border-outline hover:border-primary/20"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest">Einklappen</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
