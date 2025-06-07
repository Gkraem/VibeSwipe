import { useState } from "react";
import { Navigation, BottomNavigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, Music, Trash2, Loader2, Eye } from "lucide-react";
import { Link } from "wouter";
import type { Playlist, Song } from "@shared/schema";

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export default function PlaylistsPage() {
  const { toast } = useToast();
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithSongs | null>(null);

  const { data: playlists, isLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: number) => {
      const response = await apiRequest("DELETE", `/api/playlists/${playlistId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setSelectedPlaylist(null);
      toast({
        title: "Playlist Deleted",
        description: "Your playlist has been successfully deleted.",
      });
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
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete playlist",
        variant: "destructive",
      });
    },
  });

  const viewPlaylistMutation = useMutation({
    mutationFn: async (playlistId: number) => {
      const response = await apiRequest("GET", `/api/playlists/${playlistId}`);
      return await response.json();
    },
    onSuccess: (data: PlaylistWithSongs) => {
      setSelectedPlaylist(data);
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
        title: "Error",
        description: "Failed to load playlist details",
        variant: "destructive",
      });
    },
  });

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

  if (selectedPlaylist) {
    const totalDuration = selectedPlaylist.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        
        <div className="p-4 pb-20 lg:pb-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
              <Button 
                onClick={() => setSelectedPlaylist(null)}
                variant="ghost" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Playlists
              </Button>
            </div>

            <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
              <CardHeader className="text-center pb-4">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-green-500/20 to-emerald-400/20 rounded-2xl flex items-center justify-center border border-green-500/30">
                  <Music className="h-16 w-16 text-green-400" />
                </div>
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  {selectedPlaylist.title}
                </CardTitle>
                {selectedPlaylist.description && (
                  <p className="text-gray-400 mb-4">{selectedPlaylist.description}</p>
                )}
                <div className="flex justify-center space-x-6 text-sm text-gray-400">
                  <span>{selectedPlaylist.songs.length} tracks</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedPlaylist.songs.map((song, index) => (
                    <div 
                      key={song.id}
                      className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="text-sm text-gray-400 flex-shrink-0 w-6 text-center">
                        {index + 1}
                      </div>
                      
                      <img 
                        src={song.albumArt || "/api/placeholder/60/60"} 
                        alt={`${song.title} album art`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      
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
                      
                      <div className="text-sm text-gray-400 flex-shrink-0">
                        {formatTrackDuration(song.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />
      
      <div className="p-4 pb-20 lg:pb-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Playlists</h1>
            <p className="text-gray-300">Your generated music collections</p>
          </div>

          <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Music className="h-5 w-5" />
                <span>Your Playlists</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                </div>
              ) : playlists && playlists.length > 0 ? (
                <div className="space-y-4">
                  {playlists.map((playlist) => (
                    <div 
                      key={playlist.id}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/50 transition-colors border border-gray-700/50"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-400/20 rounded-lg flex items-center justify-center border border-green-500/30">
                          <Music className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{playlist.title}</h3>
                          {playlist.description && (
                            <p className="text-sm text-gray-400 truncate">{playlist.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Created {playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => viewPlaylistMutation.mutate(playlist.id)}
                          disabled={viewPlaylistMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="border-green-600 text-green-400 hover:bg-green-600/10"
                        >
                          {viewPlaylistMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          onClick={() => deletePlaylistMutation.mutate(playlist.id)}
                          disabled={deletePlaylistMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          {deletePlaylistMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No playlists yet</h3>
                  <p className="text-gray-500 mb-4">Start creating playlists by chatting with our AI!</p>
                  <Button asChild>
                    <Link href="/">Generate Your First Playlist</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}