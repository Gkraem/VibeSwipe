import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Play, Music, ExternalLink, Sparkles, Edit3, Check, X } from "lucide-react";
import { SiSpotify } from "react-icons/si";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getSpotifyWebAPI } from "@/lib/spotifyWebApi";
import { useState, useEffect } from "react";
import type { Song } from "@shared/schema";

interface PlaylistDisplayProps {
  songs: Song[];
  title?: string;
  description?: string;
  onGeneratePlaylist?: () => void;
  isGenerating?: boolean;
  generationProgress?: number;
  playlistId?: number;
  onUpdateTitle?: (title: string) => void;
  editable?: boolean;
  spotifyUrl?: string;
  onSpotifyExport?: (spotifyUrl: string) => void;
}

export function PlaylistDisplay({ 
  songs, 
  title = "Your AI-Generated Playlist", 
  description,
  onGeneratePlaylist,
  isGenerating = false,
  generationProgress = 0,
  playlistId,
  onUpdateTitle,
  editable = false,
  spotifyUrl,
  onSpotifyExport
}: PlaylistDisplayProps) {
  const { toast } = useToast();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const exportToSpotifyMutation = useMutation({
    mutationFn: async () => {
      const spotifyAPI = getSpotifyWebAPI();
      
      if (!title || !songs.length) {
        throw new Error('No playlist data to export');
      }
      
      const result = await spotifyAPI.exportPlaylistToSpotify(
        songs,
        title,
        description
      );
      
      return result;
    },
    onSuccess: (data) => {
      if (onSpotifyExport && data.playlistUrl) {
        onSpotifyExport(data.playlistUrl);
      }
      toast({
        title: "Success!",
        description: "Your playlist has been exported to Spotify!",
      });
    },
    onError: (error) => {
      let errorMessage = "Failed to export playlist to Spotify";
      
      if (error.message.includes("Popup blocked")) {
        errorMessage = "Please allow popups for this site and try again";
      } else if (error.message.includes("Authentication cancelled")) {
        errorMessage = "Spotify authentication was cancelled";
      } else if (error.message.includes("No tracks found")) {
        errorMessage = "No matching tracks found on Spotify";
      }
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });



  // Listen for Spotify export trigger from Home page
  useEffect(() => {
    const handleSpotifyExportTrigger = (event: CustomEvent) => {
      const { playlistId: triggerPlaylistId } = event.detail;
      if (playlistId && typeof playlistId === 'number' && playlistId === triggerPlaylistId) {
        exportToSpotifyMutation.mutate();
      }
    };

    window.addEventListener('triggerSpotifyExport', handleSpotifyExportTrigger as EventListener);
    
    return () => {
      window.removeEventListener('triggerSpotifyExport', handleSpotifyExportTrigger as EventListener);
    };
  }, [playlistId, exportToSpotifyMutation]);

  const handleExportToSpotify = () => {
    exportToSpotifyMutation.mutate();
  };

  const handleSaveTitle = () => {
    if (onUpdateTitle && editedTitle !== title) {
      onUpdateTitle(editedTitle || title);
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(title);
    setIsEditingTitle(false);
  };
  const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const formatTrackDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Remove the duplicate "Generate My Playlist" button

  if (songs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-bold bg-gray-800 border-gray-600 text-white text-center max-w-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveTitle}
                  className="bg-green-600 hover:bg-green-700 text-white p-2"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                {editable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(true)}
                    className="text-gray-400 hover:text-white p-2"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {description && (
            <p className="text-gray-400 mb-4">{description}</p>
          )}
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>{songs.length} tracks</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>

        {/* Playlist Tracks */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {songs.map((song, index) => (
            <div 
              key={song.id}
              className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
            >
              {/* Track Number */}
              <div className="text-sm text-gray-400 flex-shrink-0 w-6 text-center">
                {index + 1}
              </div>
              
              {/* Album Art */}
              <img 
                src={song.albumArt || "/api/placeholder/60/60"} 
                alt={`${song.title} album art`}
                className="w-12 h-12 rounded-lg object-cover"
              />
              
              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{song.title}</h4>
                <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                {song.genres.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {song.genres.slice(0, 2).map((genre, idx) => (
                      <Badge 
                        key={idx}
                        variant="secondary" 
                        className="bg-gray-700 text-gray-300 text-xs"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Duration */}
              <div className="text-sm text-gray-400 flex-shrink-0">
                {song.duration ? formatTrackDuration(song.duration) : "--:--"}
              </div>
              
              {/* Play Button */}
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white flex-shrink-0"
                disabled // TODO: Implement preview functionality
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Export Options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleExportToSpotify}
            disabled={!title || !songs.length || exportToSpotifyMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Music className="h-4 w-4" />
            <span>
              {exportToSpotifyMutation.isPending ? "Exporting..." : "Export to Spotify"}
            </span>
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button 
            disabled
            variant="secondary"
            className="bg-gray-600/50 text-white px-6 py-3 rounded-xl font-medium opacity-50 cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Music className="h-4 w-4" />
            <span>Export to Apple Music</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Listen in Spotify Button */}
        {spotifyUrl && (
          <div className="mt-4 text-center">
            <Button 
              onClick={() => window.open(spotifyUrl, '_blank')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 mx-auto"
            >
              <Music className="h-4 w-4" />
              <span>Listen in Spotify</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <p className="text-xs text-gray-400 text-center mt-4">
          Export your playlist directly to your Spotify account
        </p>
      </CardContent>
    </Card>
  );
}
