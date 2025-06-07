import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Music, Moon, Sun, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

export function Navigation() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Initialize dark mode
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-800">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
          <Music className="text-white text-lg" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Vibe Swipe</h1>
          <p className="text-xs text-gray-400">AI Playlist Generator</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTheme}
          className="text-gray-300 hover:text-white"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-gray-300 hover:text-white">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {user.firstName || user.email?.split('@')[0] || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
              <DropdownMenuItem onClick={handleLogout} className="text-gray-300 hover:text-white focus:text-white">
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
