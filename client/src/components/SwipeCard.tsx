import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, X } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Song } from "@shared/schema";

interface SwipeCardProps {
  song: Song;
  onSwipe: (direction: "left" | "right") => void;
  isActive?: boolean;
  style?: React.CSSProperties;
}

export function SwipeCard({ song, onSwipe, isActive = false, style }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
      const direction = offset > 0 ? "right" : "left";
      setExitX(direction === "right" ? 1000 : -1000);
      onSwipe(direction);
    }
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    setExitX(direction === "right" ? 1000 : -1000);
    onSwipe(direction);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, ...style }}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute ${isActive ? "cursor-grab active:cursor-grabbing z-30" : ""}`}
    >
      <Card className={`w-80 h-96 bg-gray-900 border-gray-700 ${isActive ? "shadow-2xl shadow-green-500/20" : ""}`}>
        <CardContent className="p-6 h-full flex flex-col">
          {/* Album Art */}
          <div className="relative mb-4">
            <img 
              src={song.albumArt || "/api/placeholder/300/200"} 
              alt={`${song.title} album art`}
              className="w-full h-32 object-cover rounded-xl"
            />
            {/* Preview Button */}
            <Button
              size="sm"
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/40 border-0"
              disabled // TODO: Implement preview functionality
            >
              <Play className="h-4 w-4 text-green-500" />
            </Button>
          </div>
          
          {/* Song Info */}
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-1 text-white truncate">
              {song.title}
            </h4>
            <p className="text-gray-400 mb-3 truncate">
              {song.artist}
            </p>
            
            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {song.genres.slice(0, 2).map((genre, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs"
                >
                  {genre}
                </Badge>
              ))}
              {song.duration && (
                <Badge 
                  variant="outline"
                  className="border-gray-600 text-gray-400 text-xs"
                >
                  {formatDuration(song.duration)}
                </Badge>
              )}
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-300 line-clamp-3">
              {song.energy && song.energy > 0.7 ? "High-energy" : 
               song.energy && song.energy < 0.4 ? "Mellow" : "Mid-tempo"} {song.genres[0].toLowerCase()} track
              {song.valence && song.valence > 0.7 ? " with uplifting vibes" : 
               song.valence && song.valence < 0.4 ? " with introspective mood" : ""}.
            </p>
          </div>
          
          {/* Action Buttons (only show on active card) */}
          {isActive && (
            <div className="flex justify-center space-x-8 mt-4">
              <Button
                size="lg"
                onClick={() => handleButtonSwipe("left")}
                className="w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/40 border-0 hover:scale-110 transition-all"
              >
                <X className="h-6 w-6 text-red-400" />
              </Button>
              <Button
                size="lg" 
                onClick={() => handleButtonSwipe("right")}
                className="w-20 h-20 rounded-full bg-green-500/20 hover:bg-green-500/40 border-0 hover:scale-110 transition-all"
              >
                <Heart className="h-8 w-8 text-green-500" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SwipeInterfaceProps {
  songs: Song[];
  onSwipe: (song: Song, direction: "left" | "right") => void;
  currentIndex: number;
  likedCount: number;
}

export function SwipeInterface({ songs, onSwipe, currentIndex, likedCount }: SwipeInterfaceProps) {
  const visibleCards = 3;
  
  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex < songs.length) {
      onSwipe(songs[currentIndex], direction);
    }
  };

  const progress = songs.length > 0 ? (currentIndex / songs.length) * 100 : 0;

  return (
    <div className="text-center mb-8">
      <h3 className="text-xl font-bold mb-2 text-white">Swipe Through AI Suggestions</h3>
      <p className="text-gray-400 mb-6">Swipe right to add to playlist, left to skip</p>
      
      {/* Cards Container */}
      <div className="relative h-96 flex items-center justify-center mb-8">
        {songs.length === 0 ? (
          <div className="text-gray-400 text-center">
            <p>No songs to display. Start a conversation above to get suggestions!</p>
          </div>
        ) : currentIndex >= songs.length ? (
          <div className="text-center">
            <h4 className="text-xl font-bold text-white mb-2">Great job! 🎉</h4>
            <p className="text-gray-400 mb-4">You've gone through all the suggestions.</p>
            <p className="text-green-400">Liked {likedCount} songs</p>
          </div>
        ) : (
          // Render visible cards
          Array.from({ length: Math.min(visibleCards, songs.length - currentIndex) }).map((_, index) => {
            const cardIndex = currentIndex + index;
            const song = songs[cardIndex];
            const isActive = index === 0;
            const scale = isActive ? 1 : 0.95 - (index * 0.05);
            const opacity = isActive ? 1 : 0.8 - (index * 0.2);
            const zIndex = visibleCards - index;
            
            return (
              <SwipeCard
                key={`${song.id}-${cardIndex}`}
                song={song}
                onSwipe={handleSwipe}
                isActive={isActive}
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  zIndex,
                }}
              />
            );
          })
        )}
      </div>

      {/* Progress Indicator */}
      {songs.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Song {Math.min(currentIndex + 1, songs.length)} of {songs.length}</span>
            <span>{likedCount} liked</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
