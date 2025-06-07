import { useState, useEffect } from "react";
import { Navigation, BottomNavigation } from "@/components/Navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { SwipeInterface } from "@/components/SwipeCard";
import { PlaylistDisplay } from "@/components/PlaylistDisplay";
import { Button } from "@/components/ui/button";
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
      const response = await apiRequest("POST", "/api/songs/generate", {
        prompt,
        excludeIds,
      });
      return await response.json();
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

        {/* Generate More Songs Button */}
        {currentIndex >= suggestions.length && suggestions.length > 0 && (
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
              {generateMoreSongsMutation.isPending ? "Generating..." : "Generate 50 More Songs"}
            </Button>
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

        {/* Show liked songs preview if no playlist generated yet */}
        {likedSongs.length > 0 && !generatedPlaylist && currentIndex < suggestions.length && (
          <div className="mb-8">
            <div className="text-center p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <h4 className="text-lg font-bold text-white mb-2">Songs You've Liked</h4>
              <p className="text-gray-400 mb-4">{likedSongs.length} songs ready for your playlist</p>
              <div className="flex flex-wrap gap-2 justify-center">
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
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
