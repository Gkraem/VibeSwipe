import { useState, useEffect } from "react";
import { Navigation, BottomNavigation } from "@/components/Navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { SwipeInterface } from "@/components/SwipeCard";
import { PlaylistDisplay } from "@/components/PlaylistDisplay";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<{
    id?: number;
    title: string;
    description: string;
    songs: Song[];
    spotifyUrl?: string;
  } | null>(null);

  const updatePlaylistTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const response = await apiRequest("PATCH", `/api/playlists/${id}`, { title });
      return await response.json();
    },
    onSuccess: (updatedPlaylist) => {
      setGeneratedPlaylist(prev => prev ? { ...prev, title: updatedPlaylist.title } : null);
      toast({
        title: "Playlist Updated",
        description: "Your playlist title has been saved.",
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
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "Failed to update playlist title. Please try again.",
        variant: "destructive",
      });
    },
  });

  const swipeMutation = useMutation({
    mutationFn: async ({ songId, action }: { songId: string; action: "like" | "skip" }) => {
      const response = await apiRequest("POST", "/api/swipe", {
        songId,
        action,
      });
      return await response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      console.error("Error saving swipe:", error);
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async ({ songs, originalPrompt }: { songs: Song[]; originalPrompt: string }) => {
      const response = await apiRequest("POST", "/api/playlists", {
        songs,
        originalPrompt,
      });
      return await response.json();
    },
    onSuccess: (playlist) => {
      setGeneratedPlaylist({
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        songs: playlist.songs,
        spotifyUrl: playlist.spotifyUrl,
      });
      toast({
        title: "Playlist Created!",
        description: `"${playlist.title}" has been saved to your library.`,
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
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateSongsMutation = useMutation({
    mutationFn: async ({ prompt, excludeIds }: { prompt: string; excludeIds: string[] }) => {
      // Start progress simulation
      setGenerationProgress(0);
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      try {
        const response = await apiRequest("POST", "/api/songs/generate", {
          prompt,
          excludeIds,
        });
        const result = await response.json();
        
        // Complete progress
        setGenerationProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => setGenerationProgress(0), 1000);
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      setSuggestions(prev => [...prev, ...data.songs]);
      toast({
        title: "More Songs Generated",
        description: `Added ${data.songs.length} new songs to discover!`,
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
          window.location.href = "/auth";
        }, 500);
        return;
      }
      
      // Check if it's an OpenAI quota error
      if (error.message.includes("OpenAI API quota exceeded") || error.message.includes("402")) {
        toast({
          title: "API Quota Exceeded",
          description: "Please provide a valid OpenAI API key with available credits.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate more songs. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSuggestionsGenerated = (songs: Song[], prompt: string) => {
    console.log("handleSuggestionsGenerated called with:", songs.length, "songs");
    console.log("First few songs:", songs.slice(0, 3));
    setSuggestions(songs);
    setCurrentIndex(0);
    setLikedSongs([]);
    setOriginalPrompt(prompt);
    setGeneratedPlaylist(null);
  };

  const handleSwipe = (song: Song, direction: "left" | "right") => {
    const action = direction === "right" ? "like" : "skip";
    
    // Save swipe action
    swipeMutation.mutate({ songId: song.id, action });
    
    // Update local state
    if (direction === "right") {
      setLikedSongs(prev => [...prev, song]);
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  const handleGeneratePlaylist = () => {
    if (likedSongs.length === 0) {
      toast({
        title: "No songs selected",
        description: "Please swipe right on some songs first!",
        variant: "destructive",
      });
      return;
    }

    createPlaylistMutation.mutate({
      songs: likedSongs,
      originalPrompt,
    });
  };

  // Scroll to playlist when generated
  useEffect(() => {
    if (generatedPlaylist) {
      const element = document.getElementById('generated-playlist');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [generatedPlaylist]);

  const handleGenerateMoreSongs = () => {
    if (!originalPrompt) return;
    
    const excludeIds = suggestions.map(song => song.id);
    generateSongsMutation.mutate({ 
      prompt: originalPrompt, 
      excludeIds 
    });
  };

  const handleUpdateTitle = (title: string) => {
    if (generatedPlaylist?.id) {
      updatePlaylistTitleMutation.mutate({ id: generatedPlaylist.id, title });
    }
  };

  const handleSpotifyExport = (spotifyUrl: string) => {
    setGeneratedPlaylist(prev => prev ? { ...prev, spotifyUrl } : null);
  };

  const showSwipeInterface = suggestions.length > 0 && currentIndex < suggestions.length;
  const showGenerateButton = likedSongs.length >= 3 && currentIndex >= suggestions.length;
  const showMoreSongsButton = suggestions.length > 0 && currentIndex >= suggestions.length - 5;

  // Check for Spotify callback success on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spotify_connected') === 'true') {
      toast({
        title: "Spotify Connected!",
        description: "You can now export your playlist to Spotify.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Chat & Swipe */}
          <div className="space-y-6">
            {!showSwipeInterface && (
              <ChatInterface onSuggestionsGenerated={handleSuggestionsGenerated} />
            )}
            
            {showSwipeInterface && (
              <div className="space-y-6">
                <SwipeInterface
                  songs={suggestions}
                  onSwipe={handleSwipe}
                  currentIndex={currentIndex}
                  likedCount={likedSongs.length}
                />
                
                {showMoreSongsButton && (
                  <div className="text-center">
                    <Button
                      onClick={handleGenerateMoreSongs}
                      disabled={generateSongsMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium"
                    >
                      {generateSongsMutation.isPending ? "Generating..." : "Generate More Songs"}
                    </Button>
                    {generationProgress > 0 && (
                      <div className="mt-4">
                        <Progress value={generationProgress} className="w-full max-w-md mx-auto" />
                        <p className="text-sm text-gray-400 mt-2">Generating new songs... {Math.round(generationProgress)}%</p>
                      </div>
                    )}
                  </div>
                )}
                
                {showGenerateButton && (
                  <div className="text-center">
                    <Button
                      onClick={handleGeneratePlaylist}
                      disabled={createPlaylistMutation.isPending}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                      {createPlaylistMutation.isPending ? "Creating Playlist..." : `Generate Playlist (${likedSongs.length} songs)`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right Column - Generated Playlist */}
          <div className="space-y-6">
            {generatedPlaylist && (
              <div id="generated-playlist">
                <PlaylistDisplay
                  songs={generatedPlaylist.songs}
                  title={generatedPlaylist.title}
                  description={generatedPlaylist.description}
                  playlistId={generatedPlaylist.id}
                  onUpdateTitle={handleUpdateTitle}
                  editable={true}
                  spotifyUrl={generatedPlaylist.spotifyUrl}
                  onSpotifyExport={handleSpotifyExport}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}