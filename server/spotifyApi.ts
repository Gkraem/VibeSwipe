import type { Song } from "@shared/schema";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  preview_url?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  external_urls: {
    spotify: string;
  };
  tracks: {
    total: number;
  };
}

export class SpotifyService {
  private baseUrl = 'https://api.spotify.com/v1';

  async createPlaylist(
    accessToken: string,
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<SpotifyPlaylist> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create playlist: ${response.statusText}`);
    }

    return await response.json();
  }

  async addTracksToPlaylist(
    accessToken: string,
    playlistId: string,
    trackUris: string[]
  ): Promise<void> {
    // Spotify limits to 100 tracks per request
    const chunks = this.chunkArray(trackUris, 100);

    for (const chunk of chunks) {
      const response = await fetch(`${this.baseUrl}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: chunk,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add tracks to playlist: ${response.statusText}`);
      }
    }
  }

  async searchTracks(
    accessToken: string,
    query: string,
    limit: number = 20
  ): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search tracks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tracks?.items || [];
  }

  async findSpotifyTrack(
    accessToken: string,
    song: Song
  ): Promise<string | null> {
    try {
      // Search for the track using artist and title
      const query = `track:"${song.title}" artist:"${song.artist}"`;
      const tracks = await this.searchTracks(accessToken, query, 1);
      
      if (tracks.length > 0) {
        return tracks[0].external_urls.spotify;
      }

      // Fallback: search with just title and artist without quotes
      const fallbackQuery = `${song.title} ${song.artist}`;
      const fallbackTracks = await this.searchTracks(accessToken, fallbackQuery, 1);
      
      if (fallbackTracks.length > 0) {
        return fallbackTracks[0].external_urls.spotify;
      }

      return null;
    } catch (error) {
      console.error(`Error finding Spotify track for ${song.title}:`, error);
      return null;
    }
  }

  async exportPlaylistToSpotify(
    accessToken: string,
    userId: string,
    playlistName: string,
    songs: Song[],
    description?: string
  ): Promise<{ playlistUrl: string; successCount: number; totalCount: number }> {
    try {
      // Create the playlist
      const playlist = await this.createPlaylist(
        accessToken,
        userId,
        playlistName,
        description,
        false // Private by default
      );

      // Find Spotify URIs for each song
      const trackUris: string[] = [];
      let successCount = 0;

      for (const song of songs) {
        const spotifyUrl = await this.findSpotifyTrack(accessToken, song);
        if (spotifyUrl) {
          // Convert Spotify URL to URI format
          const trackId = spotifyUrl.split('/').pop();
          if (trackId) {
            trackUris.push(`spotify:track:${trackId}`);
            successCount++;
          }
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add tracks to the playlist
      if (trackUris.length > 0) {
        await this.addTracksToPlaylist(accessToken, playlist.id, trackUris);
      }

      return {
        playlistUrl: playlist.external_urls.spotify,
        successCount,
        totalCount: songs.length,
      };
    } catch (error) {
      console.error('Error exporting playlist to Spotify:', error);
      throw error;
    }
  }

  async getCurrentUser(accessToken: string): Promise<{ id: string; display_name: string }> {
    const response = await fetch(`${this.baseUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.statusText}`);
    }

    return await response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string }> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return await response.json();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const spotifyService = new SpotifyService();