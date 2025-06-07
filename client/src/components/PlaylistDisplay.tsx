import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Play, Music, ExternalLink, Sparkles, Edit3, Check, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";
import type { Song } from "@shared/schema";

interface PlaylistDisplayProps {
  songs: Song[];
  title?: string;
  description?: string;
  onGeneratePlaylist?: () => void;
  isGenerating?: boolean;
  playlistId?: number;
  onUpdateTitle?: (title: string) => void;
  editable?: boolean;
  spotifyUrl?: string;
}

export function PlaylistDisplay({ 
  songs, 
  title = "Your AI-Generated Playlist", 
  description,
  onGeneratePlaylist,
  isGenerating = false,
  playlistId,
  onUpdateTitle,
  editable = false,
  spotifyUrl
}: PlaylistDisplayProps) {
  const { toast } = useToast();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const exportToSpotifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/playlists/${id}/export-spotify`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Export Successful!",
        description: data.message || "Your playlist has been exported to Spotify",
      });
      if (data.playlistUrl) {
        window.open(data.playlistUrl, '_blank');
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export playlist to Spotify",
        variant: "destructive",
      });
    },
  });

  const handleExportToSpotify = () => {
    if (playlistId) {
      exportToSpotifyMutation.mutate(playlistId);
    }
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

  if (songs.length === 0 && onGeneratePlaylist) {
    return (
      <div className="text-center mb-8">
        <Button 
          onClick={onGeneratePlaylist}
          disabled={isGenerating}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2" />
              Generate My Playlist
            </>
          )}
        </Button>
      </div>
    );
  }

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
            disabled={!playlistId || exportToSpotifyMutation.isPending}
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
        
        {playlistId ? (
          <p className="text-xs text-gray-400 text-center mt-4">
            Export your playlist directly to your Spotify account
          </p>
        ) : (
          <p className="text-xs text-gray-500 text-center mt-4">
            Save this playlist first to enable Spotify export
          </p>
        )}
      </CardContent>
    </Card>
  );
}
