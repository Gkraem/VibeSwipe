import OpenAI from "openai";
import type { Song } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface PlaylistRequest {
  prompt: string;
  userPreferences?: {
    genres?: string[];
    energy?: 'low' | 'medium' | 'high';
    mood?: string;
  };
  excludeSongs?: string[]; // Song IDs to exclude
}

export interface AIResponse {
  message: string;
  suggestions?: Song[];
  playlistTitle?: string;
  playlistDescription?: string;
}

// Mock song database - in a real app, this would come from Spotify/Apple Music APIs
const MOCK_SONGS: Song[] = [
  {
    id: "1",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 203,
    genres: ["Pop", "Dance Pop"],
    energy: 0.8,
    valence: 0.9,
    tempo: 103
  },
  {
    id: "2",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 200,
    genres: ["Synthpop", "Pop"],
    energy: 0.8,
    valence: 0.6,
    tempo: 171
  },
  {
    id: "3",
    title: "Thunder",
    artist: "Imagine Dragons",
    album: "Evolve",
    albumArt: "https://pixabay.com/get/g275180e00945f87f9aa1eaa273e724d607d1dde54c3544600b2f7deed91fc4a6205782f97263026cc2de31dbed35c681a881eb05a8596b4a047ec61dfdbb9984_1280.jpg",
    duration: 187,
    genres: ["Pop Rock", "Alternative"],
    energy: 0.9,
    valence: 0.7,
    tempo: 168
  },
  {
    id: "4",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 178,
    genres: ["Pop Punk", "Alternative Pop"],
    energy: 0.9,
    valence: 0.8,
    tempo: 166
  },
  {
    id: "5",
    title: "Heat Waves",
    artist: "Glass Animals",
    album: "Dreamland",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 238,
    genres: ["Indie Pop", "Psychedelic Pop"],
    energy: 0.6,
    valence: 0.7,
    tempo: 80
  },
  {
    id: "6",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    albumArt: "https://pixabay.com/get/g5ee28429a8f7da49d960b7b6905e309b70350f7d51cf8c5048924ab6a8a4a075b964d8b626b18872f5f936ed4b18acf900ee5c5520dcb25a53b97cae93c81cbb_1280.jpg",
    duration: 167,
    genres: ["Pop", "Indie Pop"],
    energy: 0.7,
    valence: 0.6,
    tempo: 173
  },
  {
    id: "7",
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    album: "Stay",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 141,
    genres: ["Pop", "Hip Hop"],
    energy: 0.8,
    valence: 0.8,
    tempo: 169
  },
  {
    id: "8",
    title: "Industry Baby",
    artist: "Lil Nas X ft. Jack Harlow",
    album: "MONTERO",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 212,
    genres: ["Hip Hop", "Pop Rap"],
    energy: 0.9,
    valence: 0.9,
    tempo: 149
  },
  {
    id: "9",
    title: "Bad Habits",
    artist: "Ed Sheeran",
    album: "=",
    albumArt: "https://pixabay.com/get/g275180e00945f87f9aa1eaa273e724d607d1dde54c3544600b2f7deed91fc4a6205782f97263026cc2de31dbed35c681a881eb05a8596b4a047ec61dfdbb9984_1280.jpg",
    duration: 231,
    genres: ["Pop", "Dance Pop"],
    energy: 0.8,
    valence: 0.7,
    tempo: 126
  },
  {
    id: "10",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 174,
    genres: ["Pop", "Rock"],
    energy: 0.8,
    valence: 0.9,
    tempo: 95
  },
  {
    id: "11",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    album: "Midnights",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 200,
    genres: ["Pop", "Synth Pop"],
    energy: 0.6,
    valence: 0.4,
    tempo: 97
  },
  {
    id: "12",
    title: "Flowers",
    artist: "Miley Cyrus",
    album: "Endless Summer Vacation",
    albumArt: "https://pixabay.com/get/g5ee28429a8f7da49d960b7b6905e309b70350f7d51cf8c5048924ab6a8a4a075b964d8b626b18872f5f936ed4b18acf900ee5c5520dcb25a53b97cae93c81cbb_1280.jpg",
    duration: 200,
    genres: ["Pop", "Rock"],
    energy: 0.7,
    valence: 0.8,
    tempo: 96
  },
  {
    id: "13",
    title: "Unholy",
    artist: "Sam Smith ft. Kim Petras",
    album: "Gloria",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 156,
    genres: ["Pop", "Dance"],
    energy: 0.8,
    valence: 0.6,
    tempo: 132
  },
  {
    id: "14",
    title: "About Damn Time",
    artist: "Lizzo",
    album: "Special",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 193,
    genres: ["Pop", "Funk"],
    energy: 0.9,
    valence: 0.9,
    tempo: 109
  },
  {
    id: "15",
    title: "Running Up That Hill",
    artist: "Kate Bush",
    album: "Hounds of Love",
    albumArt: "https://pixabay.com/get/g275180e00945f87f9aa1eaa273e724d607d1dde54c3544600b2f7deed91fc4a6205782f97263026cc2de31dbed35c681a881eb05a8596b4a047ec61dfdbb9984_1280.jpg",
    duration: 300,
    genres: ["Art Pop", "Synth Pop"],
    energy: 0.7,
    valence: 0.5,
    tempo: 127
  },
  {
    id: "16",
    title: "Shivers",
    artist: "Ed Sheeran",
    album: "=",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 207,
    genres: ["Pop", "Dance Pop"],
    energy: 0.8,
    valence: 0.8,
    tempo: 141
  },
  {
    id: "17",
    title: "Easy On Me",
    artist: "Adele",
    album: "30",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 224,
    genres: ["Pop", "Soul"],
    energy: 0.4,
    valence: 0.3,
    tempo: 66
  },
  {
    id: "18",
    title: "Peaches",
    artist: "Justin Bieber ft. Daniel Caesar & Giveon",
    album: "Justice",
    albumArt: "https://pixabay.com/get/g5ee28429a8f7da49d960b7b6905e309b70350f7d51cf8c5048924ab6a8a4a075b964d8b626b18872f5f936ed4b18acf900ee5c5520dcb25a53b97cae93c81cbb_1280.jpg",
    duration: 198,
    genres: ["Pop", "R&B"],
    energy: 0.6,
    valence: 0.8,
    tempo: 90
  },
  {
    id: "19",
    title: "Montero (Call Me By Your Name)",
    artist: "Lil Nas X",
    album: "MONTERO",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 137,
    genres: ["Pop", "Hip Hop"],
    energy: 0.8,
    valence: 0.7,
    tempo: 150
  },
  {
    id: "20",
    title: "drivers license",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    duration: 242,
    genres: ["Pop", "Indie Pop"],
    energy: 0.4,
    valence: 0.2,
    tempo: 144
  }
];

export async function generateChatResponse(prompt: string): Promise<AIResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a friendly AI music curator for "Vibe Swipe", an AI playlist generator. 
          
          Your role is to:
          1. Understand user's music preferences and mood
          2. Provide encouraging and enthusiastic responses
          3. Suggest that they can start swiping through song recommendations
          4. Keep responses conversational and under 100 words
          
          Respond with JSON in this format:
          {
            "message": "Your response message",
            "shouldShowSuggestions": true/false
          }
          
          If the user describes a clear music preference, set shouldShowSuggestions to true.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      message: result.message || "I'd love to help you create the perfect playlist! Tell me more about what you're looking for.",
      suggestions: result.shouldShowSuggestions ? await generateSongSuggestions(prompt) : undefined
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // When OpenAI fails, generate songs directly from Spotify for any request
    const dynamicSongs = await generateSongSuggestions(prompt);
    return {
      message: "I've found some great tracks for you! Start swiping to discover your perfect playlist:",
      suggestions: dynamicSongs
    };
  }
}

export async function generateSongSuggestions(prompt: string, excludeIds: string[] = []): Promise<Song[]> {
  try {
    // Use OpenAI to generate a curated list of 40 songs initially (to account for filtering)
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a music expert curator. Generate exactly 40 high-quality song recommendations based on the user's request. Focus on popular, well-known songs that are available on major streaming platforms like Spotify. Return your response as a JSON object with a "songs" array containing objects with: title, artist, album (optional), genres (array of 1-3 genres), energy (0-1), valence (0-1), duration (in seconds, typical range 180-300).

Example format:
{
  "songs": [
    {
      "title": "Someone Like You",
      "artist": "Adele",
      "album": "21",
      "genres": ["pop", "soul"],
      "energy": 0.3,
      "valence": 0.2,
      "duration": 285
    }
  ]
}

Make sure all songs are real, popular tracks that are definitely available on Spotify. Avoid obscure or made-up songs.`
        },
        {
          role: "user",
          content: `Generate 40 songs for: ${prompt}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"songs": []}');
    const songs: Song[] = [];
    
    if (result.songs && Array.isArray(result.songs)) {
      // Process all songs from the result (up to 40)
      const songsToProcess = result.songs.length;
      
      for (let i = 0; i < songsToProcess && songs.length < 25; i++) {
        const songData = result.songs[i];
        if (!songData.title || !songData.artist) continue;
        
        // Create unique ID for the song
        const songId = `ai-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Skip if this song ID is in excludeIds
        if (excludeIds.includes(songId)) continue;
        
        // Get both album art and preview URL from Spotify
        const spotifyToken = await getSpotifyClientToken();
        const spotifyData = spotifyToken 
          ? await getSpotifyTrackData(songData.title, songData.artist, spotifyToken)
          : { albumArt: null, previewUrl: null };
        
        console.log(`Spotify data for "${songData.title}" by "${songData.artist}":`, {
          hasToken: !!spotifyToken,
          albumArt: !!spotifyData.albumArt,
          previewUrl: !!spotifyData.previewUrl,
          previewUrlValue: spotifyData.previewUrl
        });

        // Only include songs that have both album art AND preview URL
        if (!spotifyData.albumArt || !spotifyData.previewUrl) {
          console.log(`Skipping "${songData.title}" by "${songData.artist}" - missing album art or preview URL`);
          continue;
        }

        const song: Song = {
          id: songId,
          title: songData.title,
          artist: songData.artist,
          album: songData.album || `${songData.artist} - Singles`,
          albumArt: spotifyData.albumArt,
          duration: songData.duration || Math.floor(Math.random() * 120) + 180, // 3-5 minutes
          genres: Array.isArray(songData.genres) ? songData.genres.slice(0, 3) : ['pop'],
          energy: typeof songData.energy === 'number' ? songData.energy : Math.random() * 0.6 + 0.2,
          valence: typeof songData.valence === 'number' ? songData.valence : Math.random() * 0.6 + 0.2,
          previewUrl: spotifyData.previewUrl
        };
        
        songs.push(song);
      }
    }
    
    // Ensure we always return exactly 25 songs by requesting more if needed
    let attempts = 0;
    const maxAttempts = 3;
    
    while (songs.length < 25 && attempts < maxAttempts) {
      attempts++;
      const additionalNeeded = Math.max(25 - songs.length, 20); // Request at least 20 to account for filtering
      console.log(`Generated ${songs.length} songs, requesting ${additionalNeeded} more (attempt ${attempts})...`);
      
      const additionalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Generate exactly ${additionalNeeded} more songs for the same request. Focus on very popular, mainstream tracks that are definitely available on Spotify. Return as JSON with "songs" array. Make sure all songs are real, popular tracks from well-known artists.`
          },
          {
            role: "user",
            content: `Generate ${additionalNeeded} additional songs for: ${prompt}`
          }
        ],
        response_format: { type: "json_object" },
      });
      
      const additionalResult = JSON.parse(additionalResponse.choices[0].message.content || '{"songs": []}');
      
      if (additionalResult.songs && Array.isArray(additionalResult.songs)) {
        for (let i = 0; i < additionalResult.songs.length && songs.length < 25; i++) {
          const songData = additionalResult.songs[i];
          if (!songData.title || !songData.artist) continue;
          
          const songId = `ai-${Date.now()}-${songs.length}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Get both album art and preview URL from Spotify
          const spotifyToken = await getSpotifyClientToken();
          const spotifyData = spotifyToken 
            ? await getSpotifyTrackData(songData.title, songData.artist, spotifyToken)
            : { albumArt: null, previewUrl: null };
          
          console.log(`Additional Spotify data for "${songData.title}" by "${songData.artist}":`, {
            hasToken: !!spotifyToken,
            albumArt: !!spotifyData.albumArt,
            previewUrl: !!spotifyData.previewUrl,
            previewUrlValue: spotifyData.previewUrl
          });

          // Only include songs that have both album art AND preview URL
          if (!spotifyData.albumArt || !spotifyData.previewUrl) {
            console.log(`Skipping additional song "${songData.title}" by "${songData.artist}" - missing album art or preview URL`);
            continue;
          }

          const song: Song = {
            id: songId,
            title: songData.title,
            artist: songData.artist,
            album: songData.album || `${songData.artist} - Singles`,
            albumArt: spotifyData.albumArt,
            duration: songData.duration || Math.floor(Math.random() * 120) + 180,
            genres: Array.isArray(songData.genres) ? songData.genres.slice(0, 3) : ['pop'],
            energy: typeof songData.energy === 'number' ? songData.energy : Math.random() * 0.6 + 0.2,
            valence: typeof songData.valence === 'number' ? songData.valence : Math.random() * 0.6 + 0.2,
            previewUrl: spotifyData.previewUrl
          };
          
          songs.push(song);
        }
      }
    }
    
    console.log(`AI Response: Generated ${songs.length} songs for prompt: "${prompt}"`);
    return songs;
    
  } catch (error) {
    console.error("OpenAI song generation failed:", error);
    throw new Error("OpenAI API quota exceeded. Please provide a valid API key with available credits to generate song recommendations.");
  }
}

// Get Spotify client credentials token for public API access
async function getSpotifyClientToken(): Promise<string | null> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      console.error('Failed to get Spotify token');
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return null;
  }
}

// Get both album art and preview URL from Spotify for a specific song
async function getSpotifyTrackData(title: string, artist: string, token: string): Promise<{ albumArt: string | null; previewUrl: string | null }> {
  try {
    const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return { albumArt: null, previewUrl: null };
    }

    const data = await response.json();
    
    if (data.tracks?.items?.length > 0) {
      const track = data.tracks.items[0];
      const albumArt = track.album?.images?.length > 0 
        ? (track.album.images.find((img: any) => img.width === 300) || track.album.images[0]).url
        : null;
      
      // If Spotify doesn't have preview URL, try to get iTunes audio
      let previewUrl = track.preview_url || null;
      if (!previewUrl) {
        previewUrl = await getITunesAudioPreview(title, artist);
      }
      
      return { 
        albumArt, 
        previewUrl 
      };
    }

    return { albumArt: null, previewUrl: null };
  } catch (error) {
    console.error('Error fetching Spotify track data:', error);
    return { albumArt: null, previewUrl: null };
  }
}

// Get iTunes audio preview for a song
async function getITunesAudioPreview(title: string, artist: string): Promise<string | null> {
  try {
    // iTunes Search API doesn't require authentication and provides 30-second previews
    const searchQuery = encodeURIComponent(`${title} ${artist}`);
    const itunesSearchUrl = `https://itunes.apple.com/search?term=${searchQuery}&media=music&entity=song&limit=5`;
    
    const response = await fetch(itunesSearchUrl);
    if (!response.ok) {
      console.log('iTunes API request failed');
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Find the best match
      for (const track of data.results) {
        const trackTitle = track.trackName?.toLowerCase() || '';
        const artistName = track.artistName?.toLowerCase() || '';
        const titleLower = title.toLowerCase();
        const artistLower = artist.toLowerCase();
        
        // Check for close matches
        if (trackTitle.includes(titleLower) || titleLower.includes(trackTitle)) {
          if (artistName.includes(artistLower) || artistLower.includes(artistName)) {
            if (track.previewUrl) {
              console.log(`Found iTunes preview for "${title}" by "${artist}":`, track.previewUrl);
              return track.previewUrl;
            }
          }
        }
      }
      
      // If no exact match, try the first result with a preview
      for (const track of data.results) {
        if (track.previewUrl) {
          console.log(`Using iTunes preview for similar track: "${track.trackName}" by "${track.artistName}"`);
          return track.previewUrl;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting iTunes preview:', error);
    return null;
  }
}

// Alternative preview URL generation using iTunes
async function getAlternativePreviewUrl(title: string, artist: string): Promise<string | null> {
  // First try iTunes API
  const itunesPreview = await getITunesAudioPreview(title, artist);
  if (itunesPreview) return itunesPreview;
  
  // Then try alternative Spotify search
  try {
    const spotifyToken = await getSpotifyClientToken();
    if (!spotifyToken) return null;
    
    // Try alternative search queries
    const searchQueries = [
      `${title} ${artist}`,
      `${title}`,
      `${artist} ${title}`
    ];
    
    for (const query of searchQueries) {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=5`, {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.tracks?.items?.length > 0) {
          for (const track of data.tracks.items) {
            if (track.preview_url) {
              console.log(`Found preview URL with alternative search for "${title}":`, track.preview_url);
              return track.preview_url;
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting alternative preview:', error);
    return null;
  }
}

// Get album art from Spotify for a specific song (backwards compatibility)
async function getSpotifyAlbumArt(title: string, artist: string, token: string): Promise<string | null> {
  const { albumArt } = await getSpotifyTrackData(title, artist, token);
  return albumArt;
}

// Get real album art from Spotify
async function getAlbumArtFromSpotify(title: string, artist: string): Promise<string> {
  try {
    const token = await getSpotifyClientToken();
    if (!token) return "https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Music";
    
    // Try multiple search strategies for better match rates
    const searchQueries = [
      `track:"${title}" artist:"${artist}"`,
      `"${title}" "${artist}"`,
      `${title} ${artist}`,
      title // fallback to just the title
    ];
    
    for (const query of searchQueries) {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tracks?.items?.length > 0) {
          // Look for exact or close matches
          for (const track of data.tracks.items) {
            const trackTitle = track.name.toLowerCase();
            const trackArtist = track.artists[0]?.name.toLowerCase();
            const searchTitle = title.toLowerCase();
            const searchArtist = artist.toLowerCase();
            
            // Check for reasonable match
            if ((trackTitle.includes(searchTitle) || searchTitle.includes(trackTitle)) &&
                (trackArtist.includes(searchArtist) || searchArtist.includes(trackArtist))) {
              if (track.album?.images?.[0]) {
                return track.album.images[0].url;
              }
            }
          }
          
          // If no exact match, use first result if it has an image
          if (data.tracks.items[0]?.album?.images?.[0]) {
            return data.tracks.items[0].album.images[0].url;
          }
        }
      }
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.log(`Could not fetch album art for ${title} by ${artist}`);
  }
  
  return "https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Music";
}



// Generate search queries for Spotify based on user prompt
function generateSearchQueries(prompt: string): string[] {
  const promptLower = prompt.toLowerCase();
  const queries: string[] = [];
  
  // Genre-specific search terms
  if (promptLower.includes('workout') || promptLower.includes('gym') || promptLower.includes('exercise')) {
    queries.push('genre:electronic genre:hip-hop high energy', 'workout playlist', 'gym music', 'fitness motivation', 'cardio beats');
  } else if (promptLower.includes('chill') || promptLower.includes('relax') || promptLower.includes('calm')) {
    queries.push('genre:chill genre:lo-fi', 'chill out', 'relaxing music', 'ambient chill', 'study music');
  } else if (promptLower.includes('indie') || promptLower.includes('alternative')) {
    queries.push('genre:indie genre:alternative', 'indie rock', 'indie pop', 'alternative rock', 'indie folk');
  } else if (promptLower.includes('electronic') || promptLower.includes('edm') || promptLower.includes('techno')) {
    queries.push('genre:electronic genre:edm', 'house music', 'techno beats', 'dance music', 'electronic dance');
  } else if (promptLower.includes('jazz') || promptLower.includes('blues') || promptLower.includes('smooth')) {
    queries.push('genre:jazz genre:blues', 'smooth jazz', 'jazz standards', 'blues classics', 'contemporary jazz');
  } else if (promptLower.includes('pop') || promptLower.includes('mainstream')) {
    queries.push('genre:pop', 'top hits', 'popular music', 'chart toppers', 'mainstream pop');
  } else if (promptLower.includes('rock') || promptLower.includes('metal')) {
    queries.push('genre:rock genre:metal', 'classic rock', 'modern rock', 'alternative rock', 'indie rock');
  } else {
    // General popular music queries
    queries.push('genre:pop', 'top hits 2023', 'popular songs', 'chart music', 'trending music');
  }
  
  return queries;
}

// Determine genres based on prompt
function determineGenresFromPrompt(prompt: string): string[] {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('workout') || promptLower.includes('gym')) {
    return ['Electronic', 'Hip Hop', 'Pop'];
  } else if (promptLower.includes('chill') || promptLower.includes('relax')) {
    return ['Chill', 'Lo-fi', 'Ambient'];
  } else if (promptLower.includes('indie')) {
    return ['Indie', 'Alternative', 'Indie Pop'];
  } else if (promptLower.includes('electronic') || promptLower.includes('edm')) {
    return ['Electronic', 'EDM', 'House'];
  } else if (promptLower.includes('jazz')) {
    return ['Jazz', 'Smooth Jazz', 'Blues'];
  } else if (promptLower.includes('rock')) {
    return ['Rock', 'Alternative Rock', 'Indie Rock'];
  } else {
    return ['Pop', 'Alternative', 'Indie'];
  }
}

// Get curated Spotify tracks for specific genres
async function getCuratedSpotifyTracks(prompt: string, needed: number, seenTracks: Set<string>, excludeIds: string[], spotifyToken: string): Promise<Song[]> {
  const { spotifyService } = await import('./spotifyApi');
  const songs: Song[] = [];
  
  // Well-known artists for different genres to ensure we get real tracks
  const curatedQueries = getCuratedQueriesForPrompt(prompt);
  
  for (const query of curatedQueries) {
    if (songs.length >= needed) break;
    
    try {
      const tracks = await spotifyService.searchTracks(spotifyToken, query, 5);
      
      for (const track of tracks) {
        if (songs.length >= needed) break;
        
        const trackKey = `${track.name.toLowerCase()}-${track.artists[0].name.toLowerCase()}`;
        
        if (seenTracks.has(trackKey) || excludeIds.includes(track.id)) {
          continue;
        }
        
        seenTracks.add(trackKey);
        
        const song: Song = {
          id: track.id,
          title: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          albumArt: track.album.images[0]?.url || "https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Music",
          duration: Math.floor(track.duration_ms / 1000),
          genres: determineGenresFromPrompt(prompt),
          energy: Math.random() * 0.4 + 0.5,
          valence: Math.random() * 0.6 + 0.3,
          tempo: Math.floor(Math.random() * 60) + 90,
          previewUrl: track.preview_url || undefined
        };
        
        songs.push(song);
      }
    } catch (error) {
      console.error(`Error with curated query "${query}":`, error);
      continue;
    }
  }
  
  return songs;
}

// Get curated search queries for well-known artists
function getCuratedQueriesForPrompt(prompt: string): string[] {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('workout') || promptLower.includes('gym')) {
    return ['artist:Calvin Harris', 'artist:Skrillex', 'artist:Eminem', 'artist:Kanye West', 'artist:The Weeknd'];
  } else if (promptLower.includes('chill') || promptLower.includes('relax')) {
    return ['artist:Billie Eilish', 'artist:Lorde', 'artist:Bon Iver', 'artist:Phoebe Bridgers', 'artist:Clairo'];
  } else if (promptLower.includes('indie')) {
    return ['artist:Arctic Monkeys', 'artist:Tame Impala', 'artist:Mac Miller', 'artist:Rex Orange County', 'artist:Boy Pablo'];
  } else if (promptLower.includes('electronic')) {
    return ['artist:Daft Punk', 'artist:Deadmau5', 'artist:Porter Robinson', 'artist:Flume', 'artist:ODESZA'];
  } else if (promptLower.includes('jazz')) {
    return ['artist:Miles Davis', 'artist:John Coltrane', 'artist:Norah Jones', 'artist:Diana Krall', 'artist:Esperanza Spalding'];
  } else if (promptLower.includes('rock')) {
    return ['artist:Foo Fighters', 'artist:Red Hot Chili Peppers', 'artist:Imagine Dragons', 'artist:Twenty One Pilots', 'artist:Fall Out Boy'];
  } else {
    return ['artist:Taylor Swift', 'artist:Dua Lipa', 'artist:Harry Styles', 'artist:Olivia Rodrigo', 'artist:The Weeknd'];
  }
}

// Generate fallback songs that vary based on user prompt
function generateFallbackSongs(prompt: string, excludeIds: string[] = []): Song[] {
  const promptLower = prompt.toLowerCase();
  
  // Define genre-specific song databases
  const genreTemplates = {
    workout: {
      artists: ["FitBeats", "PowerPulse", "GymFlow", "MotivateMe", "EnergyBoost", "PumpUp", "DriveForce", "MaxPower"],
      titles: ["Push Through", "Never Give Up", "Beast Mode", "Unstoppable", "Rise Up", "Go Hard", "No Limits", "Champion"],
      genres: ["Electronic", "Hip Hop", "Rock"],
      energy: [0.8, 0.9],
      valence: [0.7, 0.9],
      tempo: [120, 160]
    },
    chill: {
      artists: ["ChillVibes", "MellowWaves", "SoftSounds", "CalmBreeze", "RelaxMode", "PeacefulBeats", "TranquilTones"],
      titles: ["Floating", "Peaceful Mind", "Sunset Dreams", "Quiet Moments", "Slow Motion", "Drift Away", "Serenity"],
      genres: ["Lo-fi", "Ambient", "Indie"],
      energy: [0.2, 0.5],
      valence: [0.4, 0.7],
      tempo: [60, 100]
    },
    indie: {
      artists: ["The Dreamers", "Velvet Echo", "Midnight Canvas", "Golden Hours", "Paper Hearts", "Neon Nights"],
      titles: ["Coffee Shop Dreams", "Vintage Soul", "City Lights", "Lost in Time", "Paper Planes", "Autumn Rain"],
      genres: ["Indie Pop", "Alternative", "Indie Rock"],
      energy: [0.5, 0.7],
      valence: [0.5, 0.8],
      tempo: [90, 130]
    },
    electronic: {
      artists: ["SynthWave", "DigitalDreams", "NeonPulse", "CyberBeats", "ElectroFlow", "FutureSound"],
      titles: ["Digital Love", "Neon Nights", "Electric Dreams", "Cyber City", "Pulse Wave", "Future Shock"],
      genres: ["Electronic", "Synthwave", "EDM"],
      energy: [0.7, 0.9],
      valence: [0.6, 0.9],
      tempo: [110, 150]
    },
    jazz: {
      artists: ["Blue Note Collective", "Smooth Sounds", "Jazz Lounge", "Midnight Sessions", "Soul Kitchen"],
      titles: ["Blue Monday", "Smooth Operator", "Late Night", "City Jazz", "Velvet Voice", "Swing Time"],
      genres: ["Jazz", "Smooth Jazz", "Blues"],
      energy: [0.3, 0.6],
      valence: [0.4, 0.7],
      tempo: [80, 120]
    },
    pop: {
      artists: ["Pop Stars", "Chart Toppers", "Hit Makers", "Radio Ready", "Mainstream", "Billboard"],
      titles: ["Summer Nights", "Feel Good", "Dance Floor", "Good Vibes", "Party Time", "Catch Me"],
      genres: ["Pop", "Dance Pop", "Electropop"],
      energy: [0.6, 0.8],
      valence: [0.7, 0.9],
      tempo: [100, 140]
    }
  };

  // Add more specific genre templates for different moods
  const sadGenreTemplate = {
    artists: ["Adele", "Sam Smith", "Lewis Capaldi", "Billie Eilish", "The Weeknd", "Lana Del Rey", "Johnny Cash", "Hurt", "Mad World", "Skinny Love"],
    titles: ["Someone Like You", "Too Good At Goodbyes", "Someone You Loved", "When The Party's Over", "Call Out My Name", "Video Games", "Hurt", "Mad World", "Skinny Love", "Black"],
    genres: ["Pop", "Alternative", "Indie"],
    energy: [0.1, 0.4],
    valence: [0.1, 0.3],
    tempo: [60, 90]
  };

  const breakupGenreTemplate = {
    artists: ["Taylor Swift", "Olivia Rodrigo", "Adele", "Amy Winehouse", "The 1975", "Giveon", "Harry Styles", "Tate McRae"],
    titles: ["All Too Well", "Drivers License", "Someone Like You", "Back to Black", "Somebody Else", "Heartbreak Anniversary", "Falling", "You Broke Me First"],
    genres: ["Pop", "Alternative", "R&B"],
    energy: [0.2, 0.5],
    valence: [0.1, 0.4],
    tempo: [70, 100]
  };

  // Return empty array when no OpenAI available to maintain data integrity
  console.log("OpenAI not available for song generation - returning empty result");
  return [];
}

export async function generatePlaylistFromLikedSongs(likedSongs: Song[], originalPrompt: string): Promise<{ title: string; description: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Based on the user's original request and their liked songs, generate a creative playlist title and description.
          
          Return JSON in this format:
          {
            "title": "Creative playlist title (under 50 characters)",
            "description": "Engaging description explaining the vibe and energy (under 150 characters)"
          }`
        },
        {
          role: "user",
          content: `Original request: "${originalPrompt}"
          
          Liked songs: ${likedSongs.map(s => `${s.title} by ${s.artist}`).join(", ")}
          
          Create a playlist title and description that captures the essence of these songs and the user's request.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      title: result.title || "Your AI-Generated Playlist",
      description: result.description || "A personalized mix curated just for you"
    };
  } catch (error) {
    console.error("Error generating playlist metadata:", error);
    
    // Generate fallback based on user's original request and liked songs
    const genres = [...new Set(likedSongs.flatMap(song => song.genres))];
    const mainGenre = genres[0] || "Music";
    
    let title = "Your Vibe Swipe Playlist";
    if (originalPrompt.toLowerCase().includes('study')) {
      title = `${mainGenre} Study Session`;
    } else if (originalPrompt.toLowerCase().includes('workout')) {
      title = `${mainGenre} Workout Mix`;
    } else if (originalPrompt.toLowerCase().includes('chill')) {
      title = `Chill ${mainGenre} Vibes`;
    } else if (genres.length > 0) {
      title = `${mainGenre} Mix`;
    }
    
    return {
      title,
      description: `A personalized ${likedSongs.length}-track playlist based on your music preferences`
    };
  }
}
