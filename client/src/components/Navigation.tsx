import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Music, Moon, Sun, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

export function Navigation() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then default to dark
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    // Apply theme on mount and when changed
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.reload();
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
          <Music className="text-white text-lg" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vibe Swipe</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">AI Playlist Generator</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={(user as any)?.profileImageUrl || ""} alt={(user as any)?.firstName || "User"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <DropdownMenuItem onClick={handleLogout} className="text-gray-900 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:text-gray-700 dark:focus:text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700 px-4 py-2 lg:hidden">
      <div className="flex justify-around items-center">
        <Button variant="ghost" className="flex flex-col items-center p-2 text-green-500">
          <Music className="text-lg" />
          <span className="text-xs mt-1">Home</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center p-2 text-gray-400 hover:text-white">
          <Music className="text-lg" />
          <span className="text-xs mt-1">Discover</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center p-2 text-gray-400 hover:text-white">
          <Music className="text-lg" />
          <span className="text-xs mt-1">Playlists</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center p-2 text-gray-400 hover:text-white">
          <User className="text-lg" />
          <span className="text-xs mt-1">Profile</span>
        </Button>
      </div>
    </nav>
  );
}
