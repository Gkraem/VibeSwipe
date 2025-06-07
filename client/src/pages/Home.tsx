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
          window.location.href = "/api/login";
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
  const { toast } = useToast();

  // Recovery mechanism for generated playlists
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('lastGeneratedPlaylist');
    if (savedPlaylist && !generatedPlaylist) {
      try {
        const parsed = JSON.parse(savedPlaylist);
        console.log('Recovering playlist from localStorage:', parsed);
        setGeneratedPlaylist(parsed);
      } catch (error) {
        console.error('Error recovering playlist:', error);
        localStorage.removeItem('lastGeneratedPlaylist');
      }
    }
  }, []);

  // Handle mobile Spotify authentication return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifySuccess = urlParams.get('spotify_success');
    const spotifyError = urlParams.get('spotify_error');
    
    if (spotifySuccess === 'true') {
      const tempToken = sessionStorage.getItem('spotify_temp_token');
      if (tempToken) {
        toast({
          title: "Spotify Connected!",
          description: "Your account is now connected for playlist exports.",
        });
        sessionStorage.removeItem('spotify_temp_token');
      }
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (spotifyError) {
      toast({
        title: "Spotify Connection Failed",
        description: "Unable to connect to Spotify. Please try again.",
        variant: "destructive",
      });
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

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
          window.location.href = "/api/login";
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
      console.log('Playlist created successfully:', playlist);
      const playlistData = {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        songs: playlist.songs,
        spotifyUrl: playlist.spotifyUrl,
      };
      setGeneratedPlaylist(playlistData);
      console.log('Generated playlist state set:', playlistData);
      
      // Persist to localStorage for recovery
      localStorage.setItem('lastGeneratedPlaylist', JSON.stringify(playlistData));
      
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
          window.location.href = "/api/login";
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

  const generateMoreSongsMutation = useMutation({
    mutationFn: async ({ prompt, excludeIds }: { prompt: string; excludeIds: string[] }) => {
      // Start progress simulation with more realistic timing
      setGenerationProgress(0);
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 85) return prev + Math.random() * 2; // Slow down near the end
          if (prev >= 70) return prev + Math.random() * 5; // Medium speed
          return prev + Math.random() * 12; // Faster initially
        });
      }, 800);

      try {
        const response = await apiRequest("POST", "/api/songs/generate", {
          prompt,
          excludeIds,
        });
        const result = await response.json();
        
        // Complete progress smoothly
        clearInterval(progressInterval);
        setGenerationProgress(100);
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
          window.location.href = "/api/login";
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
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    // Remove auto-generation - let user decide when to create playlist
  };

  const handleGeneratePlaylist = () => {
    console.log('handleGeneratePlaylist called with:', { likedSongs: likedSongs.length, originalPrompt });
    
    if (likedSongs.length === 0) {
      toast({
        title: "No songs selected",
        description: "Please swipe right on some songs first!",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating playlist with songs:', likedSongs);
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
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [generatedPlaylist]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20 lg:pb-6">
        {/* Conversational Interface */}
        <div className="mb-8">
          <ChatInterface onSuggestionsGenerated={handleSuggestionsGenerated} />
        </div>

        {/* Swipe Interface */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <SwipeInterface
              songs={suggestions}
              onSwipe={handleSwipe}
              currentIndex={currentIndex}
              likedCount={likedSongs.length}
            />
          </div>
        )}

        {/* Generate More Songs Button - hide after playlist creation */}
        {currentIndex >= suggestions.length && suggestions.length > 0 && !generatedPlaylist && (
          <div className="mb-6 text-center">
            <Button
              onClick={() => {
                const excludeIds = suggestions.map(s => s.id);
                const prompt = originalPrompt || "Generate more music recommendations";
                generateMoreSongsMutation.mutate({ prompt, excludeIds });
              }}
              disabled={generateMoreSongsMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {generateMoreSongsMutation.isPending ? "Generating..." : "Generate 25 More Songs"}
            </Button>
            {generateMoreSongsMutation.isPending && generationProgress > 0 && (
              <div className="mt-4 max-w-sm mx-auto space-y-2">
                <Progress value={Math.min(generationProgress, 100)} className="w-full h-2" />
                <p className="text-sm text-gray-400">{Math.min(Math.round(generationProgress), 100)}% complete</p>
              </div>
            )}
          </div>
        )}

        {/* Playlist Generation Button */}
        {likedSongs.length > 0 && !generatedPlaylist && currentIndex >= suggestions.length && (
          <div className="mb-8">
            <PlaylistDisplay
              songs={[]}
              onGeneratePlaylist={handleGeneratePlaylist}
              isGenerating={createPlaylistMutation.isPending}
            />
          </div>
        )}

        {/* Generated Playlist */}
        {generatedPlaylist && (
          <div id="generated-playlist" className="mb-8">
            <PlaylistDisplay
              songs={generatedPlaylist.songs}
              title={generatedPlaylist.title}
              description={generatedPlaylist.description}
              playlistId={generatedPlaylist.id}
              editable={true}
              spotifyUrl={generatedPlaylist.spotifyUrl}
              onUpdateTitle={(newTitle) => {
                if (generatedPlaylist.id) {
                  updatePlaylistTitleMutation.mutate({ id: generatedPlaylist.id, title: newTitle });
                }
              }}
              onSpotifyExport={(spotifyUrl) => {
                setGeneratedPlaylist(prev => prev ? { ...prev, spotifyUrl } : null);
              }}
            />
          </div>
        )}

        {/* Show liked songs preview and manual playlist creation */}
        {likedSongs.length > 0 && !generatedPlaylist && (
          <div className="mb-8">
            <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <h4 className="text-lg font-bold text-white mb-2">Songs You've Liked</h4>
              <p className="text-gray-400 mb-4">{likedSongs.length} songs ready for your playlist</p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {likedSongs.slice(0, 5).map((song) => (
                  <span 
                    key={song.id}
                    className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm"
                  >
                    {song.title}
                  </span>
                ))}
                {likedSongs.length > 5 && (
                  <span className="bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm">
                    +{likedSongs.length - 5} more
                  </span>
                )}
              </div>
              <Button
                onClick={handleGeneratePlaylist}
                disabled={createPlaylistMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist Now"}
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
