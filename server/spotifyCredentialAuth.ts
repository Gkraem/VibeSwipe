import { storage } from "./storage";

export interface SpotifyCredentials {
  username: string;
  password: string;
}

export async function getSpotifyAccessTokenFromCredentials(
  userId: string, 
  spotifyUsername?: string, 
  spotifyPassword?: string
): Promise<string | null> {
  try {
    // If credentials provided directly, use them
    if (spotifyUsername && spotifyPassword) {
      return await authenticateWithSpotify(spotifyUsername, spotifyPassword);
    }

    // Otherwise get from user's stored credentials
    const user = await storage.getUser(userId);
    if (!user?.spotifyUsername || !user?.spotifyPassword) {
      return null;
    }

    // Note: In a real implementation, you would need to use Spotify's actual authentication
    // For now, we'll use the OAuth flow but this structure is ready for credential auth
    return null;
  } catch (error) {
    console.error("Spotify credential authentication failed:", error);
    return null;
  }
}

async function authenticateWithSpotify(username: string, password: string): Promise<string | null> {
  // Note: Spotify doesn't officially support username/password authentication for third-party apps
  // This would require using unofficial methods or browser automation
  // For now, we'll return null and fall back to OAuth
  console.log("Direct Spotify credential auth not implemented - using OAuth fallback");
  return null;
}

export function hasSpotifyCredentials(user: any): boolean {
  return !!(user?.spotifyUsername && user?.spotifyPassword);
}