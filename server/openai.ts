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
    
    // Return demo suggestions based on user input
    if (prompt.toLowerCase().includes('indie') || prompt.toLowerCase().includes('study')) {
      return {
        message: "Perfect! I've got some great indie tracks for studying. Let me show you some recommendations to swipe through:",
        suggestions: MOCK_SONGS.filter((song: Song) => 
          song.genres.includes('Indie') || 
          song.genres.includes('Alternative') ||
          (song.energy !== undefined && song.energy < 0.6)
        ).slice(0, 10)
      };
    }
    
    // For any other music request, provide a sample of songs
    if (prompt.toLowerCase().includes('music') || prompt.toLowerCase().includes('song') || prompt.toLowerCase().includes('playlist')) {
      return {
        message: "Great! I've curated some tracks based on your request. Start swiping to build your perfect playlist:",
        suggestions: MOCK_SONGS.slice(0, 12)
      };
    }
    
    return {
      message: "I'd love to help you create an amazing playlist! Try describing something like 'indie for studying' or 'upbeat workout music' to get started.",
    };
  }
}

export async function generateSongSuggestions(prompt: string, excludeIds: string[] = []): Promise<Song[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a music discovery AI that generates diverse, realistic song recommendations. Based on the user's prompt, create 50 unique songs that match their vibe.

          Generate songs that feel authentic with:
          - Real-sounding artist names (mix of established and emerging artists)
          - Believable song titles that match the genre/mood
          - Accurate genre classifications
          - Appropriate energy/valence/tempo values for the style
          - Varied release years and album names
          - Different artists (avoid repeating artists too much)
          
          Return JSON with exactly 50 songs:
          {
            "songs": [
              {
                "id": "unique_id",
                "title": "Song Title",
                "artist": "Artist Name",
                "album": "Album Name", 
                "duration": 180,
                "genres": ["Genre1", "Genre2"],
                "energy": 0.7,
                "valence": 0.6,
                "tempo": 120
              }
            ]
          }
          
          Energy: 0-1 (0=very calm, 1=very energetic)
          Valence: 0-1 (0=sad/angry, 1=happy/uplifting)
          Tempo: BPM (60-200 typical range)
          Duration: seconds (120-300 typical)`
        },
        {
          role: "user",
          content: `Generate 50 songs for this vibe: "${prompt}"
          
          Make sure each song feels unique and authentic. Vary the artists, song titles, and musical characteristics while staying true to the requested vibe.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const generatedSongs = result.songs || [];
    
    // Transform generated songs to match our Song interface
    const songs: Song[] = generatedSongs.map((song: any, index: number) => ({
      id: song.id || `generated_${Date.now()}_${index}`,
      title: song.title || "Unknown Song",
      artist: song.artist || "Unknown Artist", 
      album: song.album || "Unknown Album",
      albumArt: getRandomAlbumArt(),
      duration: song.duration || 180,
      genres: Array.isArray(song.genres) ? song.genres : ["Pop"],
      energy: typeof song.energy === 'number' ? song.energy : 0.5,
      valence: typeof song.valence === 'number' ? song.valence : 0.5,
      tempo: typeof song.tempo === 'number' ? song.tempo : 120,
    }));
    
    // Filter out excluded songs and return up to 50
    const filteredSongs = songs.filter(song => !excludeIds.includes(song.id));
    return filteredSongs.slice(0, 50);
    
  } catch (error) {
    console.error("Error generating song suggestions:", error);
    // Generate varied songs based on the prompt even without AI
    return generateFallbackSongs(prompt, excludeIds);
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

  // Determine genre based on prompt
  let selectedGenre = 'pop'; // default
  if (promptLower.includes('workout') || promptLower.includes('gym') || promptLower.includes('exercise')) {
    selectedGenre = 'workout';
  } else if (promptLower.includes('chill') || promptLower.includes('relax') || promptLower.includes('calm')) {
    selectedGenre = 'chill';
  } else if (promptLower.includes('indie') || promptLower.includes('alternative')) {
    selectedGenre = 'indie';
  } else if (promptLower.includes('electronic') || promptLower.includes('edm') || promptLower.includes('techno')) {
    selectedGenre = 'electronic';
  } else if (promptLower.includes('jazz') || promptLower.includes('blues') || promptLower.includes('smooth')) {
    selectedGenre = 'jazz';
  }

  const template = genreTemplates[selectedGenre as keyof typeof genreTemplates];
  const songs: Song[] = [];
  const timestamp = Date.now();

  // Generate 50 unique songs
  for (let i = 0; i < 50; i++) {
    const artist = template.artists[Math.floor(Math.random() * template.artists.length)];
    const title = template.titles[Math.floor(Math.random() * template.titles.length)];
    const genre = template.genres[Math.floor(Math.random() * template.genres.length)];
    
    // Add variation to make each song unique
    const uniqueTitle = `${title} ${i > 25 ? '(Remix)' : i > 40 ? '(Acoustic)' : ''}`.trim();
    const uniqueArtist = i % 7 === 0 ? `${artist} ft. Guest` : artist;
    
    const song: Song = {
      id: `${selectedGenre}_${timestamp}_${i}`,
      title: uniqueTitle,
      artist: uniqueArtist,
      album: `${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Collection Vol. ${Math.floor(i / 10) + 1}`,
      albumArt: getRandomAlbumArt(),
      duration: Math.floor(Math.random() * 120) + 180, // 3-5 minutes
      genres: [genre, template.genres[Math.floor(Math.random() * template.genres.length)]],
      energy: template.energy[0] + Math.random() * (template.energy[1] - template.energy[0]),
      valence: template.valence[0] + Math.random() * (template.valence[1] - template.valence[0]),
      tempo: Math.floor(template.tempo[0] + Math.random() * (template.tempo[1] - template.tempo[0]))
    };
    
    songs.push(song);
  }

  return songs.filter(song => !excludeIds.includes(song.id));
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
