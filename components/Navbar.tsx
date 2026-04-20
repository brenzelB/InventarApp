"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Menu, LogOut, User } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-30 shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 w-full h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              aria-label="Menü öffnen"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="lg:hidden flex items-center font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400">
              InventarApp
            </Link>
            <div className="hidden lg:block text-sm font-medium text-slate-400">
              Willkommen zurück{user ? `, ${user.email?.split('@')[0]}` : ''}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold">{user.email?.split('@')[0]}</span>
                </div>
                <button 
                  onClick={logout} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Abmelden</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
