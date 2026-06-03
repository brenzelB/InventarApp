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
    <nav className="sticky top-0 z-50 shadow-sm bg-widget/80 backdrop-blur-md border-b border-outline w-full h-16 transition-colors duration-300">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-element hover:bg-surface-2 text-foreground/75 transition-colors"
              aria-label="Menü öffnen"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="lg:hidden flex items-center font-bold font-sora text-xl tracking-tight text-primary">
              [ SYS_INV_NAV ]
            </Link>
            <Link 
              href="/dashboard/profile"
              className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-foreground/60 font-mono uppercase tracking-widest hover:text-primary transition-colors group"
            >
              Willkommen zurück{user ? `, ` : ''}
              <span className="text-foreground font-extrabold group-hover:text-primary transition-colors">
                {user ? (user.user_metadata?.display_name || user.email?.split('@')[0]) : ''}
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-element bg-surface-2 text-foreground/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all border border-outline font-mono text-xs"
                >
                  {(() => {
                    const AvatarIcon = iconMap[user.user_metadata?.avatar_id] || User;
                    return <AvatarIcon className="w-4 h-4 text-primary" />;
                  })()}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{user.user_metadata?.display_name || user.email?.split('@')[0]}</span>
                </Link>
                <button 
                  onClick={() => {
                    console.log("[Navbar] Logout button clicked");
                    logout();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-element transition-all font-mono uppercase tracking-widest border border-transparent hover:border-red-500/20"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-primary hover:bg-primary-hover text-white dark:text-black dark:font-black px-6 py-2 rounded-element text-xs font-bold transition-all shadow-sm border border-outline font-mono uppercase tracking-widest">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
