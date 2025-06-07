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
    return {
      message: "I'm having trouble connecting right now, but I'd love to help you create an amazing playlist! Could you tell me what kind of vibe you're going for?",
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
          content: `You are a music recommendation AI. Based on the user's prompt, analyze what type of music they want and score the provided songs from 0-100 based on how well they match.

          Consider factors like:
          - Energy level (high energy for workouts, low for relaxation)
          - Mood (happy, sad, aggressive, calm)
          - Genre preferences
          - Context (workout, study, party, etc.)
          
          Return JSON with an array of song IDs scored 70+ that match their request, ordered by relevance:
          {
            "recommendations": ["songId1", "songId2", ...],
            "reasoning": "Brief explanation of why these songs match"
          }
          
          Limit to 8-12 recommendations maximum.`
        },
        {
          role: "user",
          content: `User prompt: "${prompt}"
          
          Available songs: ${JSON.stringify(MOCK_SONGS.map(s => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            genres: s.genres,
            energy: s.energy,
            valence: s.valence,
            tempo: s.tempo
          })))}
          
          Exclude these song IDs: ${excludeIds.join(", ")}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const recommendedIds = result.recommendations || [];
    
    // Filter and return the recommended songs
    const filteredSongs = MOCK_SONGS.filter(song => 
      recommendedIds.includes(song.id) && !excludeIds.includes(song.id)
    );
    
    // Sort by the order in recommendations
    const sortedSongs = recommendedIds
      .map((id: string) => filteredSongs.find(song => song.id === id))
      .filter(Boolean);
    
    return sortedSongs.slice(0, 12); // Limit to 12 songs
  } catch (error) {
    console.error("Error generating song suggestions:", error);
    
    // Fallback: return a random selection of songs
    const availableSongs = MOCK_SONGS.filter(song => !excludeIds.includes(song.id));
    const shuffled = availableSongs.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }
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
    
    // Fallback
    return {
      title: "Your Vibe Swipe Playlist",
      description: "A personalized mix based on your selections"
    };
  }
}
