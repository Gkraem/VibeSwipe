import type { Song } from "@shared/schema";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export interface SpotifyAuthResult {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class SpotifyWebAPI {
  private clientId: string;
  private accessToken: string | null = null;
  private player: any = null;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  // Use implicit grant flow for in-browser authentication
  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      const scopes = 'playlist-modify-public playlist-modify-private user-read-private user-read-email';
      const redirectUri = window.location.origin + '/spotify-callback';
      
      // Generate state for security
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('spotify_auth_state', state);
      
      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${this.clientId}&` +
        `response_type=token&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${state}&` +
        `show_dialog=true`;

      // Create popup for authentication
      const popup = window.open(
        authUrl,
        'spotify-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Listen for the callback
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          
          this.accessToken = event.data.access_token;
          resolve(event.data.access_token);
        } else if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);
    });
  }

  // Get current user's Spotify profile
  async getCurrentUser(): Promise<{ id: string; display_name: string }> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return response.json();
  }

  // Create a playlist
  async createPlaylist(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<{ id: string; external_urls: { spotify: string } }> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create playlist');
    }

    return response.json();
  }

  // Search for tracks
  async searchTrack(query: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search tracks');
    }

    const data = await response.json();
    return data.tracks.items[0] || null;
  }

  // Add tracks to playlist
  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    // Spotify allows max 100 tracks per request
    const chunks = this.chunkArray(trackUris, 100);

    for (const chunk of chunks) {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: chunk,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add tracks to playlist');
      }
    }
  }

  // Export our songs to Spotify playlist
  async exportPlaylistToSpotify(
    songs: Song[],
    playlistName: string,
    playlistDescription?: string
  ): Promise<{ success: true; playlistUrl: string }> {
    try {
      // Authenticate if needed
      if (!this.accessToken) {
        await this.authenticate();
      }

      // Get user profile
      const user = await this.getCurrentUser();

      // Create playlist
      const playlist = await this.createPlaylist(
        user.id,
        playlistName,
        playlistDescription,
        false
      );

      // Search for each song and collect Spotify URIs
      const trackUris: string[] = [];
      for (const song of songs) {
        try {
          const searchQuery = `track:"${song.title}" artist:"${song.artist}"`;
          const track = await this.searchTrack(searchQuery);
          if (track) {
            trackUris.push(track.uri);
          }
        } catch (error) {
          console.warn(`Could not find track: ${song.title} by ${song.artist}`);
        }
      }

      if (trackUris.length === 0) {
        throw new Error('No tracks found on Spotify');
      }

      // Add tracks to playlist
      await this.addTracksToPlaylist(playlist.id, trackUris);

      return {
        success: true,
        playlistUrl: playlist.external_urls.spotify,
      };
    } catch (error) {
      console.error('Error exporting to Spotify:', error);
      throw error;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Create singleton instance
let spotifyWebAPI: SpotifyWebAPI | null = null;

export const getSpotifyWebAPI = (): SpotifyWebAPI => {
  if (!spotifyWebAPI) {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '5ecd192a6f6547eebcff5ec9b8cca45d';
    spotifyWebAPI = new SpotifyWebAPI(clientId);
  }
  return spotifyWebAPI;
};