"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  Menu, 
  LogOut, 
  User, 
  Ghost, 
  Cat, 
  Dog, 
  Heart, 
  Star, 
  Sparkles,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'user': User,
  'ghost': Ghost,
  'cat': Cat,
  'dog': Dog,
  'heart': Heart,
  'star': Star,
  'sparkles': Sparkles
};

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
            <div className="hidden lg:block text-sm font-bold text-slate-400 tracking-tight">
              WILLKOMMEN ZURÜCK{user ? `, ${user.user_metadata?.display_name || user.email?.split('@')[0]}` : ''}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                >
                  {(() => {
                    const AvatarIcon = iconMap[user.user_metadata?.avatar_id] || User;
                    return <AvatarIcon className="w-4 h-4" />;
                  })()}
                  <span className="text-xs font-bold">{user.user_metadata?.display_name || user.email?.split('@')[0]}</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">LOGOUT</span>
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
